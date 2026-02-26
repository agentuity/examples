import { createRouter, validator } from '@agentuity/runtime';
import translateAgent, { type HistoryEntry } from '../agent/translate/agent';
import { TranslateHistoryStateSchema } from '../agent/translate/state';

const api = createRouter();

api.get('/health', (c) => {
	return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

api.post('/translate', translateAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await translateAgent.run(data));
});

api.get('/translate/history', validator({ output: TranslateHistoryStateSchema }), async (c) => {
	const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];

	return c.json({
		history,
		threadId: c.var.thread.id,
		translationCount: history.length,
	});
});

api.delete('/translate/history', validator({ output: TranslateHistoryStateSchema }), async (c) => {
	await c.var.thread.state.delete('history');

	return c.json({
		history: [],
		threadId: c.var.thread.id,
		translationCount: 0,
	});
});

export default api;
