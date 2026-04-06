/**
 * Writing Agent: turns researched material into well-structured written content.
 * Produces full-paragraph reports with no bullet points, suitable for articles or blog posts.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';

import '../../lib/gateway';

// Mastra sub-agent for writing (exported for use by the network routing agent)
export const writingMastraAgent = new Agent({
	id: 'writing-agent',
	name: 'Writing Agent',
	instructions:
		'You are a professional writer. Transform research insights into well-structured content. Write in full paragraphs, no bullet points. Create a cohesive narrative that flows naturally. Include all the key insights in your writing. Write in an engaging, informative style. Target 200-400 words.',
	model: 'openai/gpt-5-nano',
});

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

export const WritingInput = s.object({
	topic: s.string().describe('The topic being written about'),
	insights: s.array(s.string()).describe('Research insights to incorporate'),
	style: s.enum(['blog', 'article', 'summary', 'report']).optional().describe('Writing style'),
	model: s.enum(MODELS).optional().describe('AI model to use for writing'),
});

export const WritingOutput = s.object({
	topic: s.string().describe('The topic written about'),
	content: s.string().describe('The written content in full paragraphs'),
	wordCount: s.number().describe('Approximate word count of the content'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
});

const agent = createAgent('writing', {
	description: `This agent turns researched material into well-structured written content.
		It produces full-paragraph reports with no bullet points, suitable for use in articles, summaries, or blog posts.`,
	schema: {
		input: WritingInput,
		output: WritingOutput,
	},
	handler: async (ctx, { topic, insights, style = 'blog' }) => {
		ctx.logger.info('──── Writing Agent ────');
		ctx.logger.info({ topic, style, insightCount: insights.length });

		const insightsList = insights.map((i) => `- ${i}`).join('\n');

		const prompt = `Transform the following research insights into a well-structured ${style}.

Topic: ${topic}

Research Insights:
${insightsList}

Write in full paragraphs, no bullet points. Create a cohesive narrative that flows naturally. Target 200-400 words.

Write the ${style}:`;

		const result = await writingMastraAgent.generate(prompt);
		const content = result.text ?? '';
		const wordCount = content.split(/\s+/).length;

		ctx.logger.info('Writing complete', { wordCount });

		return {
			topic,
			content,
			wordCount,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
		};
	},
});

export default agent;
