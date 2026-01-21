import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { searchWeb } from '@lib/exa';
import { EVALUATION_PROMPT } from '@lib/prompts';
import type { SearchResult } from '@lib/types';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const agent = createAgent('web-search', {
	description: 'Web search agent with relevance evaluation',
	schema: {
		input: s.object({
			query: s.string(),
			accumulatedSources: s.array(
				s.object({
					title: s.string(),
					url: s.string(),
					content: s.string(),
				}),
			),
		}),
		output: s.object({
			searchResults: s.array(
				s.object({
					title: s.string(),
					url: s.string(),
					content: s.string(),
				}),
			),
			message: s.string(),
		}),
	},
	handler: async (ctx, inputs) => {
		const searchResults: SearchResult[] = [];
		const existingUrls = inputs.accumulatedSources.map((s) => s.url);

		try {
			// Perform search with Exa API - get 5 raw results
			ctx.logger.info(`Searching for: ${inputs.query}`);
			const rawResults = await searchWeb(inputs.query, 5, ctx);

			// Evaluate each result for relevance
			for (const result of rawResults) {
				// Quick check for duplicates
				if (existingUrls.includes(result.url)) {
					ctx.logger.info(`Skipping duplicate URL: ${result.url}`);
					continue;
				}

				// Quick check for empty content
				if (!result.content || result.content.trim().length < 50) {
					ctx.logger.info(`Skipping result with insufficient content: ${result.url}`);
					continue;
				}

				// Use Claude to evaluate relevance
				try {
					const { object: evaluation } = await generateObject({
						model: anthropic('claude-sonnet-4-20250514'),
						prompt: EVALUATION_PROMPT(inputs.query, result, existingUrls),
						output: 'enum',
						enum: ['relevant', 'irrelevant'],
					});

					const isRelevant = evaluation === 'relevant';
					ctx.logger.info(`${result.url} - ${isRelevant ? 'RELEVANT' : 'IRRELEVANT'}`);

					if (isRelevant) {
						searchResults.push(result);
						existingUrls.push(result.url); // Add to existing URLs to avoid duplicates in this batch

						// Limit to 3 relevant results per query
						if (searchResults.length >= 3) {
							break;
						}
					}
				} catch (error) {
					ctx.logger.error(
						`Error evaluating ${result.url}: ${error instanceof Error ? error.message : String(error)}`,
					);
					// Continue to next result on evaluation error
					continue;
				}
			}

			ctx.logger.info(`Found ${searchResults.length} relevant results for: ${inputs.query}`);

			return {
				searchResults,
				message: 'Search completed successfully',
			};
		} catch (error) {
			ctx.logger.error(`Web search error: ${error instanceof Error ? error.message : String(error)}`);
			return {
				searchResults: [],
				message: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	},
});

export default agent;
