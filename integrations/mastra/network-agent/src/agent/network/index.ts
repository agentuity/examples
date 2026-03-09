/**
 * Network Agent: coordinates multiple agents, workflows, and tools to handle complex tasks.
 *
 * Uses Mastra's Agent with sub-agents and tools configured for network routing.
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
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

import '../../lib/gateway';

import { researchMastraAgent } from '../research';
import { writingMastraAgent } from '../writing';
import { weatherTool } from './tools';

const memory = new Memory({
	storage: new LibSQLStore({ id: 'network-agent-store', url: 'file:mastra.db' }),
});

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
	model: 'openai/gpt-4o-mini',
	agents: {
		researchAgent: researchMastraAgent,
		writingAgent: writingMastraAgent,
	},
	tools: {
		weatherTool,
	},
	memory,
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

		const result = await routingMastraAgent.generate(message, {
			memory: {
				resource: ctx.sessionId,
				thread: ctx.thread.id,
			},
		});

		const response = result.text ?? '';

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
