import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { z } from "zod";
import { Exa } from "exa-js";
import { generateObject, generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SearchResultSchema, type SearchResult } from "../../common/types";
import { SYSTEM_PROMPT } from "../../common/prompts";

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
	accumulatedSources: SearchResult[]
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
			results: z.union([z.array(SearchResultSchema), SearchResultSchema]),
		}),
		async execute({ results }) {
			// Normalize results to always be an array
			const resultsArray = Array.isArray(results) ? results : [results];
			const pendingResult = resultsArray.pop();

			if (pendingResult) {
				const { object: evaluation } = await generateObject({
					model: anthropic("claude-4-sonnet-20250514"),
					prompt: EVAL_PROMPT(query, pendingResult, accumulatedSources),
					output: "enum",
					enum: ["relevant", "irrelevant"],
				});

				console.log("Found:", pendingResult.url);
				console.log("Evaluation completed:", evaluation);
				
				return {
					evaluation,
					pendingResult
				};
			}

			return "No more search results to evaluate.";
		},
	});
};

if (!process.env.EXA_API_KEY) {
	throw new Error("EXA_API_KEY is not set");
}
const exa = new Exa(process.env.EXA_API_KEY);

export default async function Agent(req: AgentRequest, resp: AgentResponse) {
	const { query, accumulatedSources } = SearchProcessParametersSchema.parse(
		await req.data.json()
	);

	const searchResults: SearchResult[] = [];

	const { steps } = await generateText({
		model: anthropic("claude-4-sonnet-20250514"),
		prompt: `Search the web for information about ${query}`,
		system: SYSTEM_PROMPT,
		maxSteps: 5,
		tools: {
			searchWeb: searchTool(exa),
			evaluate: evaluateTool(query, accumulatedSources),
		},
	});

	// Process tool results to add relevant search results
	for (const step of steps) {
		if (step.toolCalls) {
			for (const toolCall of step.toolCalls) {
				if (toolCall.toolName === 'evaluate' && step.toolResults) {
					const toolResult = step.toolResults.find(r => r.toolCallId === toolCall.toolCallId);
					if (toolResult?.result && typeof toolResult.result === 'object') {
						const evalResult = toolResult.result as { evaluation: string; pendingResult: SearchResult };
						if (evalResult.evaluation === 'relevant' && evalResult.pendingResult) {
							searchResults.push(evalResult.pendingResult);
						}
					}
				}
			}
		}
	}

	const payload = {
		searchResults,
		message: "Research completed successfully!",
	};

	return resp.json(payload);
}
