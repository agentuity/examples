/**
 * Research Agent: gathers concise research insights in bullet-point form.
 * Designed to extract key facts without generating full responses or narrative content.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const client = new OpenAI();

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
	handler: async (ctx, { topic, model = 'gpt-5-mini' }) => {
		ctx.logger.info('──── Research Agent ────');
		ctx.logger.info({ topic, model });

		const prompt = `You are a research assistant. Research the following topic and provide key insights as bullet points.
Be concise and factual. Focus on extracting the most important and interesting facts.
Do not write full paragraphs - only bullet points.

Topic: ${topic}

Provide 5-7 key bullet points:`;

		const completion = await client.chat.completions.create({
			model,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = completion.choices[0]?.message?.content ?? '';

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
