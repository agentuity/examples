import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { SYSTEM_PROMPT } from '@lib/prompts';
import type { Research, SearchResult, Learning } from '@lib/types';
import webSearchAgent from '@agent/web-search';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const agent = createAgent('researcher', {
	description: 'Deep research agent with iterative exploration',
	schema: {
		input: s.object({
			query: s.string(),
			depth: s.number(),
			breadth: s.number(),
			maxResults: s.number(),
		}),
		output: s.object({
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
	},
	handler: async (ctx, inputs) => {
		ctx.logger.info(
			`Starting deep research: depth=${inputs.depth}, breadth=${inputs.breadth}, maxResults=${inputs.maxResults}`,
		);

		// Initialize research accumulator
		const research: Research = {
			query: inputs.query,
			queries: [],
			searchResults: [],
			learnings: [],
			completedQueries: [],
		};

		// Helper function to generate search queries using Claude
		async function generateSearchQueries(prompt: string, n: number): Promise<string[]> {
			ctx.logger.info(`Generating ${n} search queries for: ${prompt}`);

			const {
				object: { queries },
			} = await generateObject({
				model: anthropic('claude-sonnet-4-20250514'),
				system: SYSTEM_PROMPT,
				prompt: `Generate ${n} search queries for the following query: ${prompt}`,
				schema: z.object({
					queries: z.array(z.string()).min(1).max(5),
				}),
			});

			return queries;
		}

		// Helper function to extract learnings from search results
		async function extractLearning(
			query: string,
			searchResult: SearchResult,
		): Promise<Learning> {
			ctx.logger.info(`Extracting learning from result: ${searchResult.title}`);

			const { object } = await generateObject({
				model: anthropic('claude-sonnet-4-20250514'),
				system: SYSTEM_PROMPT,
				prompt: `The user is researching "${query}". Generate learning and follow-up questions from: <search_result>${JSON.stringify(searchResult)}</search_result>`,
				schema: z.object({
					learning: z.string(),
					followUpQuestions: z.array(z.string()),
				}),
			});

			return object;
		}

		// Recursive deep research function
		async function deepResearch(
			prompt: string,
			currentDepth: number,
			currentBreadth: number,
		): Promise<void> {
			// Stop conditions
			if (currentDepth === 0 || research.searchResults.length >= inputs.maxResults) {
				ctx.logger.info(
					`Stopping recursion: depth=${currentDepth}, results=${research.searchResults.length}/${inputs.maxResults}`,
				);
				return;
			}

			ctx.logger.info(`Deep research iteration: depth=${currentDepth}, breadth=${currentBreadth}`);

			// Generate search queries
			const queries = await generateSearchQueries(prompt, currentBreadth);
			research.queries.push(...queries);

			// Execute searches and accumulate results
			for (const query of queries) {
				ctx.logger.info(`Executing search query: ${query}`);

				const webSearchResult = await webSearchAgent.run({
					query,
					accumulatedSources: research.searchResults,
				});

				// Add new results to accumulator
				research.searchResults.push(...webSearchResult.searchResults);
				research.completedQueries.push(query);

				ctx.logger.info(
					`Query completed. Total results: ${research.searchResults.length}/${inputs.maxResults}`,
				);

				// Extract learnings from new results
				for (const result of webSearchResult.searchResults) {
					const learning = await extractLearning(query, result);
					research.learnings.push(learning);
				}

				// Check if we've hit max results
				if (research.searchResults.length >= inputs.maxResults) {
					ctx.logger.info('Max results reached, stopping search');
					return;
				}
			}

			// Recurse with reduced depth and halved breadth
			const newBreadth = Math.ceil(currentBreadth / 2);
			if (currentDepth > 1 && newBreadth > 0) {
				// Build refined query from learnings
				const refinedPrompt =
					research.learnings.length > 0
						? `${prompt}. Follow-up: ${research.learnings[research.learnings.length - 1].followUpQuestions.join(', ')}`
						: prompt;

				await deepResearch(refinedPrompt, currentDepth - 1, newBreadth);
			}
		}

		// Execute deep research
		try {
			await deepResearch(inputs.query, inputs.depth, inputs.breadth);

			ctx.logger.info(
				`Deep research completed! Found ${research.searchResults.length} results across ${research.completedQueries.length} queries`,
			);

			return research;
		} catch (error) {
			ctx.logger.error(
				`Deep research error: ${error instanceof Error ? error.message : String(error)}`,
			);
			// Return partial results on error
			return research;
		}
	},
});

export default agent;
