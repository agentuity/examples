import { createRouter, validator } from '@agentuity/runtime';
import { StartResponse, StatusResponse, StopResponse } from '@lib/types';
import type { ServerState } from '@lib/types';

const KV_NAMESPACE = 'opencode';
const KV_KEY = 'server';

const api = createRouter();

// POST /api/server/start - Create sandbox and start OpenCode server
api.post('/server/start', validator({ output: StartResponse }), async (c) => {
	const { logger, kv, sandbox } = c.var;

	// Check if server is already running
	const existing = await kv.get<ServerState>(KV_NAMESPACE, KV_KEY);
	if (existing.exists) {
		const authHeader = `Basic ${btoa(`opencode:${existing.data.password}`)}`;
		let alive = false;
		try {
			const resp = await fetch(`${existing.data.serverUrl}/config`, {
				headers: { Authorization: authHeader },
				signal: AbortSignal.timeout(5000),
			});
			alive = resp.ok;
		} catch {
			// Server not reachable
		}

		if (alive) {
			logger.info('Server already running', { sandboxId: existing.data.sandboxId });
			return c.json({
				sandboxId: existing.data.sandboxId,
				serverUrl: existing.data.serverUrl,
				password: existing.data.password,
				ready: true,
			});
		}

		// Stale state: clean up and fall through to create new server
		logger.warn('Stale server detected, cleaning up', { sandboxId: existing.data.sandboxId });
		try {
			await sandbox.destroy(existing.data.sandboxId);
		} catch (err) {
			logger.warn('Failed to destroy stale sandbox', { error: String(err) });
		}
		await kv.delete(KV_NAMESPACE, KV_KEY);
	}

	const password = crypto.randomUUID();

	logger.info('Creating OpenCode sandbox');

	// Build env vars, conditionally forwarding OPENAI_API_KEY
	const env: Record<string, string> = {
		OPENCODE_SERVER_PASSWORD: password,
	};
	if (process.env.OPENAI_API_KEY) {
		env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
	}

	const sbx = await sandbox.create({
		runtime: 'opencode:latest',
		command: {
			exec: ['/varty/bin/opencode', 'serve', '--port', '4096', '--hostname', '0.0.0.0'],
			mode: 'interactive',
		},
		network: { enabled: true, port: 4096 },
		resources: { memory: '2Gi', cpu: '1000m' },
		timeout: { idle: '30m' },
		env,
	});

	logger.info('Sandbox created', { sandboxId: sbx.id });

	// Retrieve public URL via sandbox.get
	const info = await sandbox.get(sbx.id);
	const serverUrl = info.url;

	if (!serverUrl) {
		logger.error('Sandbox has no public URL. Network port may not be configured correctly.');
		await sbx.destroy();
		return c.json({ sandboxId: sbx.id, serverUrl: '', password, ready: false }, 500);
	}

	logger.info('Polling for readiness', { serverUrl });

	// Poll GET {url}/config with Basic Auth for up to ~30s
	const authHeader = `Basic ${btoa(`opencode:${password}`)}`;
	let ready = false;
	const maxAttempts = 15;

	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		try {
			const resp = await fetch(`${serverUrl}/config`, {
				headers: { Authorization: authHeader },
				signal: AbortSignal.timeout(5000),
			});
			if (resp.ok) {
				ready = true;
				logger.info('OpenCode server is ready', { attempt: i + 1 });
				break;
			}
		} catch {
			// Server not ready yet, continue polling
		}
	}

	if (!ready) {
		logger.warn('Server did not become ready within timeout');
	}

	// Store state in KV
	const state: ServerState = {
		sandboxId: sbx.id,
		serverUrl,
		password,
		startedAt: new Date().toISOString(),
	};
	await kv.set(KV_NAMESPACE, KV_KEY, state);

	return c.json({
		sandboxId: sbx.id,
		serverUrl,
		password,
		ready,
	});
});

// GET /api/server/status - Check if server exists and is responsive
api.get('/server/status', validator({ output: StatusResponse }), async (c) => {
	const { kv, sandbox, logger } = c.var;

	const result = await kv.get<ServerState>(KV_NAMESPACE, KV_KEY);
	if (!result.exists) {
		return c.json({ exists: false });
	}

	const state = result.data;

	// Probe liveness by hitting /config
	const authHeader = `Basic ${btoa(`opencode:${state.password}`)}`;
	let ready = false;

	try {
		const resp = await fetch(`${state.serverUrl}/config`, {
			headers: { Authorization: authHeader },
			signal: AbortSignal.timeout(5000),
		});
		ready = resp.ok;
	} catch {
		// Server not reachable
	}

	if (!ready) {
		// Stale state: clean up so the client sees a clean idle state
		logger.warn('Status probe failed, clearing stale state', { sandboxId: state.sandboxId });
		try {
			await sandbox.destroy(state.sandboxId);
		} catch (err) {
			logger.warn('Failed to destroy stale sandbox', { error: String(err) });
		}
		await kv.delete(KV_NAMESPACE, KV_KEY);
		return c.json({ exists: false });
	}

	return c.json({ exists: true, sandbox: state, ready });
});

// POST /api/server/stop - Destroy sandbox and clear KV
api.post('/server/stop', validator({ output: StopResponse }), async (c) => {
	const { logger, kv, sandbox } = c.var;

	const result = await kv.get<ServerState>(KV_NAMESPACE, KV_KEY);
	if (!result.exists) {
		return c.json({ stopped: true });
	}

	const { sandboxId } = result.data;

	logger.info('Destroying sandbox', { sandboxId });

	try {
		await sandbox.destroy(sandboxId);
	} catch (err) {
		logger.warn('Failed to destroy sandbox (may already be terminated)', { error: String(err) });
	}

	await kv.delete(KV_NAMESPACE, KV_KEY);

	return c.json({ stopped: true });
});

export default api;
