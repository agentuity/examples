/**
 * Streaming Agent: Demonstrates OpenAI Agents JS SDK streaming on Agentuity.
 *
 * OpenAI Agents SDK concepts shown:
 * - Streaming with run(agent, input, { stream: true })
 * - Iterating stream events with for-await-of
 * - Event types: raw_model_stream_event, run_item_stream_event, agent_updated_stream_event
 * - Building a real-time timeline of agent activity
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent, run, tool, setTracingDisabled } from '@openai/agents';
import { z } from 'zod';

// Disable OpenAI tracing — Agentuity provides its own observability
setTracingDisabled(true);

// ---------------------------------------------------------------------------
// Tools — with simulated delays to make streaming visible
// ---------------------------------------------------------------------------

const search = tool({
	name: 'search',
	description: 'Search for current information on any topic',
	parameters: z.object({
		query: z.string().describe('The search query'),
	}),
	execute: async ({ query }) => {
		await new Promise((r) => setTimeout(r, 500));
		const results: Record<string, string> = {
			weather: 'Current weather: 72°F, sunny skies with light winds.',
			news: 'Top stories: AI advances in healthcare, new space mission launched, tech earnings beat expectations.',
			stocks: 'Market update: S&P 500 up 0.8%, NASDAQ up 1.2%, Dow flat.',
			sports: 'Latest scores: Lakers 112 - Celtics 108, Manchester United 2 - Arsenal 1.',
		};
		const key = Object.keys(results).find((k) => query.toLowerCase().includes(k));
		return results[key ?? ''] ?? `Search results for "${query}": Found 5 relevant articles.`;
	},
});

const calculate = tool({
	name: 'calculate',
	description: 'Calculate a mathematical expression',
	parameters: z.object({
		expression: z.string().describe('The math expression to evaluate'),
	}),
	execute: async ({ expression }) => {
		await new Promise((r) => setTimeout(r, 300));
		try {
			const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
			const result = new Function(`return ${sanitized}`)();
			return `${expression} = ${result}`;
		} catch {
			return `Could not evaluate: ${expression}`;
		}
	},
});

const getTime = tool({
	name: 'get_time',
	description: 'Get the current time in a timezone',
	parameters: z.object({
		timezone: z.string().describe('Timezone like "America/New_York" or "Europe/London"'),
	}),
	execute: async ({ timezone }) => {
		await new Promise((r) => setTimeout(r, 200));
		const now = new Date();
		return `Current time in ${timezone}: ${now.toLocaleString('en-US', { timeZone: timezone.replace(' ', '_') })}`;
	},
});

// ---------------------------------------------------------------------------
// OpenAI Agents SDK Agent
// ---------------------------------------------------------------------------

const assistant = new Agent({
	name: 'Streaming Assistant',
	instructions:
		'You are a helpful assistant. Use the available tools to answer questions. When a question requires multiple pieces of information, use multiple tools.',
	model: 'gpt-4.1',
	modelSettings: { temperature: 0.3 },
	tools: [search, calculate, getTime],
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The final agent response'),
	timeline: s
		.array(
			s.object({
				step: s.number(),
				type: s.string(),
				content: s.string(),
				timestamp: s.number(),
			}),
		)
		.describe('Timeline of streaming events'),
	totalSteps: s.number().describe('Total number of streaming steps received'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('streaming', {
	description: 'OpenAI Agents SDK agent demonstrating streaming with real-time event timeline',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Streaming Agent ────');
		ctx.logger.info({ message });

		const timeline: Array<{ step: number; type: string; content: string; timestamp: number }> = [];
		let stepCount = 0;
		const startTime = Date.now();

		// Stream the agent — { stream: true } enables incremental output
		const result = await run(assistant, message, { stream: true });

		// Iterate over stream events as they arrive
		for await (const event of result) {
			stepCount++;
			const elapsed = Date.now() - startTime;

			if (event.type === 'raw_model_stream_event') {
				// Low-level model response chunks (text deltas)
				const data = event.data as Record<string, unknown>;
				if (data.type === 'output_text_delta') {
					const delta = (data as { delta?: string }).delta ?? '';
					if (delta) {
						timeline.push({
							step: stepCount,
							type: 'text_delta',
							content: delta.length > 100 ? delta.slice(0, 100) + '...' : delta,
							timestamp: elapsed,
						});
					}
				}
			} else if (event.type === 'run_item_stream_event') {
				// Agent SDK events: tool calls, tool results, messages
				const item = event.item as unknown as Record<string, unknown>;
				const itemType = item.type as string;

				if (itemType === 'tool_call_item') {
					const raw = item.rawItem as Record<string, unknown> | undefined;
					const name = raw?.type === 'function_call' ? (raw.name as string) : 'tool';
					timeline.push({
						step: stepCount,
						type: 'tool_call',
						content: `Calling ${name}`,
						timestamp: elapsed,
					});
					ctx.logger.info(`Stream step ${stepCount}: tool_call ${name}`);
				} else if (itemType === 'tool_call_output_item') {
					const output = item.output;
					const content = typeof output === 'string' ? output : JSON.stringify(output);
					timeline.push({
						step: stepCount,
						type: 'tool_result',
						content: content.length > 200 ? content.slice(0, 200) + '...' : content,
						timestamp: elapsed,
					});
					ctx.logger.info(`Stream step ${stepCount}: tool_result`);
				} else if (itemType === 'message_output_item') {
					timeline.push({
						step: stepCount,
						type: 'message',
						content: 'Agent generating response...',
						timestamp: elapsed,
					});
					ctx.logger.info(`Stream step ${stepCount}: message_output`);
				}
			} else if (event.type === 'agent_updated_stream_event') {
				// Agent switch events (relevant in multi-agent handoffs)
				const agentName = (event as { agent?: { name?: string } }).agent?.name ?? 'unknown';
				timeline.push({
					step: stepCount,
					type: 'agent_updated',
					content: `Active agent: ${agentName}`,
					timestamp: elapsed,
				});
				ctx.logger.info(`Stream step ${stepCount}: agent_updated → ${agentName}`);
			}
		}

		// Wait for stream to complete and get final result
		await result.completed;

		const response =
			typeof result.finalOutput === 'string'
				? result.finalOutput
				: JSON.stringify(result.finalOutput) ?? 'No response generated';

		// Filter out excessive text_delta entries — keep only the meaningful ones
		const meaningfulTimeline = timeline.filter((t) => t.type !== 'text_delta');

		ctx.logger.info('Stream complete', {
			totalSteps: stepCount,
			timelineEntries: meaningfulTimeline.length,
		});

		return {
			response,
			timeline: meaningfulTimeline,
			totalSteps: stepCount,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
