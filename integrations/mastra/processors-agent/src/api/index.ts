/**
 * API routes for the moderated agent.
 * Routes handle state operations and expose agent functionality.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import moderated from '@agent/moderated';

// Processing history entry schema
export const ProcessingHistoryEntrySchema = s.object({
	timestamp: s.string(),
	sessionId: s.string(),
	inputLength: s.number(),
	outputLength: s.number(),
	tokens: s.number(),
	retryCount: s.number(),
	blocked: s.boolean(),
});

export type ProcessingHistoryEntry = s.infer<typeof ProcessingHistoryEntrySchema>;

const router = new Hono<Env>()
	.post('/moderated', moderated.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await moderated.run(data));
	})
	.get('/moderated/history', async (c) => {
		const history = (await c.var.thread.state.get<ProcessingHistoryEntry[]>('processingHistory')) ?? [];
		return c.json({
			processingHistory: history,
			threadId: c.var.thread.id,
			totalProcessed: history.length,
		});
	})
	.delete('/moderated/history', async (c) => {
		await c.var.thread.state.delete('processingHistory');
		return c.json({
			processingHistory: [],
			threadId: c.var.thread.id,
			totalProcessed: 0,
		});
	})
	.get('/moderated/stats', async (c) => {
		const history = (await c.var.thread.state.get<ProcessingHistoryEntry[]>('processingHistory')) ?? [];
		const stats = {
			threadId: c.var.thread.id,
			totalRequests: history.length,
			blockedRequests: history.filter((h) => h.blocked).length,
			totalTokens: history.reduce((sum, h) => sum + h.tokens, 0),
			totalRetries: history.reduce((sum, h) => sum + h.retryCount, 0),
			averageInputLength: history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.inputLength, 0) / history.length) : 0,
			averageOutputLength: history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.outputLength, 0) / history.length) : 0,
		};
		return c.json(stats);
	});

export default router;
