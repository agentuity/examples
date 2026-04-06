import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { validator, sse } from '@agentuity/runtime';
import {
	StartInput,
	StartResponse,
	StatusResponse,
	AskInput,
	AskResponse,
	StopResponse,
	StreamEventOutput,
} from './types';
import type { AssistantState } from './types';
import {
	authHeader,
	createSession,
	probeHealth,
	probeWorkspaceFiles,
	sendPrompt,
} from '@lib/opencode';

const KV_NAMESPACE = 'opencode';
const KV_KEY = 'assistant';
const OPENCODE_PORT = 4096;
const OPENCODE_BIN = process.env.OPENCODE_BIN ?? 'opencode';
const HEALTH_POLL_ATTEMPTS = 90;
const CLONE_POLL_ATTEMPTS = 120;
const POLL_INTERVAL_MS = 1000;
const KV_TTL = 1800;
const ERROR_TTL = 300;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to write KV state with a given phase
function makeState(
	fields: Partial<AssistantState> & Pick<AssistantState, 'repoUrl' | 'phase'>
): AssistantState {
	return {
		sandboxId: '',
		serverUrl: '',
		password: '',
		sessionId: '',
		startedAt: new Date().toISOString(),
		...fields,
	};
}

// Background setup: creates sandbox, polls health, clones repo, creates session.
// Writes progressive KV state so GET /api/status can report progress.
async function runSetup(params: {
	repoUrl: string;
	password: string;
	kv: { set: (ns: string, key: string, value: AssistantState, opts?: { ttl?: number }) => Promise<void> };
	sandbox: {
		create: (opts: any) => Promise<{ id: string; execute: (opts: any) => Promise<any>; destroy: () => Promise<void> }>;
		get: (id: string) => Promise<{ url?: string; status?: string; executions?: number }>;
	};
	logger: { info: (msg: string, meta?: any) => void; warn: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void };
}): Promise<void> {
	const { repoUrl, password, kv, sandbox, logger } = params;
	let sbx: Awaited<ReturnType<typeof sandbox.create>> | undefined;

	try {
		// --- LLM Configuration ---
		const sdkKey = process.env.AGENTUITY_SDK_KEY;
		const openaiKey = process.env.OPENAI_API_KEY;
		const gatewayBase = process.env.AGENTUITY_AIGATEWAY_URL || process.env.AGENTUITY_TRANSPORT_URL || 'https://agentuity.ai';

		const env: Record<string, string> = {
			OPENCODE_SERVER_PASSWORD: password,
			REPO_URL: repoUrl,
		};

		let model: string;

		if (openaiKey) {
			model = 'openai/gpt-5-nano';
			env.OPENAI_API_KEY = openaiKey;
			logger.info('Using direct OpenAI key', { model });
		} else if (sdkKey) {
			model = 'anthropic/claude-sonnet-4-6';
			env.ANTHROPIC_API_KEY = sdkKey;
			env.ANTHROPIC_BASE_URL = `${gatewayBase}/gateway/anthropic`;
			logger.info('Using Agentuity AI Gateway', { model, gateway: `${gatewayBase}/gateway/anthropic` });
		} else {
			model = 'anthropic/claude-sonnet-4-6';
			const secretKey = '${secret:AGENTUITY_SDK_KEY}';
			env.ANTHROPIC_API_KEY = secretKey;
			env.ANTHROPIC_BASE_URL = `${gatewayBase}/gateway/anthropic`;
			logger.info('Using platform secret injection', { model });
		}

		// --- Create sandbox ---
		logger.info('Creating OpenCode sandbox', { repoUrl });
		const createStart = Date.now();
		sbx = await sandbox.create({
			runtime: 'opencode:latest',
			network: { enabled: true, port: OPENCODE_PORT },
			resources: { memory: '2Gi', cpu: '1000m' },
			timeout: { idle: '30m' },
			env,
		});
		logger.info('sandbox.create() resolved', {
			sandboxId: sbx.id,
			durationMs: Date.now() - createStart,
		});

		// --- Bootstrap OpenCode server ---
		const setupExecution = await sbx.execute({
			command: [
				'bash',
				'-lc',
				[
					'mkdir -p ~/.config/opencode ~/project',
					`echo '{"model":"${model}"}' > ~/.config/opencode/opencode.json`,
					': > /tmp/opencode.log',
					`nohup bash -lc 'while true; do cd ~/project && ${OPENCODE_BIN} serve --port ${OPENCODE_PORT} --hostname 0.0.0.0 >> /tmp/opencode.log 2>&1; code=$?; echo "[watchdog] exit=$code $(date -Is)" >> /tmp/opencode.log; sleep 2; done' >/dev/null 2>&1 &`,
				].join('\n'),
			],
			timeout: '30s',
		});
		logger.info('Bootstrap execution completed', {
			sandboxId: sbx.id,
			executionId: setupExecution.executionId,
			status: setupExecution.status,
			exitCode: setupExecution.exitCode,
		});

		if (typeof setupExecution.exitCode === 'number' && setupExecution.exitCode !== 0) {
			throw new Error('OpenCode bootstrap failed. Check server logs for details.');
		}

		// --- Fetch sandbox public URL ---
		const info = await sandbox.get(sbx.id);
		const serverUrl = info.url;
		logger.info('Sandbox URL resolved', {
			sandboxId: sbx.id,
			serverUrl: serverUrl ?? 'none',
			status: info.status,
			executions: info.executions,
		});

		if (!serverUrl) {
			throw new Error('Sandbox did not expose a public URL.');
		}

		// Phase: booting -- sandbox exists, polling for OpenCode health
		await kv.set(KV_NAMESPACE, KV_KEY, makeState({
			sandboxId: sbx.id, serverUrl, password, repoUrl, phase: 'booting',
		}), { ttl: KV_TTL });

		// --- Poll for server readiness ---
		let ready = false;
		let lastHealth = { status: null as number | null, error: undefined as string | undefined, body: undefined as string | undefined };
		for (let i = 0; i < HEALTH_POLL_ATTEMPTS; i++) {
			await sleep(POLL_INTERVAL_MS);
			const health = await probeHealth(serverUrl, password);
			lastHealth = { status: health.status, error: health.error, body: health.body };

			if (health.ok) {
				logger.info('OpenCode server is ready', {
					sandboxId: sbx.id,
					attempt: i + 1,
					elapsedMs: (i + 1) * POLL_INTERVAL_MS,
				});
				ready = true;
				break;
			}

			if (i === 0 || (i + 1) % 10 === 0) {
				logger.info('Health check not ready yet', {
					sandboxId: sbx.id,
					attempt: i + 1,
					status: health.status,
					error: health.error,
					body: health.body,
				});
			}
		}

		if (!ready) {
			throw new Error(
				`OpenCode server did not become healthy in time (last status: ${lastHealth.status}, error: ${lastHealth.error})`
			);
		}

		// Phase: cloning -- server healthy, cloning repo
		await kv.set(KV_NAMESPACE, KV_KEY, makeState({
			sandboxId: sbx.id, serverUrl, password, repoUrl, phase: 'cloning',
		}), { ttl: KV_TTL });

		// --- Launch git clone ---
		const cloneExecution = await sbx.execute({
			command: [
				'bash',
				'-lc',
				[
					'cd ~/project',
					'if [ -d .git ]; then echo "already-cloned"; exit 0; fi',
					': > /tmp/clone.log',
					"nohup bash -lc 'cd ~/project && git clone --depth 1 \"$REPO_URL\" . >> /tmp/clone.log 2>&1' >/dev/null 2>&1 &",
					'echo "clone-started"',
				].join('\n'),
			],
			timeout: '20s',
		});
		logger.info('Clone launch execution completed', {
			sandboxId: sbx.id,
			executionId: cloneExecution.executionId,
			status: cloneExecution.status,
			exitCode: cloneExecution.exitCode,
		});
		if (typeof cloneExecution.exitCode === 'number' && cloneExecution.exitCode !== 0) {
			throw new Error('Repository clone failed to start.');
		}

		// --- Poll for clone completion ---
		let workspaceReady = false;
		let lastWorkspaceProbe = {
			status: null as number | null,
			error: undefined as string | undefined,
			body: undefined as string | undefined,
			fileCount: undefined as number | undefined,
		};
		for (let i = 0; i < CLONE_POLL_ATTEMPTS; i++) {
			await sleep(POLL_INTERVAL_MS);
			const workspace = await probeWorkspaceFiles(serverUrl, password);
			lastWorkspaceProbe = {
				status: workspace.status,
				error: workspace.error,
				body: workspace.body,
				fileCount: workspace.fileCount,
			};

			if (workspace.ok) {
				logger.info('Workspace files are ready', {
					sandboxId: sbx.id,
					attempt: i + 1,
					fileCount: workspace.fileCount,
				});
				workspaceReady = true;
				break;
			}

			if (i === 0 || (i + 1) % 10 === 0) {
				logger.info('Waiting for repository clone', {
					sandboxId: sbx.id,
					attempt: i + 1,
					status: workspace.status,
					error: workspace.error,
					body: workspace.body,
					fileCount: workspace.fileCount,
				});
			}
		}

		if (!workspaceReady) {
			throw new Error('Repository clone did not complete in time.');
		}

		// --- Create OpenCode session ---
		let sessionId: string;
		try {
			sessionId = await createSession(serverUrl, password);
		} catch (err) {
			const errStr = String(err);
			const hint =
				errStr.includes('401') || errStr.includes('403')
					? ' — check that AGENTUITY_SDK_KEY is set correctly'
					: '';
			throw new Error(`OpenCode session creation failed${hint}: ${errStr}`);
		}
		logger.info('OpenCode session created', { sandboxId: sbx.id, sessionId });

		// Phase: ready -- workspace fully operational
		await kv.set(KV_NAMESPACE, KV_KEY, makeState({
			sandboxId: sbx.id, serverUrl, password, sessionId, repoUrl, phase: 'ready',
		}), { ttl: KV_TTL });

		logger.info('Workspace setup complete', { sandboxId: sbx.id, sessionId });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error('Workspace setup failed', { error: errorMessage, sandboxId: sbx?.id });

		// Write error state so the frontend can detect failure
		try {
			await kv.set(KV_NAMESPACE, KV_KEY, makeState({
				sandboxId: sbx?.id ?? '',
				repoUrl,
				phase: 'error',
				error: errorMessage,
			}), { ttl: ERROR_TTL });
		} catch (kvError) {
			logger.error('Failed to write error state to KV', {
				error: kvError instanceof Error ? kvError.message : String(kvError),
			});
		}

		// Clean up sandbox on failure
		if (sbx) {
			await sbx.destroy().catch((destroyError) => {
				logger.warn('Failed to destroy sandbox after setup error', {
					sandboxId: sbx?.id,
					error: destroyError instanceof Error ? destroyError.message : String(destroyError),
				});
			});
		}
	}
}

const router = new Hono<Env>()
	// GET /api/status -- Check workspace state and report phase
	.get('/status', validator({ output: StatusResponse }), async (c) => {
		const { kv, sandbox, logger } = c.var;

		const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
		if (!result.exists) {
			return c.json({ exists: false });
		}

		const state = result.data;

		// For in-progress phases, return state directly (no health probe needed)
		if (state.phase === 'creating' || state.phase === 'booting' || state.phase === 'cloning') {
			return c.json({
				exists: true,
				repoUrl: state.repoUrl,
				ready: false,
				phase: state.phase,
			});
		}

		// Error phase
		if (state.phase === 'error') {
			return c.json({
				exists: true,
				repoUrl: state.repoUrl,
				ready: false,
				phase: 'error' as const,
				error: state.error,
			});
		}

		// Ready phase: verify the server is still reachable
		const health = await probeHealth(state.serverUrl, state.password);
		if (!health.ok) {
			logger.warn('Status probe failed, clearing stale state', {
				sandboxId: state.sandboxId,
				status: health.status,
				error: health.error,
				body: health.body,
			});
			try {
				await sandbox.destroy(state.sandboxId);
			} catch (err) {
				logger.warn('Failed to destroy stale sandbox', { error: String(err) });
			}
			await kv.delete(KV_NAMESPACE, KV_KEY);
			return c.json({ exists: false });
		}

		return c.json({
			exists: true,
			repoUrl: state.repoUrl,
			ready: true,
			phase: 'ready' as const,
		});
	})
	// POST /api/start -- Validate input, schedule background setup via waitUntil, return 202
	.post('/start', validator({ input: StartInput, output: StartResponse }), async (c) => {
		const { logger, kv, sandbox } = c.var;
		const { repoUrl } = c.req.valid('json');

		// Basic URL validation
		let requestedRepoUrl: string;
		try {
			const parsed = new URL(repoUrl);
			requestedRepoUrl = parsed.toString();
			if (parsed.protocol !== 'https:') {
				return c.json({
					accepted: false, repoUrl: requestedRepoUrl, phase: 'error' as const,
					message: 'Only HTTPS URLs are supported',
				}, 400);
			}
		} catch {
			return c.json({
				accepted: false, repoUrl, phase: 'error' as const,
				message: 'Invalid URL',
			}, 400);
		}

		// --- Agentuity KV: Check for existing workspace state ---
		const existing = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
		if (existing.exists) {
			const state = existing.data;

			// Setup already in progress -- return current phase (no duplicate setup)
			if (state.phase === 'creating' || state.phase === 'booting' || state.phase === 'cloning') {
				if (state.repoUrl === requestedRepoUrl) {
					logger.info('Setup already in progress', { phase: state.phase });
					return c.json({ accepted: true, repoUrl: requestedRepoUrl, phase: state.phase });
				}
				// Different repo but setup in progress -- wait for it to finish or error out
				logger.info('Setup in progress for different repo, returning current phase', {
					activeRepoUrl: state.repoUrl, requestedRepoUrl,
				});
				return c.json({ accepted: true, repoUrl: state.repoUrl, phase: state.phase });
			}

			// Ready phase -- verify health, reuse if alive
			if (state.phase === 'ready' && state.repoUrl === requestedRepoUrl) {
				const health = await probeHealth(state.serverUrl, state.password);
				if (health.ok) {
					logger.info('Workspace already running', { sandboxId: state.sandboxId });
					return c.json({
						accepted: true,
						repoUrl: state.repoUrl,
						phase: 'ready' as const,
						sessionId: state.sessionId,
					});
				}
				logger.warn('Existing workspace health check failed, cleaning up');
			}

			// At this point we need to start fresh. Write the `creating` placeholder
			// FIRST to prevent concurrent requests from also starting a new setup.
		}

		const password = crypto.randomUUID();
		await kv.set(KV_NAMESPACE, KV_KEY, makeState({
			password, repoUrl: requestedRepoUrl, phase: 'creating',
		}), { ttl: KV_TTL });

		// Clean up the old sandbox (if any) in the background
		if (existing.exists && existing.data.sandboxId) {
			const oldSandboxId = existing.data.sandboxId;
			c.waitUntil(async () => {
				try {
					await sandbox.destroy(oldSandboxId);
				} catch (err) {
					logger.warn('Failed to destroy old sandbox', { sandboxId: oldSandboxId, error: String(err) });
				}
			});
		}

		// --- Agentuity waitUntil: Run full setup in the background ---
		c.waitUntil(async () => {
			await runSetup({ repoUrl: requestedRepoUrl, password, kv, sandbox, logger });
		});

		return c.json({ accepted: true, repoUrl: requestedRepoUrl, phase: 'creating' as const }, 202);
	})
	// POST /api/ask -- Send question to OpenCode session
	.post('/ask', validator({ input: AskInput, output: AskResponse }), async (c) => {
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
	})
	// --- Agentuity SSE: Stream events from sandbox to browser ---
	// The sandbox URL is private (not routable from the browser) and the auth
	// credentials must not leak to the client, so this route proxies the stream.
	.get(
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
				let resp: Response | null = null;
				let eventPath = '';
				for (const path of ['/global/event', '/event']) {
					try {
						const candidate = await fetch(`${serverUrl}${path}`, {
							headers: { Authorization: auth },
							signal: abortController.signal,
						});
						if (candidate.ok && candidate.body) {
							resp = candidate;
							eventPath = path;
							break;
						}
						logger.warn('OpenCode event endpoint unavailable', {
							path,
							status: candidate.status,
						});
					} catch (error) {
						logger.warn('OpenCode event endpoint request failed', {
							path,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}

				if (!resp || !resp.body) {
					logger.warn('Failed to connect to OpenCode event stream', { serverUrl });
					await safeWrite({
						data: JSON.stringify({
							type: 'error',
							message: 'Event stream connection failed',
							seq: seq++,
						}),
					});
					return;
				}
				logger.info('Connected to OpenCode event stream', { eventPath });

				// Parse SSE data lines from the raw byte stream
				const reader = resp.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';

				// Track assistant message IDs so we only forward parts from assistant messages
				const assistantMessageIds = new Set<string>();

				const processLine = (line: string) => {
					if (!line.startsWith('data: ')) return;
					try {
						const event = JSON.parse(line.slice(6));
						const eventType = event.type as string;

						// --- OpenCode Events ---
						if (eventType === 'message.updated') {
							const msg = event.properties?.info;
							if (msg?.role === 'assistant' && msg?.id) {
								assistantMessageIds.add(msg.id);
							}
						} else if (eventType === 'message.part.updated') {
							const part = event.properties?.part;
							if (
								part &&
								(part.type === 'text' || part.type === 'reasoning') &&
								assistantMessageIds.has(part.messageID)
							) {
								void safeWrite({
									data: JSON.stringify({
										type: 'part',
										part: { id: part.id, type: part.type, text: part.text, time: part.time },
										seq: seq++,
									}),
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
	)
	// POST /api/stop -- Clear KV immediately, destroy sandbox in background
	.post('/stop', validator({ output: StopResponse }), async (c) => {
		const { logger, kv, sandbox } = c.var;

		const result = await kv.get<AssistantState>(KV_NAMESPACE, KV_KEY);
		if (!result.exists) {
			return c.json({ stopped: true });
		}

		const { sandboxId } = result.data;

		// --- Agentuity KV: Clear state immediately for instant feedback ---
		await kv.delete(KV_NAMESPACE, KV_KEY);

		// --- Agentuity waitUntil: Destroy sandbox in background ---
		if (sandboxId) {
			c.waitUntil(async () => {
				logger.info('Destroying sandbox in background', { sandboxId });
				try {
					await sandbox.destroy(sandboxId);
				} catch (err) {
					logger.warn('Failed to destroy sandbox (may already be terminated)', { error: String(err) });
				}
			});
		}

		return c.json({ stopped: true });
	});

export default router;
