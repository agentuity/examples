/**
 * API routes for the memory agent.
 * Demonstrates the Mastra "Agent Memory" pattern with chat, history, and clear endpoints.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import memory, { type ChatMessage, type UserPreferences, ChatMessageSchema, UserPreferencesSchema } from '../agent/memory';

// Schema for history response
const HistorySchema = s.object({
	messages: s.array(ChatMessageSchema).describe('Conversation history'),
	preferences: UserPreferencesSchema.optional().describe('Stored user preferences'),
	threadId: s.string().describe('Thread ID'),
	messageCount: s.number().describe('Total message count'),
});

const router = new Hono<Env>()

// POST /api/chat - Send a message and get a response (like Mastra's agent.generate())
.post('/chat', memory.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await memory.run(data));
})

// GET /api/history - Retrieve conversation history (like Mastra's memory.recall())
.get('/history', validator({ output: HistorySchema }), async (c) => {
	const messages = (await c.var.thread.state.get<ChatMessage[]>('messages')) ?? [];
	const preferences = (await c.var.thread.state.get<UserPreferences>('preferences')) ?? {};

	return c.json({
		messages,
		preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
		threadId: c.var.thread.id,
		messageCount: messages.length,
	});
})

// DELETE /api/history - Clear conversation history
.delete('/history', validator({ output: HistorySchema }), async (c) => {
	await c.var.thread.state.delete('messages');
	await c.var.thread.state.delete('preferences');

	return c.json({
		messages: [],
		preferences: undefined,
		threadId: c.var.thread.id,
		messageCount: 0,
	});
})

// GET /api/health - Health check
.get('/health', async (c) => {
	return c.json({ status: 'ok', agent: 'memory' });
});

export default router;
