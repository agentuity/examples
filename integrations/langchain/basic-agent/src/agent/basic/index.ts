/**
 * Basic Agent: Demonstrates core LangChain agent patterns ported to Agentuity.
 *
 * LangChain concepts shown:
 * - Static model configuration with ChatOpenAI instance
 * - Static tools defined with tool() + Zod schemas
 * - Custom tool error handling via wrapToolCall middleware
 * - Basic agent.invoke() with the ReAct loop
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	createMiddleware,
	tool,
	ToolMessage,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// LangChain Tools — defined with tool() + Zod schemas
// ---------------------------------------------------------------------------

const search = tool(
	async ({ query }) => {
		// Simulated search — replace with a real API in production
		const results: Record<string, string> = {
			'ai news':
				'Latest: GPT-5 released, Claude 4 launches multi-agent support, Gemini adds code execution.',
			'weather api': 'Popular weather APIs: OpenWeatherMap, WeatherAPI, Tomorrow.io.',
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
		// Simulated weather data — replace with a real API in production
		const data: Record<string, string> = {
			'san francisco': '62°F, Foggy with coastal clouds',
			'new york': '75°F, Partly cloudy',
			tokyo: '80°F, Sunny and humid',
			london: '58°F, Rainy with light winds',
			paris: '65°F, Clear skies',
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
// LangChain Model — instance with explicit configuration
// ---------------------------------------------------------------------------

// You can also use a model identifier string: model: "openai:gpt-5"
// Using an instance gives control over temperature, token limits, timeouts, etc.
const model = new ChatOpenAI({
	model: 'gpt-5',
	maxTokens: 1000,
});

// ---------------------------------------------------------------------------
// LangChain Middleware — tool error handling via wrapToolCall
// ---------------------------------------------------------------------------

const handleToolErrors = createMiddleware({
	name: 'HandleToolErrors',
	wrapToolCall: async (request, handler) => {
		try {
			return await handler(request);
		} catch (error) {
			// Return a ToolMessage so the model can recover gracefully
			return new ToolMessage({
				content: `Tool error: Please check your input and try again. (${error})`,
				tool_call_id: request.toolCall.id!,
			});
		}
	},
});

// ---------------------------------------------------------------------------
// LangChain Agent — createAgent() with static model + tools + middleware
// ---------------------------------------------------------------------------

const langchainAgent = createLangChainAgent({
	model,
	tools: [search, getWeather],
	middleware: [handleToolErrors],
	systemPrompt:
		'You are a helpful assistant with access to search and weather tools. Use them when the user asks about current information or weather. Be concise.',
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

const StepSchema = s.object({
	type: s.string().describe('Step type in the ReAct trace: human, ai, tool_call, or tool_result'),
	content: s.string().describe('Step content'),
	toolName: s.string().optional().describe('Tool name (for tool_call and tool_result steps)'),
	toolArgs: s.string().optional().describe('Tool arguments as JSON (for tool_call steps)'),
});

export const AgentInput = s.object({
	message: s.string().describe('The user message to send to the agent'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The final agent response'),
	steps: s.array(StepSchema).describe('ReAct loop trace showing reasoning and tool use'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('basic', {
	description:
		'LangChain basic agent with static tools, model config, and error handling middleware',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Basic Agent ────');
		ctx.logger.info({ message });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		// Invoke the LangChain agent — the ReAct loop runs automatically
		const result = await langchainAgent.invoke({
			messages: [{ role: 'user', content: message }],
		});

		// Extract the ReAct trace from the message history
		type Step = { type: string; content: string; toolName?: string; toolArgs?: string };
		const steps: Step[] = [];

		for (const msg of result.messages) {
			const msgType = (msg as any)._getType?.() ?? 'unknown';

			if (msgType === 'human') {
				steps.push({
					type: 'human',
					content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
				});
			} else if (msgType === 'ai') {
				const aiMsg = msg as any;
				// Record tool calls (the "Acting" part of ReAct)
				if (aiMsg.tool_calls?.length > 0) {
					for (const tc of aiMsg.tool_calls) {
						steps.push({
							type: 'tool_call',
							content: `Calling ${tc.name}`,
							toolName: tc.name,
							toolArgs: JSON.stringify(tc.args),
						});
					}
				}
				// Record AI text content (the "Reasoning" / final answer)
				const content =
					typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
				if (content.length > 0) {
					steps.push({ type: 'ai', content });
				}
			} else if (msgType === 'tool') {
				// Record tool observations
				const toolMsg = msg as any;
				steps.push({
					type: 'tool_result',
					content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
					toolName: toolMsg.name,
				});
			}
		}

		// Final response is the last AI message content
		const lastAi = [...result.messages]
			.reverse()
			.find((m: any) => (m as any)._getType?.() === 'ai');
		const response = lastAi?.content
			? typeof lastAi.content === 'string'
				? lastAi.content
				: JSON.stringify(lastAi.content)
			: 'No response generated';

		ctx.logger.info('Agent complete', { stepCount: steps.length, responseLength: response.length });

		return {
			response,
			steps,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
