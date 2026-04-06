/**
 * Streaming Agent: Demonstrates LangChain's streaming agent responses.
 *
 * LangChain concepts shown:
 * - agent.stream() with streamMode: "values"
 * - Iterating over chunks to capture intermediate steps
 * - Displaying tool calls and AI messages as they arrive
 * - Building a timeline of the agent's ReAct loop
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	tool,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const search = tool(
	async ({ query }) => {
		// Simulate a slow search to make streaming visible
		await new Promise((r) => setTimeout(r, 500));
		const results: Record<string, string> = {
			'weather': 'Current weather: 72°F, sunny skies with light winds.',
			'news': 'Top stories: AI advances in healthcare, new space mission launched, tech earnings beat expectations.',
			'stocks': 'Market update: S&P 500 up 0.8%, NASDAQ up 1.2%, Dow flat.',
			'sports': 'Latest scores: Lakers 112 - Celtics 108, Manchester United 2 - Arsenal 1.',
		};
		const key = Object.keys(results).find((k) => query.toLowerCase().includes(k));
		return results[key ?? ''] ?? `Search results for "${query}": Found 5 relevant articles.`;
	},
	{
		name: 'search',
		description: 'Search for current information on any topic',
		schema: z.object({ query: z.string().describe('The search query') }),
	},
);

const calculate = tool(
	async ({ expression }) => {
		await new Promise((r) => setTimeout(r, 300));
		try {
			// Simple safe math evaluation
			const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
			// WARNING: new Function() is equivalent to eval(). This is for demo purposes only.
			// In real applications, use a proper math parser library (e.g., mathjs).
			const result = new Function(`return ${sanitized}`)();
			return `${expression} = ${result}`;
		} catch {
			return `Could not evaluate: ${expression}`;
		}
	},
	{
		name: 'calculate',
		description: 'Calculate a mathematical expression',
		schema: z.object({ expression: z.string().describe('The math expression to evaluate') }),
	},
);

const getTime = tool(
	async ({ timezone }) => {
		await new Promise((r) => setTimeout(r, 200));
		const now = new Date();
		return `Current time in ${timezone}: ${now.toLocaleString('en-US', { timeZone: timezone.replace(' ', '_') })}`;
	},
	{
		name: 'get_time',
		description: 'Get the current time in a timezone',
		schema: z.object({ timezone: z.string().describe('Timezone like "America/New_York" or "Europe/London"') }),
	},
);

// ---------------------------------------------------------------------------
// LangChain Model & Agent
// ---------------------------------------------------------------------------

const model = new ChatOpenAI({ model: 'gpt-5', maxTokens: 1500 });

const langchainAgent = createLangChainAgent({
	model,
	tools: [search, calculate, getTime],
	systemPrompt: 'You are a helpful assistant. Use the available tools to answer questions. When a question requires multiple pieces of information, use multiple tools.',
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The final agent response'),
	timeline: s.array(s.object({
		step: s.number(),
		type: s.string(),
		content: s.string(),
		timestamp: s.number(),
	})).describe('Timeline of intermediate steps from streaming'),
	totalSteps: s.number().describe('Total number of streaming steps received'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('streaming', {
	description: 'LangChain agent demonstrating streaming with intermediate progress',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Streaming Agent ────');
		ctx.logger.info({ message });

		const timeline: Array<{ step: number; type: string; content: string; timestamp: number }> = [];
		let stepCount = 0;
		let finalResponse = '';
		const startTime = Date.now();

		// Stream the agent with streamMode: "values" to get full state at each step
		const stream = await langchainAgent.stream(
			{ messages: [new HumanMessage(message)] },
			{ streamMode: 'values' },
		);

		for await (const chunk of stream) {
			stepCount++;
			const elapsed = Date.now() - startTime;

			// Process the messages in this chunk
			const messages = chunk.messages ?? [];
			const lastMessage = messages[messages.length - 1];

			if (!lastMessage) continue;

			const msgType = (lastMessage as any)._getType?.() ?? 'unknown';

			if (msgType === 'ai') {
				const content = typeof lastMessage.content === 'string'
					? lastMessage.content
					: JSON.stringify(lastMessage.content);

				// Check for tool calls
				const toolCalls = (lastMessage as any).tool_calls ?? [];

				if (toolCalls.length > 0) {
					for (const tc of toolCalls) {
						timeline.push({
							step: stepCount,
							type: 'tool_call',
							content: `Calling ${tc.name}(${JSON.stringify(tc.args)})`,
							timestamp: elapsed,
						});
						ctx.logger.info(`Stream step ${stepCount}: tool_call ${tc.name}`);
					}
				} else if (content) {
					finalResponse = content;
					timeline.push({
						step: stepCount,
						type: 'ai_message',
						content: content.length > 200 ? content.slice(0, 200) + '...' : content,
						timestamp: elapsed,
					});
					ctx.logger.info(`Stream step ${stepCount}: ai_message (${content.length} chars)`);
				}
			} else if (msgType === 'tool') {
				const content = typeof lastMessage.content === 'string'
					? lastMessage.content
					: JSON.stringify(lastMessage.content);
				timeline.push({
					step: stepCount,
					type: 'tool_result',
					content: content.length > 200 ? content.slice(0, 200) + '...' : content,
					timestamp: elapsed,
				});
				ctx.logger.info(`Stream step ${stepCount}: tool_result`);
			}
		}

		ctx.logger.info('Stream complete', { totalSteps: stepCount, timelineEntries: timeline.length });

		return {
			response: finalResponse || 'No response generated',
			timeline,
			totalSteps: stepCount,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
