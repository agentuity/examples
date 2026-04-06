/**
 * Network Agent: coordinates multiple agents and tools to handle complex tasks.
 *
 * Uses Mastra's Agent with sub-agents and tools configured for network routing.
 * Conversation history is persisted via Agentuity ctx.thread.state.
 *
 * Available primitives:
 * - Research Agent: gathers concise research insights in bullet-point form
 * - Writing Agent: turns research into well-structured written content
 * - Weather Tool: retrieves current weather for a location
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';

import '../../lib/gateway';

import { researchMastraAgent } from '../research';
import { writingMastraAgent } from '../writing';
import { weatherTool } from './tools';

const routingMastraAgent = new Agent({
	id: 'routing-agent',
	name: 'Network Routing Agent',
	instructions: `You are a network of writers and researchers.
The user will ask you to research topics, get weather, or learn about cities.
Always respond with complete, helpful information.
Write in full paragraphs, like a blog post when appropriate.
Do not answer with incomplete or uncertain information.

For complex tasks:
- If the user wants a written report, use the research agent to gather facts, then use the writing agent to produce the content
- If the user asks about a specific city, use the research agent for city facts, then the writing agent for a complete report
- For simple weather questions, use the weather tool`,
	model: 'openai/gpt-5-nano',
	agents: {
		researchAgent: researchMastraAgent,
		writingAgent: writingMastraAgent,
	},
	tools: {
		weatherTool,
	},
});

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

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

const agent = createAgent('network', {
	description: `A network routing agent that coordinates multiple agents, workflows, and tools.
		It interprets user requests and decides which primitives to call to fulfill the task.
		Available: research agent, writing agent, weather tool, and city workflow.`,
	schema: {
		input: NetworkInput,
		output: NetworkOutput,
	},
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Network Agent ────');
		ctx.logger.info({ message });

		// Load conversation history from Agentuity thread state and pass to agent
		const conversation =
			(await ctx.thread.state.get<Array<{ role: string; content: string }>>('conversation')) ?? [];
		const messages = [
			...conversation.map((m) => {
				if (m.role === 'user') return { role: 'user' as const, content: m.content };
				return { role: 'assistant' as const, content: m.content };
			}),
			{ role: 'user' as const, content: message },
		];

		const result = await routingMastraAgent.generate(messages);
		const response = result.text ?? '';

		// Persist user + assistant messages with a 20-message sliding window
		await ctx.thread.state.push('conversation', { role: 'user', content: message }, 20);
		await ctx.thread.state.push('conversation', { role: 'assistant', content: response }, 20);

		ctx.logger.info('──── Network Complete ────');
		ctx.logger.info({ response: response.slice(0, 200) });

		return {
			message,
			response,
			events: [],
			executedPrimitives: [],
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
		};
	},
});

export default agent;
