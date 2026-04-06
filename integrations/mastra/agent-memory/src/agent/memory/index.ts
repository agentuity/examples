/**
 * Memory Agent: Demonstrates conversational memory using Mastra's Agent with
 * Agentuity thread state for persistent history.
 *
 * Key features demonstrated:
 * 1. Persistent message history via ctx.thread.state.push() (20-message sliding window)
 * 2. Thread isolation via ctx.thread.id (automatic per-thread storage)
 * 3. Multi-turn conversations that recall previous exchanges
 * 4. Agentuity-native storage — no local DB files needed
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';

import '../../lib/gateway';

// ---------------------------------------------------------------------------
// Schemas used by both the agent handler and API routes (src/api/index.ts).
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
	messageCount: s.number().describe('Total messages in conversation history'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	sessionId: s.string().describe('Current session identifier'),
});

// ---------------------------------------------------------------------------
// Mastra agent — conversation history is managed via ctx.thread.state,
// not Mastra Memory. Messages are loaded from thread state and passed
// directly to agent.generate().
// ---------------------------------------------------------------------------
const memoryMastraAgent = new Agent({
	id: 'memory-agent',
	name: 'Memory Agent',
	instructions: `You are a helpful assistant with memory. You remember previous conversations and user preferences within this thread.

When users share personal information (name, interests, facts about themselves), acknowledge it naturally and remember it for future reference.

When users ask about previous conversations or their stored information, recall it accurately.

Be conversational, friendly, and demonstrate that you remember context from earlier in the conversation.`,
	model: 'openai/gpt-5-nano',
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

		// Load conversation history from Agentuity thread state and pass to agent
		const history = (await ctx.thread.state.get<ChatMessage[]>('messages')) ?? [];
		const messages = [
			...history.map((m) => {
				if (m.role === 'user') return { role: 'user' as const, content: m.content };
				return { role: 'assistant' as const, content: m.content };
			}),
			{ role: 'user' as const, content: message },
		];

		const result = await memoryMastraAgent.generate(messages);

		ctx.logger.info('Memory Agent Response', {
			responseLength: result.text.length,
		});

		// Persist user + assistant messages with a 20-message sliding window
		const now = new Date().toISOString();
		await ctx.thread.state.push('messages', { role: 'user', content: message, timestamp: now } satisfies ChatMessage, 20);
		await ctx.thread.state.push('messages', { role: 'assistant', content: result.text, timestamp: now } satisfies ChatMessage, 20);

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
