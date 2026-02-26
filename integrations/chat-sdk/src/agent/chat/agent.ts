import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const InputSchema = s.object({
	text: s.string().describe('The message text to respond to'),
	threadId: s.string().describe('Chat SDK thread ID for conversation tracking'),
});

const OutputSchema = s.object({
	response: s.string().describe('The AI-generated response'),
});

const agent = createAgent('chat', {
	description: 'AI chat agent that responds to messages from Slack and Discord with multi-turn conversation memory',
	schema: {
		input: InputSchema,
		output: OutputSchema,
	},
	handler: async (ctx, { text, threadId }) => {
		ctx.logger.info('Chat request', { messageLength: text.length, threadId });

		// Load conversation history from KV storage
		const history = await ctx.kv.get('chat-sdk-conversations', threadId);
		const stored = history.exists
			? (history.data as { messages: Array<{ role: 'user' | 'assistant'; content: string }> })
			: null;
		const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
			stored ? stored.messages : [];

		// Build AI SDK messages: recent history + current message
		const recentMessages = messages.slice(-20);
		const aiMessages = [
			...recentMessages.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user' as const, content: text },
		];

		const result = await generateText({
			model: anthropic('claude-haiku-4-5'),
			system:
				'You are a helpful assistant deployed across Slack and Discord. Keep responses concise and conversational. You have access to conversation history, so you can reference prior messages.',
			messages: aiMessages,
		});

		// Append user + assistant messages, then trim to sliding window (20 messages = 10 turns)
		messages.push({ role: 'user', content: text });
		messages.push({ role: 'assistant', content: result.text });
		const trimmed = messages.slice(-20);

		// Persist with 24-hour TTL
		await ctx.kv.set('chat-sdk-conversations', threadId, { messages: trimmed }, { ttl: 86400 });

		ctx.logger.info('Chat response generated', { responseLength: result.text.length, historySize: trimmed.length });

		return { response: result.text };
	},
});

export default agent;
