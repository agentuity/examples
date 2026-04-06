import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import translate from '@agent/translate';
import type { HistoryEntry } from '../agent/translate/agent';

const router = new Hono<Env>()
	.get('/health', (c) => {
		return c.json({ status: 'ok', timestamp: new Date().toISOString() });
	})
	.post('/translate', translate.validator(), async (c) => {
		const input = c.req.valid('json');
		return c.json(await translate.run(input));
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
