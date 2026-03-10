import { createRouter, sse } from '@agentuity/runtime';
import { exploreWithSandbox } from '@lib/explorer';
import { StreamEventOutput } from '@agent/web-explorer/types';
import type { StreamEvent } from '@agent/web-explorer/types';
import webExplorer from '@agent/web-explorer';
import type { Sandbox } from '@agentuity/core';

const api = createRouter();

// --- Session Management ---

interface Session {
	sandbox: Sandbox;
	url: string;
	lastActiveAt: number;
}

const sessions = new Map<string, Session>();

// Clean up stale sessions every 60s (idle > 9 minutes, under the 10m sandbox timeout)
setInterval(() => {
	const now = Date.now();
	for (const [id, session] of sessions) {
		if (now - session.lastActiveAt > 9 * 60 * 1000) {
			session.sandbox.destroy().catch(() => {});
			sessions.delete(id);
		}
	}
}, 60_000);

// POST /explore — synchronous (workbench compatibility)
api.post('/explore', webExplorer.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await webExplorer.run(data);
	return c.json(result);
});

// GET /explore/stream — SSE progressive streaming with session support
api.get(
	'/explore/stream',
	sse({ output: StreamEventOutput }, async (c, stream) => {
		const { logger, kv, sandbox: sandboxService } = c.var;
		const url = c.req.query('url');
		const sessionId = c.req.query('sessionId');
		const parsed = parseInt(c.req.query('maxSteps') || '10', 10);
		const maxSteps = Number.isFinite(parsed) ? Math.max(1, Math.min(20, parsed)) : 10;

		// Resume existing session
		if (sessionId) {
			const session = sessions.get(sessionId);
			if (!session) {
				await stream.writeSSE({
					data: JSON.stringify({ type: 'error', message: 'Session not found or expired' } satisfies StreamEvent),
				});
				stream.close();
				return;
			}

			const abortController = new AbortController();
			let aborted = false;
			stream.onAbort(() => { aborted = true; abortController.abort(); });

			try {
				session.lastActiveAt = Date.now();
				await exploreWithSandbox(
					{ logger, kv, sandbox: sandboxService },
					session.sandbox,
					{
						url: session.url,
						maxSteps,
						skipNavigation: true,
						abortSignal: abortController.signal,
						onStep: async (event: StreamEvent) => {
							if (aborted) return;
							session.lastActiveAt = Date.now();
							await stream.writeSSE({ data: JSON.stringify(event) });
						},
					},
				);

				if (!aborted) {
					await stream.writeSSE({
						data: JSON.stringify({ type: 'paused', sessionId } satisfies StreamEvent),
					});
				}
			} catch (err) {
				if (!aborted) {
					logger.error('SSE session exploration error', { error: String(err) });
					await stream.writeSSE({
						data: JSON.stringify({ type: 'error', message: String(err) } satisfies StreamEvent),
					});
					sessions.delete(sessionId);
					session.sandbox.destroy().catch(() => {});
				}
			}

			stream.close();
			return;
		}

		// New exploration
		if (!url) {
			await stream.writeSSE({
				data: JSON.stringify({ type: 'error', message: 'Missing url parameter' } satisfies StreamEvent),
			});
			stream.close();
			return;
		}

		try {
			new URL(url);
		} catch {
			await stream.writeSSE({
				data: JSON.stringify({ type: 'error', message: `Invalid URL: ${url}` } satisfies StreamEvent),
			});
			stream.close();
			return;
		}

		const abortController = new AbortController();
		let aborted = false;
		stream.onAbort(() => {
			aborted = true;
			abortController.abort();
		});

		// Create sandbox for session
		const newSessionId = crypto.randomUUID();
		let sandbox: Sandbox;
		try {
			sandbox = await sandboxService.create({
				runtime: 'agent-browser:latest',
				network: { enabled: true },
				resources: { memory: '1Gi', cpu: '1000m' },
				timeout: { idle: '10m', execution: '30s' },
			});
		} catch (err) {
			await stream.writeSSE({
				data: JSON.stringify({ type: 'error', message: `Failed to create sandbox: ${String(err)}` } satisfies StreamEvent),
			});
			stream.close();
			return;
		}

		sessions.set(newSessionId, { sandbox, url, lastActiveAt: Date.now() });

		// Emit session event
		await stream.writeSSE({
			data: JSON.stringify({ type: 'session', sessionId: newSessionId } satisfies StreamEvent),
		});

		try {
			await exploreWithSandbox(
				{ logger, kv, sandbox: sandboxService },
				sandbox,
				{
					url,
					maxSteps,
					abortSignal: abortController.signal,
					onStep: async (event: StreamEvent) => {
						if (aborted) return;
						const session = sessions.get(newSessionId);
						if (session) session.lastActiveAt = Date.now();
						await stream.writeSSE({ data: JSON.stringify(event) });
					},
				},
			);

			if (!aborted) {
				await stream.writeSSE({
					data: JSON.stringify({ type: 'paused', sessionId: newSessionId } satisfies StreamEvent),
				});
			}
		} catch (err) {
			if (!aborted) {
				logger.error('SSE exploration error', { error: String(err) });
				await stream.writeSSE({
					data: JSON.stringify({ type: 'error', message: String(err) } satisfies StreamEvent),
				});
				// Real error: destroy session
				sessions.delete(newSessionId);
				sandbox.destroy().catch(() => {});
			}
			// Abort (client disconnect): keep session alive for resume
		}

		stream.close();
	}),
);

// DELETE /explore/session/:sessionId — destroy a session's sandbox
api.delete('/explore/session/:sessionId', async (c) => {
	const sessionId = c.req.param('sessionId');
	const session = sessions.get(sessionId);
	if (session) {
		sessions.delete(sessionId);
		await session.sandbox.destroy().catch(() => {});
		return c.json({ ok: true });
	}
	return c.json({ ok: false, error: 'Session not found' }, 404);
});

export default api;
