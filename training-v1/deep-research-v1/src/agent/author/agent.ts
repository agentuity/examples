import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { SYSTEM_PROMPT, AUTHOR_PROMPT } from '@lib/prompts';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const agent = createAgent('author', {
	description: 'Report authoring agent',
	schema: {
		input: s.object({
			query: s.string(),
			queries: s.array(s.string()),
			searchResults: s.array(
				s.object({
					title: s.string(),
					url: s.string(),
					content: s.string(),
				}),
			),
			learnings: s.array(
				s.object({
					learning: s.string(),
					followUpQuestions: s.array(s.string()),
				}),
			),
			completedQueries: s.array(s.string()),
		}),
		output: s.string(),
	},
	handler: async (ctx, inputs) => {
		ctx.logger.info('Generating report from research data');

		try {
			const { text } = await generateText({
				model: anthropic('claude-sonnet-4-20250514'),
				system: SYSTEM_PROMPT,
				prompt: AUTHOR_PROMPT(inputs),
			});

			ctx.logger.info('Report generated successfully');
			return text;
		} catch (error) {
			ctx.logger.error(
				`Report generation error: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	},
});

export default agent;
