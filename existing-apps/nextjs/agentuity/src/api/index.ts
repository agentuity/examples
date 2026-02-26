import { createRouter, validator } from '@agentuity/runtime';
import translateAgent, { type HistoryEntry } from '../agent/translate/agent';
import { TranslateHistoryStateSchema } from '../agent/translate/state';

const router = createRouter();

router.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/translate', translateAgent.validator(), async (c) => {
	const input = c.req.valid('json');
	return c.json(await translateAgent.run(input));
});

router.get('/translate/history', validator({ output: TranslateHistoryStateSchema }), async (c) => {
	const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];

	return c.json({
		history,
		threadId: c.var.thread.id,
		translationCount: history.length,
	});
});

router.delete('/translate/history', validator({ output: TranslateHistoryStateSchema }), async (c) => {
	await c.var.thread.state.delete('history');

	return c.json({
		history: [],
		threadId: c.var.thread.id,
		translationCount: 0,
	});
});

export default router;
