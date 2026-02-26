/**
 * Network Agent: coordinates multiple agents, workflows, and tools to handle complex tasks.
 *
 * This is the Agentuity port of Mastra's Agent Network pattern.
 * The routing agent uses LLM reasoning to interpret requests and decide which primitives
 * (sub-agents, workflows, or tools) to call, in what order, and with what data.
 *
 * Available primitives:
 * - Research Agent: gathers concise research insights in bullet-point form
 * - Writing Agent: turns research into well-structured written content
 * - Weather Tool: retrieves current weather for a location
 * - City Workflow: coordinates research + writing for city-specific tasks
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

import research from '../research';
import writing from '../writing';
import { getWeather, toolDefinitions } from './tools';
import { cityWorkflow, type CityWorkflowOutput } from './workflows';

const client = new OpenAI();

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

// Network execution event types (similar to Mastra's event streaming)
export type NetworkEventType =
	| 'network-start'
	| 'routing-agent-start'
	| 'routing-agent-end'
	| 'agent-execution-start'
	| 'agent-execution-end'
	| 'tool-execution-start'
	| 'tool-execution-end'
	| 'workflow-execution-start'
	| 'workflow-execution-end'
	| 'network-step-finish'
	| 'network-complete';

export interface NetworkEvent {
	type: NetworkEventType;
	timestamp: string;
	payload?: unknown;
}

export const NetworkInput = s.object({
	message: s.string().describe('The user message to process through the network'),
	model: s.enum(MODELS).optional().describe('AI model to use for routing decisions'),
});

export const NetworkOutput = s.object({
	message: s.string().describe('The original user message'),
	response: s.string().describe('The final response from the network'),
	events: s.array(s.any()).describe('Execution events that occurred during processing'),
	executedPrimitives: s.array(s.string()).describe('Names of primitives that were executed'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
});

// Helper to create network events
function createEvent(type: NetworkEventType, payload?: unknown): NetworkEvent {
	return {
		type,
		timestamp: new Date().toISOString(),
		payload,
	};
}

// Logger interface for tool execution
interface ToolLogger {
	info: (message: string, meta?: Record<string, unknown>) => void;
}

// Execute a tool call and return the result
async function executeTool(
	logger: ToolLogger,
	toolName: string,
	args: Record<string, unknown>,
	events: NetworkEvent[]
): Promise<string> {
	events.push(createEvent('tool-execution-start', { tool: toolName, args }));
	logger.info(`Executing tool: ${toolName}`, args);

	let result: string;

	switch (toolName) {
		case 'get_weather': {
			const weather = await getWeather(args.location as string);
			result = `Weather in ${weather.location}: ${weather.weather}`;
			break;
		}
		case 'research_topic': {
			events.push(createEvent('agent-execution-start', { agent: 'research' }));
			const researchResult = await research.run({ topic: args.topic as string });
			events.push(createEvent('agent-execution-end', { agent: 'research' }));
			result = `Research on "${researchResult.topic}":\n${researchResult.insights.map((i) => `• ${i}`).join('\n')}`;
			break;
		}
		case 'write_content': {
			events.push(createEvent('agent-execution-start', { agent: 'writing' }));
			const writeResult = await writing.run({
				topic: args.topic as string,
				insights: args.insights as string[],
				style: (args.style as 'blog' | 'article' | 'summary' | 'report') || 'blog',
			});
			events.push(createEvent('agent-execution-end', { agent: 'writing' }));
			result = writeResult.content;
			break;
		}
		case 'city_research': {
			events.push(createEvent('workflow-execution-start', { workflow: 'city' }));
			const cityResult: CityWorkflowOutput = await cityWorkflow(logger, {
				city: args.city as string,
			});
			events.push(createEvent('workflow-execution-end', { workflow: 'city' }));
			result = cityResult.report.content;
			break;
		}
		default:
			result = `Unknown tool: ${toolName}`;
	}

	events.push(createEvent('tool-execution-end', { tool: toolName, result: result.slice(0, 200) }));
	return result;
}

const agent = createAgent('network', {
	description: `A network routing agent that coordinates multiple agents, workflows, and tools.
		It interprets user requests and decides which primitives to call to fulfill the task.
		Available: research agent, writing agent, weather tool, and city workflow.`,
	schema: {
		input: NetworkInput,
		output: NetworkOutput,
	},
	handler: async (ctx, { message, model = 'gpt-5-mini' }) => {
		const events: NetworkEvent[] = [];
		const executedPrimitives: string[] = [];

		events.push(createEvent('network-start', { message }));
		ctx.logger.info('──── Network Agent ────');
		ctx.logger.info({ message, model });

		// Store conversation history in thread state
		const history = (await ctx.thread.state.get<Array<{ role: string; content: string }>>('conversation')) ?? [];

		// Build messages array with history
		const systemPrompt = `You are a network of writers and researchers.
The user will ask you to research topics, get weather, or learn about cities.
Always respond with complete, helpful information.
Write in full paragraphs, like a blog post when appropriate.
Do not answer with incomplete or uncertain information.

You have access to the following tools:
1. get_weather - Get current weather for any location
2. research_topic - Gather research insights about any topic
3. write_content - Turn research insights into well-written content
4. city_research - Get comprehensive information about a city (research + written report)

For complex tasks:
- If the user wants a written report, first use research_topic, then use write_content
- If the user asks about a specific city, consider using city_research for a complete report
- For simple weather questions, just use get_weather

Always use tools when appropriate rather than making up information.`;

		const messages: OpenAI.ChatCompletionMessageParam[] = [
			{ role: 'system', content: systemPrompt },
			...history.map((h) => ({
				role: h.role as 'user' | 'assistant',
				content: h.content,
			})),
			{ role: 'user', content: message },
		];

		events.push(createEvent('routing-agent-start'));
		ctx.logger.info('Routing agent analyzing request...');

		// Initial routing call with tools
		let completion = await client.chat.completions.create({
			model,
			messages,
			tools: toolDefinitions,
			tool_choice: 'auto',
		});

		events.push(createEvent('routing-agent-end'));

		let assistantMessage = completion.choices[0]?.message;
		let response = assistantMessage?.content || '';

		// Process tool calls in a loop until no more are needed
		while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
			const toolResults: OpenAI.ChatCompletionMessageParam[] = [];

			// Execute all tool calls
			for (const toolCall of assistantMessage.tool_calls) {
				// Type guard for function tool calls
				if (toolCall.type !== 'function') continue;
				const toolName = toolCall.function.name;
				const args = JSON.parse(toolCall.function.arguments);

				executedPrimitives.push(toolName);
				const result = await executeTool(ctx.logger, toolName, args, events);

				toolResults.push({
					role: 'tool',
					tool_call_id: toolCall.id,
					content: result,
				});
			}

			events.push(createEvent('network-step-finish', { tools: executedPrimitives }));

			// Continue the conversation with tool results
			messages.push({
				role: 'assistant',
				content: assistantMessage.content,
				tool_calls: assistantMessage.tool_calls,
			});
			messages.push(...toolResults);

			events.push(createEvent('routing-agent-start'));

			// Get next response
			completion = await client.chat.completions.create({
				model,
				messages,
				tools: toolDefinitions,
				tool_choice: 'auto',
			});

			events.push(createEvent('routing-agent-end'));
			assistantMessage = completion.choices[0]?.message;
			response = assistantMessage?.content || response;
		}

		// Update conversation history
		history.push({ role: 'user', content: message });
		history.push({ role: 'assistant', content: response });

		// Keep last 10 exchanges
		await ctx.thread.state.set('conversation', history.slice(-20));

		events.push(createEvent('network-complete', { response: response.slice(0, 200) }));
		ctx.logger.info('──── Network Complete ────');
		ctx.logger.info({ executedPrimitives, eventCount: events.length });

		return {
			message,
			response,
			events,
			executedPrimitives,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
		};
	},
});

export default agent;
