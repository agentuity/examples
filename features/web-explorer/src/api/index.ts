import { createRouter, sse } from '@agentuity/runtime';
import { explore } from '@lib/explorer';
import { StreamEventOutput } from '@lib/types';
import type { StreamEvent } from '@lib/types';
import webExplorer from '@agent/web-explorer';

const api = createRouter();

// POST /explore — synchronous (workbench compatibility)
api.post('/explore', webExplorer.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await webExplorer.run(data);
	return c.json(result);
});

// GET /explore/stream — SSE progressive streaming
api.get(
	'/explore/stream',
	sse({ output: StreamEventOutput }, async (c, stream) => {
		const { logger, kv, vector, sandbox } = c.var;
		const url = c.req.query('url');
		const parsed = parseInt(c.req.query('maxSteps') || '4', 10);
		const maxSteps = Number.isFinite(parsed) ? Math.max(1, Math.min(10, parsed)) : 4;

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

		let aborted = false;
		stream.onAbort(() => {
			aborted = true;
		});

		try {
			await explore(
				{ logger, kv, vector, sandbox },
				{
					url,
					maxSteps,
					onStep: async (event: StreamEvent) => {
						if (aborted) return;
						await stream.writeSSE({ data: JSON.stringify(event) });
					},
				},
			);
		} catch (err) {
			if (!aborted) {
				logger.error('SSE exploration error', { error: String(err) });
				await stream.writeSSE({
					data: JSON.stringify({ type: 'error', message: String(err) } satisfies StreamEvent),
				});
			}
		}

		stream.close();
	}),
);

export default api;
