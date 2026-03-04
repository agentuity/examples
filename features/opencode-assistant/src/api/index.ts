import { createRouter, validator, sse } from '@agentuity/runtime';
import {
	StartInput,
	StartResponse,
	StatusResponse,
	AskInput,
	AskResponse,
	StopResponse,
	StreamEventOutput,
} from '@lib/types';
import type { AssistantState } from '@lib/types';
import { authHeader, checkHealth, checkWorkspaceFiles, createSession, sendPrompt } from '@lib/opencode';

const KV_NAMESPACE = 'opencode';
const KV_KEY = 'assistant';

const api = createRouter();

// GET /api/status — Check if workspace exists and is healthy
api.get('/status', validator({ output: StatusResponse }), async (c) => {
	const { kv, sandbox, logger } = c.var;

	// --- Agentuity KV: Read persisted workspace state ---
	const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
	if (!result.exists) {
		return c.json({ exists: false });
	}

	const state = result.data;

	// --- OpenCode: Verify the server inside the sandbox is reachable ---
	const ready = await checkHealth(state.serverUrl, state.password);

	if (!ready) {
		logger.warn('Status probe failed, clearing stale state', { sandboxId: state.sandboxId });
		// --- Agentuity Sandbox: Destroy unreachable sandbox ---
		try {
			await sandbox.destroy(state.sandboxId);
		} catch (err) {
			logger.warn('Failed to destroy stale sandbox', { error: String(err) });
		}
		await kv.delete(KV_NAMESPACE, KV_KEY);
		return c.json({ exists: false });
	}

	return c.json({ exists: true, repoUrl: state.repoUrl, ready: true });
});

// POST /api/start — Create sandbox, clone repo, start OpenCode, create session
api.post('/start', validator({ input: StartInput, output: StartResponse }), async (c) => {
	const { logger, kv, sandbox } = c.var;
	const { repoUrl } = c.req.valid('json');

	// Basic URL validation
	try {
		const parsed = new URL(repoUrl);
		if (parsed.protocol !== 'https:') {
			return c.json({ ready: false, repoUrl, sessionId: '' }, 400);
		}
	} catch {
		return c.json({ ready: false, repoUrl, sessionId: '' }, 400);
	}

	// --- Agentuity KV: Check for existing healthy workspace (rehydration) ---
	const existing = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
	if (existing.exists) {
		// --- OpenCode: Verify existing workspace is still alive ---
		const alive = await checkHealth(existing.data.serverUrl, existing.data.password);

		if (alive) {
			logger.info('Workspace already running', { sandboxId: existing.data.sandboxId });
			return c.json({
				ready: true,
				repoUrl: existing.data.repoUrl,
				sessionId: existing.data.sessionId,
			});
		}

		// Stale: clean up
		logger.warn('Stale workspace detected, cleaning up');
		try {
			await sandbox.destroy(existing.data.sandboxId);
		} catch (err) {
			logger.warn('Failed to destroy stale sandbox', { error: String(err) });
		}
		await kv.delete(KV_NAMESPACE, KV_KEY);
	}

	const password = crypto.randomUUID();
	logger.info('Creating OpenCode sandbox', { repoUrl });

	// --- Agentuity Secret Injection ---
	// In dev, process.env resolves from .env directly.
	// When deployed, ${secret:...} is resolved by the Agentuity platform at runtime.
	const env: Record<string, string> = {
		OPENCODE_SERVER_PASSWORD: password,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || '${secret:OPENAI_API_KEY}',
		REPO_URL: repoUrl,
	};

	// --- Agentuity Sandbox: Create isolated runtime environment ---
	let sbx;
	try {
		// Create sandbox without a command so it returns immediately (~1-2s).
		// Passing a command with mode: 'interactive' causes sandbox.create() to
		// block for the full timeout (300s) waiting for the process to exit.
		sbx = await sandbox.create({
			runtime: 'opencode:latest',
			network: { enabled: true, port: 4096 },
			resources: { memory: '2Gi', cpu: '1000m' },
			timeout: { idle: '30m' },
			env,
		});
	} catch (err) {
		logger.error('Failed to create sandbox', { error: String(err) });
		return c.json({ ready: false, repoUrl, sessionId: '' }, 500);
	}

	logger.info('Sandbox created', { sandboxId: sbx.id });

	// Run setup + start server in a single execute() call (fire-and-forget).
	// Multiple back-to-back execute() calls are unreliable on the platform,
	// so all setup is combined into one bash script with newline separators.
	// A git clone failure doesn't prevent server start (|| true).
	// The nohup watchdog loop restarts opencode serve if it crashes.
	sbx.execute({
		command: [
			'bash',
			'-c',
			[
				'mkdir -p ~/.config/opencode',
				"echo '{\"model\":\"openai/gpt-5-nano\"}' > ~/.config/opencode/opencode.json",
				'git clone --depth 1 $REPO_URL ~/project || true',
				'mkdir -p ~/project',
				"nohup bash -c 'while true; do cd ~/project && opencode serve --port 4096 --hostname 0.0.0.0 >> /tmp/opencode.log 2>&1; sleep 2; done' > /dev/null 2>&1 &",
			].join('\n'),
		],
	}).catch((err: unknown) => {
		logger.warn('execute() rejected (server may not start)', { error: String(err) });
	});

	// --- Agentuity Sandbox: Fetch the public URL assigned to the sandbox ---
	// sandbox.create() returns before the URL is assigned.
	// sandbox.get() fetches the full sandbox record including the public URL.
	const info = await sandbox.get(sbx.id);
	const serverUrl = info.url;

	if (!serverUrl) {
		logger.error('Sandbox has no public URL');
		await sbx.destroy();
		return c.json({ ready: false, repoUrl, sessionId: '' }, 500);
	}

	// --- OpenCode: Poll for server readiness ---
	let ready = false;
	for (let i = 0; i < 60; i++) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		ready = await checkHealth(serverUrl, password);
		if (ready) {
			logger.info('OpenCode server is ready', { attempt: i + 1 });
			break;
		}
		if (i % 10 === 0) {
			logger.debug('Health check not ready yet', { attempt: i + 1 });
		}
	}

	if (!ready) {
		logger.warn('Server did not become ready within timeout');
		await sbx.destroy();
		return c.json({ ready: false, repoUrl, sessionId: '' }, 500);
	}

	// --- OpenCode: Verify repo was cloned via the file API ---
	// The server is healthy, so we can ask it whether the workspace has content.
	// An empty workspace means the git clone failed (server still starts due to || true).
	const hasFiles = await checkWorkspaceFiles(serverUrl, password);
	if (!hasFiles) {
		const message = 'Failed to clone repository — check that the URL is correct and the repo is public';
		logger.warn('Repo clone failed, tearing down sandbox', { repoUrl });
		await sbx.destroy();
		return c.json({ ready: false, repoUrl, sessionId: '', message });
	}

	// --- OpenCode: Create a chat session ---
	let sessionId: string;
	try {
		sessionId = await createSession(serverUrl, password);
	} catch (err) {
		// Surface actionable hints for common failures
		const errStr = String(err);
		const hint =
			errStr.includes('401') || errStr.includes('403')
				? ' — check that OPENAI_API_KEY is set correctly'
				: '';
		logger.error(`Failed to create OpenCode session${hint}`, { error: errStr });
		await sbx.destroy();
		return c.json({ ready: false, repoUrl, sessionId: '' }, 500);
	}
	logger.info('OpenCode session created', { sessionId });

	// --- Agentuity KV: Persist workspace state across stateless requests ---
	const state: AssistantState = {
		sandboxId: sbx.id,
		serverUrl,
		password,
		sessionId,
		repoUrl,
		startedAt: new Date().toISOString(),
	};
	// TTL matches sandbox idle timeout (30 min) so stale state auto-expires.
	// The platform's sliding expiration auto-extends TTL when remaining time
	// drops below 50% on reads, so active sessions (which call kv.get on
	// every /ask, /events, /status request) won't lose state unexpectedly.
	await kv.set(KV_NAMESPACE, KV_KEY, state, { ttl: 1800 });

	return c.json({ ready: true, repoUrl, sessionId });
});

// POST /api/ask — Send question to OpenCode session
api.post('/ask', validator({ input: AskInput, output: AskResponse }), async (c) => {
	const { logger, kv } = c.var;
	const { question } = c.req.valid('json');

	// --- Agentuity KV: Retrieve workspace credentials ---
	const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
	if (!result.exists) {
		return c.json({ accepted: false }, 400);
	}

	const { serverUrl, password, sessionId } = result.data;

	// --- OpenCode: Send prompt (fire-and-forget, responses arrive via SSE) ---
	try {
		await sendPrompt(serverUrl, password, sessionId, question);
	} catch (err) {
		logger.error('Failed to send prompt to OpenCode', { error: String(err) });
		return c.json({ accepted: false }, 500);
	}

	return c.json({ accepted: true });
});

// --- Agentuity SSE: Stream events from sandbox to browser ---
// The sandbox URL is private (not routable from the browser) and the auth
// credentials must not leak to the client, so this route proxies the stream.
api.get(
	'/events',
	sse({ output: StreamEventOutput }, async (c, stream) => {
		const { logger, kv } = c.var;

		// --- Agentuity KV: Get sandbox connection details ---
		const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
		if (!result.exists) {
			await stream.writeSSE({
				data: JSON.stringify({ type: 'error', message: 'No workspace found', seq: 0 }),
			});
			stream.close();
			return;
		}

		const { serverUrl, password } = result.data;
		const auth = authHeader(password);

		const abortController = new AbortController();
		stream.onAbort(() => {
			abortController.abort();
		});

		const safeWrite = async (msg: { event?: string; data: string }) => {
			if (abortController.signal.aborted) return;
			try {
				await stream.writeSSE(msg);
			} catch {
				abortController.abort();
			}
		};

		// Keepalive pings prevent reverse proxies from closing idle connections
		const keepalive = setInterval(() => {
			void safeWrite({ event: 'ping', data: 'ping' });
		}, 15_000);

		let seq = 0;

		try {
			// Raw fetch instead of EventSource for reliable event parsing.
			// EventSource's onmessage only fires for events without an explicit
			// SSE "event:" header; if OpenCode adds event headers, it would break.
			const resp = await fetch(`${serverUrl}/event`, {
				headers: { Authorization: auth },
				signal: abortController.signal,
			});

			if (!resp.ok || !resp.body) {
				logger.warn('Failed to connect to OpenCode event stream', { status: resp.status });
				await safeWrite({
					data: JSON.stringify({
						type: 'error',
						message: `Event stream connection failed (${resp.status})`,
						seq: seq++,
					}),
				});
				return;
			}

			// Parse SSE data lines from the raw byte stream
			const reader = resp.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			// Track which partIDs are "text" (answer) vs "reasoning" (chain-of-thought).
			// message.part.updated fires first with part.type, then deltas reference the partID.
			const textPartIds = new Set<string>();

			const processLine = (line: string) => {
				if (!line.startsWith('data: ')) return;
				try {
					const event = JSON.parse(line.slice(6));
					const eventType = event.type as string;

					// --- OpenCode Events ---
					if (eventType === 'message.part.updated') {
						// Register text parts so we can filter deltas
						const part = event.properties?.part;
						if (part?.type === 'text' && part?.id) {
							textPartIds.add(part.id);
						}
					} else if (eventType === 'message.part.delta') {
						// Only forward deltas belonging to "text" parts (skip reasoning)
						const partID = event.properties?.partID as string | undefined;
						if (partID && !textPartIds.has(partID)) return;
						const delta = event.properties?.delta;
						if (typeof delta === 'string') {
							void safeWrite({
								data: JSON.stringify({ type: 'text', content: delta, seq: seq++ }),
							});
						}
					} else if (eventType === 'session.error') {
						const errMsg =
							event.properties?.error?.data?.message ??
							event.properties?.error?.message ??
							'Unknown error';
						void safeWrite({
							data: JSON.stringify({ type: 'error', message: errMsg, seq: seq++ }),
						});
					} else if (eventType === 'session.idle') {
						void safeWrite({
							data: JSON.stringify({ type: 'status', status: 'idle', seq: seq++ }),
						});
					} else if (eventType === 'session.status') {
						// session.status has a discriminated union:
						// { type: "idle" } | { type: "busy" } | { type: "retry", ... }
						const status = event.properties?.status?.type;
						if (typeof status === 'string') {
							void safeWrite({
								data: JSON.stringify({ type: 'status', status, seq: seq++ }),
							});
						}
					}
				} catch {
					// Skip malformed events
				}
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop()!;

				for (const line of lines) {
					processLine(line);
				}
			}

			// Flush any remaining buffered content
			if (buffer.trim()) {
				processLine(buffer);
			}
		} catch (err) {
			if (!abortController.signal.aborted) {
				logger.warn('Event stream error', { error: String(err) });
			}
		} finally {
			clearInterval(keepalive);
			stream.close();
		}
	})
);

// POST /api/stop — Destroy sandbox and clear KV
api.post('/stop', validator({ output: StopResponse }), async (c) => {
	const { logger, kv, sandbox } = c.var;

	// --- Agentuity KV: Check for active workspace ---
	const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
	if (!result.exists) {
		return c.json({ stopped: true });
	}

	const { sandboxId } = result.data;
	logger.info('Destroying sandbox', { sandboxId });

	// --- Agentuity Sandbox: Destroy the isolated runtime ---
	try {
		await sandbox.destroy(sandboxId);
	} catch (err) {
		logger.warn('Failed to destroy sandbox (may already be terminated)', { error: String(err) });
	}

	// --- Agentuity KV: Clear persisted state ---
	await kv.delete(KV_NAMESPACE, KV_KEY);
	return c.json({ stopped: true });
});

export default api;
