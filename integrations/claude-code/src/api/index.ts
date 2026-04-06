/**
 * API routes for the Claude Code agent.
 * Routes handle chat interactions and conversation history management.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import claudeCode from '@agent/claude-code';

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

const router = new Hono<Env>()
	// Send a chat message to the Claude Code agent
	.post('/chat', claudeCode.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await claudeCode.run(data));
	})
	// Retrieve conversation history
	.get('/chat/history', validator({ output: HistoryOutput }), async (c) => {
		const messages =
			(await c.var.thread.state.get<
				Array<{ role: string; content: string; timestamp: string }>
			>('messages')) ?? [];

		return c.json({
			messages,
			threadId: c.var.thread.id,
			messageCount: messages.length,
		});
	})
	// Clear conversation history
	.delete('/chat/history', validator({ output: HistoryOutput }), async (c) => {
		await c.var.thread.state.delete('messages');
		return c.json({
			messages: [],
			threadId: c.var.thread.id,
			messageCount: 0,
		});
	});

export default router;
