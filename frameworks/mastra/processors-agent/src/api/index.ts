/**
 * API routes for the moderated agent.
 * Routes handle state operations and expose agent functionality.
 */

import { createRouter, validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import moderated, { AgentOutput as ModeratedOutput, type ProcessingMetadata } from '../agent/moderated';

const api = createRouter();

// ============================================================================
// Moderated Agent Routes
// ============================================================================

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

// State schema for moderated agent history
export const ModeratedStateSchema = s.object({
	processingHistory: s.array(ProcessingHistoryEntrySchema),
	threadId: s.string(),
	totalProcessed: s.number(),
});

// Call the moderated agent to process text
api.post('/moderated', moderated.validator(), async (c) => {
	const data = c.req.valid('json');

	return c.json(await moderated.run(data));
});

// Retrieve processing history
api.get('/moderated/history', validator({ output: ModeratedStateSchema }), async (c) => {
	const history = (await c.var.thread.state.get<ProcessingHistoryEntry[]>('processingHistory')) ?? [];

	return c.json({
		processingHistory: history,
		threadId: c.var.thread.id,
		totalProcessed: history.length,
	});
});

// Clear processing history
api.delete('/moderated/history', validator({ output: ModeratedStateSchema }), async (c) => {
	await c.var.thread.state.delete('processingHistory');

	return c.json({
		processingHistory: [],
		threadId: c.var.thread.id,
		totalProcessed: 0,
	});
});

// Stats schema for moderated agent
export const ModeratedStatsSchema = s.object({
	threadId: s.string(),
	totalRequests: s.number(),
	blockedRequests: s.number(),
	totalTokens: s.number(),
	totalRetries: s.number(),
	averageInputLength: s.number(),
	averageOutputLength: s.number(),
});

// Get processing stats
api.get(
	'/moderated/stats',
	validator({ output: ModeratedStatsSchema }),
	async (c) => {
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
	}
);

export default api;
