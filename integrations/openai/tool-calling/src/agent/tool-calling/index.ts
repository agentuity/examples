/**
 * Tool Calling Agent: Demonstrates OpenAI Agents JS SDK core patterns on Agentuity.
 *
 * OpenAI Agents SDK concepts shown:
 * - Function tools defined with tool() + Zod schemas
 * - Agent creation with name, instructions, model, modelSettings
 * - Running agents with run() and extracting finalOutput
 * - Automatic ReAct loop (tool calling + observation + reasoning)
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent, run, tool, setTracingDisabled } from '@openai/agents';
import { z } from 'zod';

// Disable OpenAI tracing — Agentuity provides its own observability
setTracingDisabled(true);

// ---------------------------------------------------------------------------
// OpenAI Agents SDK Tools — defined with tool() + Zod schemas
// ---------------------------------------------------------------------------

const search = tool({
	name: 'search',
	description: 'Search for information on any topic',
	parameters: z.object({
		query: z.string().describe('The search query'),
	}),
	execute: async ({ query }) => {
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
});

const getWeather = tool({
	name: 'get_weather',
	description: 'Get current weather information for a city',
	parameters: z.object({
		location: z.string().describe('The city to get weather for'),
	}),
	execute: async ({ location }) => {
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
});

// ---------------------------------------------------------------------------
// OpenAI Agents SDK Agent — with model, tools, and instructions
// ---------------------------------------------------------------------------

const assistant = new Agent({
	name: 'Research Assistant',
	instructions:
		'You are a helpful assistant with access to search and weather tools. Use them when the user asks about current information or weather. Be concise.',
	model: 'gpt-5',
	tools: [search, getWeather],
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

const StepSchema = s.object({
	type: s.string().describe('Step type: tool_call or tool_result'),
	content: s.string().describe('Step content'),
	toolName: s.string().optional().describe('Tool name (for tool steps)'),
	toolArgs: s.string().optional().describe('Tool arguments as JSON (for tool_call steps)'),
});

export const AgentInput = s.object({
	message: s.string().describe('The user message to send to the agent'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The final agent response'),
	steps: s.array(StepSchema).describe('Tool usage trace from the agent run'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('tool-calling', {
	description:
		'OpenAI Agents SDK agent with function tools, model config, and automatic ReAct loop',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Tool Calling Agent ────');
		ctx.logger.info({ message });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		// Run the OpenAI Agents SDK agent — the ReAct loop runs automatically
		const result = await run(assistant, message);

		// Extract tool usage steps from the run result
		type Step = { type: string; content: string; toolName?: string; toolArgs?: string };
		const steps: Step[] = [];

		for (const item of result.newItems) {
			if (item.type === 'tool_call_item') {
				const raw = item.rawItem as Record<string, unknown>;
				if (raw.type === 'function_call') {
					steps.push({
						type: 'tool_call',
						content: `Calling ${raw.name as string}`,
						toolName: raw.name as string,
						toolArgs: raw.arguments as string,
					});
				}
			} else if (item.type === 'tool_call_output_item') {
				steps.push({
					type: 'tool_result',
					content: typeof item.output === 'string' ? item.output : JSON.stringify(item.output),
				});
			} else if (item.type === 'message_output_item') {
				const raw = item.rawItem as Record<string, unknown>;
				const contentArr = raw.content as Array<{ type: string; text?: string }> | undefined;
				const text = contentArr
					?.map((c) => (c.type === 'output_text' ? c.text ?? '' : ''))
					.join('');
				if (text) {
					steps.push({ type: 'ai', content: text });
				}
			}
		}

		const response =
			typeof result.finalOutput === 'string'
				? result.finalOutput
				: JSON.stringify(result.finalOutput) ?? 'No response generated';

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
