/**
 * API routes for the Claude Code agent.
 * Routes handle chat interactions and conversation history management.
 */

import { createRouter, validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import claudeCode from '../agent/claude-code';

const api = createRouter();

// Send a chat message to the Claude Code agent
api.post('/chat', claudeCode.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await claudeCode.run(data));
});

// Schema for history responses
export const HistoryOutput = s.object({
	messages: s.array(
		s.object({
			role: s.enum(['user', 'assistant']),
			content: s.string(),
			timestamp: s.string(),
		}),
	),
	threadId: s.string(),
	messageCount: s.number(),
});

// Retrieve conversation history
api.get('/chat/history', validator({ output: HistoryOutput }), async (c) => {
	const messages =
		(await c.var.thread.state.get<
			Array<{ role: string; content: string; timestamp: string }>
		>('messages')) ?? [];

	return c.json({
		messages,
		threadId: c.var.thread.id,
		messageCount: messages.length,
	});
});

// Clear conversation history
api.delete('/chat/history', validator({ output: HistoryOutput }), async (c) => {
	await c.var.thread.state.delete('messages');
	return c.json({
		messages: [],
		threadId: c.var.thread.id,
		messageCount: 0,
	});
});

export default api;
