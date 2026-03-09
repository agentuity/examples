/**
 * Research Agent: gathers concise research insights in bullet-point form.
 * Designed to extract key facts without generating full responses or narrative content.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';

import '../../lib/gateway';

// Mastra sub-agent for research (exported for use by the network routing agent)
export const researchMastraAgent = new Agent({
	id: 'research-agent',
	name: 'Research Agent',
	instructions:
		'You are a research assistant. Research the topic and provide key insights as bullet points. Be concise and factual. Focus on extracting the most important and interesting facts. Do not write full paragraphs - only bullet points. Provide 5-7 key bullet points.',
	model: 'openai/gpt-4o-mini',
});

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

export const ResearchInput = s.object({
	topic: s.string().describe('The topic to research'),
	model: s.enum(MODELS).optional().describe('AI model to use for research'),
});

export const ResearchOutput = s.object({
	topic: s.string().describe('The researched topic'),
	insights: s.array(s.string()).describe('Key research insights as bullet points'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
});

const agent = createAgent('research', {
	description: `This agent gathers concise research insights in bullet-point form.
		It's designed to extract key facts without generating full responses or narrative content.`,
	schema: {
		input: ResearchInput,
		output: ResearchOutput,
	},
	handler: async (ctx, { topic }) => {
		ctx.logger.info('──── Research Agent ────');
		ctx.logger.info({ topic });

		const result = await researchMastraAgent.generate(`Research topic: ${topic}`);
		const content = result.text ?? '';

		// Parse bullet points from the response
		const insights = content
			.split('\n')
			.map((line) => line.replace(/^[-•*]\s*/, '').trim())
			.filter((line) => line.length > 0);

		ctx.logger.info('Research complete', { insightCount: insights.length });

		return {
			topic,
			insights,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
		};
	},
});

export default agent;
