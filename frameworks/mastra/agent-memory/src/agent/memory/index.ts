/**
 * Memory Agent: Demonstrates conversational memory using Agentuity's thread state.
 * This example ports the Mastra "Agent Memory" pattern to the Agentuity platform.
 *
 * Key features demonstrated:
 * 1. Message history with sliding window (like Mastra's lastMessages option)
 * 2. Thread isolation (automatic via cookies, like Mastra's thread parameter)
 * 3. Multi-turn conversations that recall previous exchanges
 * 4. User preference storage (like Mastra's working memory)
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const client = new OpenAI();

// Maximum messages to keep in history (equivalent to Mastra's lastMessages option)
const MAX_MESSAGES = 20;

// Message stored in thread state
export const ChatMessageSchema = s.object({
	role: s.enum(['user', 'assistant']).describe('Who sent the message'),
	content: s.string().describe('The message content'),
	timestamp: s.string().describe('ISO timestamp when message was sent'),
});

export type ChatMessage = s.infer<typeof ChatMessageSchema>;

// User preferences stored in thread state (like Mastra's working memory)
export const UserPreferencesSchema = s.object({
	name: s.string().optional().describe('User name if shared'),
	interests: s.array(s.string()).optional().describe('User interests'),
	facts: s.array(s.string()).optional().describe('Facts the user has shared'),
});

export type UserPreferences = s.infer<typeof UserPreferencesSchema>;

// Input/Output schemas
export const AgentInput = s.object({
	message: s.string().describe('User message to the agent'),
});

export const AgentOutput = s.object({
	response: s.string().describe('Agent response'),
	messageCount: s.number().describe('Total messages in conversation history'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	sessionId: s.string().describe('Current session identifier'),
	preferences: UserPreferencesSchema.optional().describe('Stored user preferences'),
});

// Extract user preferences from conversation
function extractPreferences(
	userMessage: string,
	assistantResponse: string,
	existing: UserPreferences
): UserPreferences {
	const updated = { ...existing };

	// Extract name patterns
	const namePatterns = [
		/my name is (\w+)/i,
		/i'm (\w+)/i,
		/call me (\w+)/i,
		/i am (\w+)/i,
	];

	for (const pattern of namePatterns) {
		const match = userMessage.match(pattern);
		if (match?.[1] && match[1].length > 1) {
			updated.name = match[1];
			break;
		}
	}

	// Extract interests
	const interestPatterns = [
		/i (?:like|love|enjoy) (\w+(?:\s+\w+)?)/gi,
		/i'm (?:interested in|into) (\w+(?:\s+\w+)?)/gi,
		/my (?:hobby|hobbies|favorite|favourite) (?:is|are) (\w+(?:\s+\w+)?)/gi,
	];

	const interests = new Set(existing.interests ?? []);
	for (const pattern of interestPatterns) {
		const matches = userMessage.matchAll(pattern);
		for (const match of matches) {
			if (match[1]) {
				interests.add(match[1].toLowerCase());
			}
		}
	}
	if (interests.size > 0) {
		updated.interests = Array.from(interests).slice(0, 10); // Keep max 10 interests
	}

	// Extract facts (simple patterns for demo)
	const factPatterns = [
		/i (?:work|live|am from|was born) (?:at|in|as) (.+?)(?:\.|,|$)/gi,
		/my (?:job|profession|occupation) is (.+?)(?:\.|,|$)/gi,
	];

	const facts = new Set(existing.facts ?? []);
	for (const pattern of factPatterns) {
		const matches = userMessage.matchAll(pattern);
		for (const match of matches) {
			if (match[1] && match[1].length > 2) {
				facts.add(match[0].trim());
			}
		}
	}
	if (facts.size > 0) {
		updated.facts = Array.from(facts).slice(0, 10); // Keep max 10 facts
	}

	return updated;
}

// Build system prompt with conversation context
function buildSystemPrompt(messages: ChatMessage[], preferences: UserPreferences): string {
	let contextSection = '';

	// Add user preferences if known
	if (preferences.name || preferences.interests?.length || preferences.facts?.length) {
		contextSection += '\n\nKnown information about the user:';
		if (preferences.name) {
			contextSection += `\n- Name: ${preferences.name}`;
		}
		if (preferences.interests?.length) {
			contextSection += `\n- Interests: ${preferences.interests.join(', ')}`;
		}
		if (preferences.facts?.length) {
			contextSection += `\n- Facts: ${preferences.facts.join('; ')}`;
		}
	}

	// Add recent conversation summary if exists
	if (messages.length > 0) {
		const recentCount = Math.min(messages.length, 5);
		contextSection += `\n\nRecent conversation (${messages.length} total messages, showing last ${recentCount}):`;
		const recent = messages.slice(-recentCount);
		for (const msg of recent) {
			const role = msg.role === 'user' ? 'User' : 'Assistant';
			const content = msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content;
			contextSection += `\n${role}: ${content}`;
		}
	}

	return `You are a helpful assistant with memory. You remember previous conversations and user preferences within this thread.

When users share personal information (name, interests, facts about themselves), acknowledge it naturally and remember it for future reference.

When users ask about previous conversations or their stored information, recall it accurately.

Be conversational, friendly, and demonstrate that you remember context from earlier in the conversation.${contextSection}`;
}

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

		// Retrieve existing messages from thread state (like Mastra's memory.recall())
		const existingMessages = (await ctx.thread.state.get<ChatMessage[]>('messages')) ?? [];
		const preferences = (await ctx.thread.state.get<UserPreferences>('preferences')) ?? {};

		ctx.logger.info('Loaded conversation context', {
			messageCount: existingMessages.length,
			hasPreferences: Object.keys(preferences).length > 0,
		});

		// Build system prompt with context
		const systemPrompt = buildSystemPrompt(existingMessages, preferences);

		// Prepare messages for OpenAI (include recent history for context)
		const openaiMessages: ChatCompletionMessageParam[] = [
			{ role: 'system', content: systemPrompt },
		];

		// Add recent messages to OpenAI context (last 10 for API call)
		const recentMessages = existingMessages.slice(-10);
		for (const msg of recentMessages) {
			openaiMessages.push({
				role: msg.role,
				content: msg.content,
			});
		}

		// Add current user message
		openaiMessages.push({ role: 'user', content: message });

		// Call OpenAI
		const completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: openaiMessages,
		});

		const response = completion.choices[0]?.message?.content ?? 'I apologize, I was unable to generate a response.';

		// Store user message with sliding window (like Mastra's lastMessages option)
		const userMessage: ChatMessage = {
			role: 'user',
			content: message,
			timestamp: new Date().toISOString(),
		};
		await ctx.thread.state.push('messages', userMessage, MAX_MESSAGES);

		// Store assistant response with sliding window
		const assistantMessage: ChatMessage = {
			role: 'assistant',
			content: response,
			timestamp: new Date().toISOString(),
		};
		await ctx.thread.state.push('messages', assistantMessage, MAX_MESSAGES);

		// Extract and update user preferences
		const updatedPreferences = extractPreferences(message, response, preferences);
		if (JSON.stringify(updatedPreferences) !== JSON.stringify(preferences)) {
			await ctx.thread.state.set('preferences', updatedPreferences);
			ctx.logger.info('Updated user preferences', updatedPreferences);
		}

		// Get final message count
		const finalMessages = (await ctx.thread.state.get<ChatMessage[]>('messages')) ?? [];

		ctx.logger.info('Memory Agent Response', {
			responseLength: response.length,
			messageCount: finalMessages.length,
		});

		return {
			response,
			messageCount: finalMessages.length,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			preferences: Object.keys(updatedPreferences).length > 0 ? updatedPreferences : undefined,
		};
	},
});

export default agent;
