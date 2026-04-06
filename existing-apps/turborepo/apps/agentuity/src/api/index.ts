import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import translate from '@agent/translate';
import type { HistoryEntry } from '@tanstack-turborepo/shared';

const router = new Hono<Env>()
	.get('/health', (c) => {
		return c.json({ status: 'ok', timestamp: new Date().toISOString() });
	})
	.post('/translate', translate.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await translate.run(data));
	})
	.get('/translate/history', async (c) => {
		const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];

		return c.json({
			history,
			threadId: c.var.thread.id,
			translationCount: history.length,
		});
	})
	.delete('/translate/history', async (c) => {
		await c.var.thread.state.delete('history');

		return c.json({
			history: [] as HistoryEntry[],
			threadId: c.var.thread.id,
			translationCount: 0,
		});
	});

export default router;
