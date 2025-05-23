import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { z } from "zod";
import { Exa } from "exa-js";
import { generateObject, generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SearchResultSchema, type SearchResult } from "../../common/types";

const mainModel = anthropic("claude-3-5-sonnet-latest");

const SearchProcessParametersSchema = z.object({
	query: z.string().min(1),
	accumulatedSources: z.array(SearchResultSchema),
});

const searchTool = (exa: Exa) =>
	tool({
		description: "Search the web for information about a given query",
		parameters: z.object({
			query: z.string().min(1),
		}),
		async execute({ query }) {
			const { results } = await exa.searchAndContents(query, {
				numResults: 1,
				livecrawl: "always",
			});
			return {
				results: results.map((r) => ({
					title: r.title,
					url: r.url,
					content: r.text,
				})),
			};
		},
	});

const evaluateTool = (
	query: string,
	accumulatedSources: SearchResult[],
	finalSearchResults: SearchResult[]
) => {
	const EVAL_PROMPT = (
		query: string,
		pendingResult: SearchResult,
		results: SearchResult[]
	) => `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.
   
	<search_results>
	${JSON.stringify(pendingResult)}
	</search_results>

	<existing_results>
	${JSON.stringify(results.map((result) => result.url))}
	</existing_results>`;

	return tool({
		description: "Evaluate the search results",
		parameters: z.object({
			results: z.array(SearchResultSchema) || SearchResultSchema,
		}),
		async execute({ results }) {
			const pendingResult = results.pop();

			if (pendingResult) {
				const { object: evaluation } = await generateObject({
					model: mainModel,
					prompt: EVAL_PROMPT(query, pendingResult, accumulatedSources),
					output: "enum",
					enum: ["relevant", "irrelevant"],
				});
				if (evaluation === "relevant") {
					finalSearchResults.push(pendingResult);
				}

				console.log("Found:", pendingResult.url);
				console.log("Evaluation completed:", evaluation);
				return evaluation === "irrelevant"
					? "Search results are irrelevant. Please search again with a more specific query."
					: "Search results are relevant. End research for this query.";
			} else {
				return "No more search results to evaluate.";
			}
		},
	});
};

const SYSTEM_PROMPT =
	"You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query";

const exa = new Exa(process.env.EXA_API_KEY);

export default async function Agent(req: AgentRequest, resp: AgentResponse) {
	const { query, accumulatedSources } = SearchProcessParametersSchema.parse(
		await req.data.json()
	);

	const searchResults: SearchResult[] = [];

	await generateText({
		model: mainModel,
		prompt: `Search the web for information about ${query}`,
		system: SYSTEM_PROMPT,
		maxSteps: 5,
		tools: {
			searchWeb: searchTool(exa),
			evaluate: evaluateTool(query, accumulatedSources, searchResults),
		},
	});

	const payload = {
		searchResults,
		message: "Research completed successfully!",
	};

	return resp.json(payload);
}
