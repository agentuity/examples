/**
 * Dynamic Model Agent: Demonstrates LangChain's dynamic model selection via middleware.
 *
 * LangChain concepts shown:
 * - createMiddleware() with wrapModelCall hook
 * - Selecting between models based on conversation complexity (message count)
 * - ChatOpenAI model instances with different configurations
 * - Middleware integration with createAgent()
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	createMiddleware,
	tool,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// LangChain Models — two tiers for dynamic selection
// ---------------------------------------------------------------------------

const basicModel = new ChatOpenAI({
	model: 'gpt-4.1-mini',
	temperature: 0.2,
	maxTokens: 500,
});

const advancedModel = new ChatOpenAI({
	model: 'gpt-4.1',
	temperature: 0.1,
	maxTokens: 2000,
});

// ---------------------------------------------------------------------------
// LangChain Tools
// ---------------------------------------------------------------------------

const search = tool(
	async ({ query }) => {
		const results: Record<string, string> = {
			'ai news':
				'Latest: GPT-5 released, Claude 4 launches multi-agent support, Gemini adds code execution.',
			langchain:
				'LangChain is a framework for building AI agent applications with tools and memory.',
		};
		const key = Object.keys(results).find((k) => query.toLowerCase().includes(k));
		return (
			key
				? results[key]
				: `Search results for "${query}": Found 3 relevant articles about this topic.`
		) as string;
	},
	{
		name: 'search',
		description: 'Search for information on any topic',
		schema: z.object({
			query: z.string().describe('The search query'),
		}),
	},
);

const getWeather = tool(
	async ({ location }) => {
		const data: Record<string, string> = {
			'san francisco': '62°F, Foggy with coastal clouds',
			'new york': '75°F, Partly cloudy',
			tokyo: '80°F, Sunny and humid',
			london: '58°F, Rainy with light winds',
		};
		return data[location.toLowerCase()] ?? `${location}: 72°F, Sunny`;
	},
	{
		name: 'get_weather',
		description: 'Get current weather information for a city',
		schema: z.object({
			location: z.string().describe('The city to get weather for'),
		}),
	},
);

// ---------------------------------------------------------------------------
// LangChain Middleware — dynamic model selection based on message count
// ---------------------------------------------------------------------------

// Track which model was selected for reporting back to the caller
let lastSelectedModel = 'gpt-4.1-mini';

const dynamicModelSelection = createMiddleware({
	name: 'DynamicModelSelection',
	wrapModelCall: (request, handler) => {
		// Choose model based on conversation complexity
		const messageCount = request.messages.length;

		if (messageCount > 10) {
			lastSelectedModel = 'gpt-4.1';
			return handler({ ...request, model: advancedModel });
		}
		lastSelectedModel = 'gpt-4.1-mini';
		return handler({ ...request, model: basicModel });
	},
});

// ---------------------------------------------------------------------------
// LangChain Agent
// ---------------------------------------------------------------------------

const langchainAgent = createLangChainAgent({
	model: basicModel, // Default model (overridden by middleware)
	tools: [search, getWeather],
	middleware: [dynamicModelSelection],
	systemPrompt:
		'You are a helpful assistant with access to search and weather tools. Be concise.',
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message to send to the agent'),
	conversationHistory: s
		.array(
			s.object({
				role: s.string().describe('Message role: user or assistant'),
				content: s.string().describe('Message content'),
			}),
		)
		.optional()
		.describe('Previous conversation messages to simulate multi-turn complexity'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The agent response'),
	modelUsed: s.string().describe('Which model was selected by the middleware'),
	messageCount: s.number().describe('Total message count that determined model selection'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('dynamic-model', {
	description: 'LangChain agent with dynamic model selection based on conversation complexity',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message, conversationHistory = [] }) => {
		ctx.logger.info('──── Dynamic Model Agent ────');
		ctx.logger.info({ message, historyLength: conversationHistory.length });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		// Build messages array: history + current message
		const messages = [
			...conversationHistory.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user' as const, content: message },
		];

		const totalMessageCount = messages.length;

		// Invoke the LangChain agent — middleware will select the model
		const result = await langchainAgent.invoke({ messages });

		// Get the final response
		const lastAi = [...result.messages]
			.reverse()
			.find((m: any) => (m as any)._getType?.() === 'ai');
		const response = lastAi?.content
			? typeof lastAi.content === 'string'
				? lastAi.content
				: JSON.stringify(lastAi.content)
			: 'No response generated';

		ctx.logger.info('Agent complete', {
			modelUsed: lastSelectedModel,
			messageCount: totalMessageCount,
		});

		return {
			response,
			modelUsed: lastSelectedModel,
			messageCount: totalMessageCount,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
