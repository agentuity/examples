/**
 * Memory Agent: Demonstrates conversational memory using Mastra's Agent and Memory classes
 * inside the Agentuity agent wrapper.
 *
 * Key features demonstrated:
 * 1. Persistent message history via Mastra Memory (lastMessages: 20 sliding window)
 * 2. Thread isolation via ctx.thread.id passed as the memory resource/thread key
 * 3. Multi-turn conversations that recall previous exchanges
 * 4. LibSQL-backed storage for durable conversation state
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

import '../../lib/gateway';

// ---------------------------------------------------------------------------
// Legacy schemas re-exported so that src/api/index.ts continues to compile.
// The history/clear API routes still use ctx.thread.state for their own
// lightweight reads; these types describe the shape of those stored values.
// ---------------------------------------------------------------------------
export const ChatMessageSchema = s.object({
	role: s.enum(['user', 'assistant']).describe('Who sent the message'),
	content: s.string().describe('The message content'),
	timestamp: s.string().describe('ISO timestamp when message was sent'),
});

export type ChatMessage = s.infer<typeof ChatMessageSchema>;

export const UserPreferencesSchema = s.object({
	name: s.string().optional().describe('User name if shared'),
	interests: s.array(s.string()).optional().describe('User interests'),
	facts: s.array(s.string()).optional().describe('Facts the user has shared'),
});

export type UserPreferences = s.infer<typeof UserPreferencesSchema>;

// ---------------------------------------------------------------------------
// Input/Output schemas (kept for Agentuity compatibility)
// ---------------------------------------------------------------------------
export const AgentInput = s.object({
	message: s.string().describe('User message to the agent'),
});

export const AgentOutput = s.object({
	response: s.string().describe('Agent response'),
	messageCount: s.number().describe('Total messages in conversation history (managed by Mastra)'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	sessionId: s.string().describe('Current session identifier'),
});

// ---------------------------------------------------------------------------
// Mastra agent with Memory — replaces manual OpenAI calls and
// ctx.thread.state message management.
// ---------------------------------------------------------------------------
const memoryMastraAgent = new Agent({
	id: 'memory-agent',
	name: 'Memory Agent',
	instructions: `You are a helpful assistant with memory. You remember previous conversations and user preferences within this thread.

When users share personal information (name, interests, facts about themselves), acknowledge it naturally and remember it for future reference.

When users ask about previous conversations or their stored information, recall it accurately.

Be conversational, friendly, and demonstrate that you remember context from earlier in the conversation.`,
	model: 'openai/gpt-4o-mini',
	memory: new Memory({
		storage: new LibSQLStore({ id: 'memory-agent-store', url: 'file:mastra.db' }),
		options: { lastMessages: 20 },
	}),
});

const agent = createAgent('memory', {
	description: 'A conversational agent with memory that recalls previous messages and user preferences',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { message }) => {
		ctx.logger.info('Memory Agent Request', {
			message: message.slice(0, 50),
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		});

		// Mastra Memory uses resource + thread IDs to scope and recall conversation history
		const result = await memoryMastraAgent.generate(message, {
			memory: {
				resource: ctx.thread.id,
				thread: ctx.thread.id,
			},
		});

		ctx.logger.info('Memory Agent Response', {
			responseLength: result.text.length,
		});

		// Mirror messages to Agentuity thread state so the frontend can display them
		const now = new Date().toISOString();
		await ctx.thread.state.push('messages', { role: 'user', content: message, timestamp: now } satisfies ChatMessage, 40);
		await ctx.thread.state.push('messages', { role: 'assistant', content: result.text, timestamp: now } satisfies ChatMessage, 40);

		// Extract preferences from the response for the frontend sidebar
		const prefs = (await ctx.thread.state.get<UserPreferences>('preferences')) ?? {};
		const lower = message.toLowerCase();
		if (lower.includes('my name is') || lower.includes("i'm ") || lower.includes('i am ')) {
			const nameMatch = message.match(/(?:my name is|i'm|i am)\s+(\w+)/i);
			if (nameMatch) {
				prefs.name = nameMatch[1];
				await ctx.thread.state.set('preferences', prefs);
			}
		}
		if (lower.includes('i love') || lower.includes('i like') || lower.includes('i enjoy') || lower.includes('interested in')) {
			const interests = prefs.interests ?? [];
			const interestMatch = message.match(/(?:i love|i like|i enjoy|interested in)\s+(.+)/i);
			if (interestMatch?.[1]) {
				const newInterests = interestMatch[1].split(/\s+and\s+|,\s*/);
				for (const i of newInterests) {
					const trimmed = i.trim();
					if (trimmed && !interests.includes(trimmed)) interests.push(trimmed);
				}
				prefs.interests = interests;
				await ctx.thread.state.set('preferences', prefs);
			}
		}

		const allMessages = (await ctx.thread.state.get<ChatMessage[]>('messages')) ?? [];

		return {
			response: result.text,
			messageCount: allMessages.length,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
