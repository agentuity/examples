import type {
	AgentRequest,
	AgentResponse,
	AgentContext,
	RemoteAgent,
} from "@agentuity/sdk";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../../common/prompts";
import {
	DeepResearchSchema,
	SearchResultsSchema,
	type SearchResult,
} from "../../common/types";

const REFLECTION_PROMPT = (
	prompt: string,
	queries: string,
	learnings: { followUpQuestions: string[]; learning: string }
) => `Overall research goal: ${prompt}\n\n
          Previous search queries: ${queries}\n\n
          Follow-up questions: ${learnings.followUpQuestions.join(", ")}
          `;

type Learning = {
	learning: string;
	followUpQuestions: string[];
};

type Research = {
	query: string;
	queries: string[];
	searchResults: SearchResult[];
	learnings: Learning[];
	completedQueries: string[];
};

// Create a fresh accumulator per request instead of sharing state.
const createAccumulator = (): Research => ({
	query: "",
	queries: [],
	searchResults: [],
	learnings: [],
	completedQueries: [],
});

const mainModel = anthropic("claude-sonnet-4-5-20250929");

const generateSearchQueries = async (query: string, n = 3) => {
	const {
		object: { queries },
	} = await generateObject({
		model: mainModel,
		system: SYSTEM_PROMPT,
		prompt: `Generate ${n} search queries for the following query: ${query}`,
		schema: z.object({
			queries: z.array(z.string()).min(1).max(5),
		}),
	});
	return queries;
};

const generateLearnings = async (query: string, searchResult: SearchResult) => {
	const { object } = await generateObject({
		model: anthropic("claude-sonnet-4-5-20250929"),
		system: SYSTEM_PROMPT,
		prompt: `The user is researching "${query}". The following search result were deemed relevant.
      Generate a learning and a follow-up question from the following search result:
   
      <search_result>
      ${JSON.stringify(searchResult)}
      </search_result>

	  **CRITICAL**: followUpQuestions must be formatted as z.array(z.string())
      `,
		schema: z.object({
			learning: z.string(),
			followUpQuestions: z.array(z.string()),
		}),
	});
	return object;
};

async function researchWeb(
	query: string,
	researcher: RemoteAgent,
	accumulatedResearch: Research
) {
	const response = await researcher.run({
		data: {
			query,
			accumulatedSources: accumulatedResearch.searchResults,
		},
	});
	const results = await response.data.json();
	const { searchResults } = SearchResultsSchema.parse(results);
	return searchResults;
}

const deepResearch = async (
	prompt: string,
	researcher: RemoteAgent,
	accumulatedResearch: Research,
	depth = 2,
	breadth = 3,
	maxResults = 20
) => {
	if (accumulatedResearch.query.length === 0) {
		accumulatedResearch.query = prompt;
	}

	if (depth === 0) {
		return accumulatedResearch;
	} else if (accumulatedResearch.searchResults.length >= maxResults) {
		console.log(
			`Researcher: Reached maximum search results limit. Stopping further research.`
		);
		return accumulatedResearch;
	}

	console.log(`Researcher: current depth: ${depth}`);

	const queries = await generateSearchQueries(prompt, breadth);
	accumulatedResearch.queries = queries;

	console.log(`Researcher: Generated search queries: ${queries.length}`);

	for (const query of queries) {
		console.log(`Searching the web for: ${query}`);

		const searchResults = await researchWeb(
			query,
			researcher,
			accumulatedResearch
		);

		console.log(
			`Researcher: Found ${searchResults.length} search results for: ${query}`
		);
		console.log(
			`Researcher: Accumulated results: ${accumulatedResearch.searchResults.length}`
		);

		accumulatedResearch.searchResults.push(...searchResults);
		for (const searchResult of searchResults) {
			console.log(`Processing search result: ${searchResult.url}`);
			const learnings = await generateLearnings(query, searchResult);
			accumulatedResearch.learnings.push(learnings);
			accumulatedResearch.completedQueries.push(query);

			const queries = accumulatedResearch.completedQueries.join(", ");
			const newQuery = REFLECTION_PROMPT(prompt, queries, learnings);
			await deepResearch(
				newQuery,
				researcher,
				accumulatedResearch,
				depth - 1,
				Math.ceil(breadth / 2)
			);
		}
	}
	return accumulatedResearch;
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	const request = DeepResearchSchema.parse(await req.data.json());
	const input = request.query;
	const depth = request.depth ?? 2;
	const breadth = request.breadth ?? 3;
	const maxResults = request.maxResults ?? 20;

	const webSearch = await ctx.getAgent({ name: "web-search" });
	if (!webSearch) {
		return resp.text("Web Search agent not found", {
			status: 500,
			statusText: "Web Search agent Not Found",
		});
	}
	const accumulator = createAccumulator();
	const research = await deepResearch(
		input,
		webSearch,
		accumulator,
		depth,
		breadth,
		maxResults
	);
	ctx.logger.info("Deep research completed!");
	ctx.logger.info(
		`Research results: ${research.searchResults.length} search results, ${research.learnings.length} learnings`
	);
	return resp.json(research);
}
