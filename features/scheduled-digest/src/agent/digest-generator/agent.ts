import { createAgent } from '@agentuity/runtime';
import { generateText, Output } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod';
import { AgentInput, AgentOutput } from './types';

// Zod schema for structured output generation
const LLMOutputSchema = z.object({
	title: z.string().describe('Digest title like "Tech Digest — Feb 19, 2026"'),
	htmlContent: z.string().describe('Complete HTML document with inline dark-theme styles'),
	summary: z.string().describe('2-3 sentence plain text summary of the digest'),
	itemCount: z.number().describe('Total number of items summarized'),
});

const agent = createAgent('digest-generator', {
	description: 'Generates a formatted HTML digest from content sources using an LLM',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		ctx.logger.info('Generating digest', {
			sourceCount: input.sources.length,
			date: input.date,
		});

		const totalItems = input.sources.reduce((sum, s) => sum + s.items.length, 0);
		const dateStr = new Date(input.date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});

		const sourcesJSON = JSON.stringify(input.sources, null, 2);

		const result = await generateText({
			model: xai('grok-4-1-fast-reasoning'),
			output: Output.object({ schema: LLMOutputSchema }),
			prompt: `You are a tech content curator. Generate a concise, well-formatted HTML digest from the following source data.

Date: ${dateStr}

Sources:
${sourcesJSON}

Requirements:
- Create a complete HTML document with inline styles using a dark theme (background: #0a0a0a, text: #e5e5e5, accent: #00FFFF) — colors match the Agentuity brand palette
- Use clean, modern typography (system-ui font stack)
- Group content by source with clear headings styled with the cyan accent color
- For each item, write a 1-2 sentence summary. Include the link if available.
- Add a brief editorial intro paragraph at the top
- Include a footer with the generation date
- Keep the total digest under 2000 words
- Use clean, semantic HTML
- The itemCount should be ${totalItems}

Return the digest as { title, htmlContent, summary, itemCount }.`,
		});

		ctx.logger.info('Digest generated', {
			title: result.output.title,
			itemCount: result.output.itemCount,
		});

		return result.output;
	},
});

export default agent;
