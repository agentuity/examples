import type { AgentRequest, AgentResponse } from "@agentuity/sdk";
import { z } from "zod";
import { Exa } from "exa-js";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
	SearchProcessParametersSchema,
	type SearchResult,
} from "../../common/types";

const EVAL_PROMPT = (
	query: string,
	pendingResult: SearchResult,
	existingUrls: string[]
) => `Evaluate whether the search result is relevant and will help answer the following query: "${query}". 

If the URL already exists in the existing results, mark it as irrelevant to avoid duplicates.

<search_result>
Title: ${pendingResult.title}
URL: ${pendingResult.url}
Content: ${pendingResult.content.substring(0, 500)}...
</search_result>

<existing_urls>
${existingUrls.join("\n")}
</existing_urls>

Respond with either "relevant" or "irrelevant".`;

async function searchWeb(
	exa: Exa,
	query: string,
	numResults = 3
): Promise<SearchResult[]> {
	console.log(`Searching for: ${query}`);

	const { results } = await exa.searchAndContents(query, {
		numResults,
		livecrawl: "always",
	});

	return results.map((r) => ({
		title: r.title || "Untitled",
		url: r.url,
		content: r.text || "",
	}));
}

async function evaluateResult(
	query: string,
	result: SearchResult,
	existingUrls: string[]
): Promise<boolean> {
	// Quick check for duplicates
	if (existingUrls.includes(result.url)) {
		console.log(`Skipping duplicate URL: ${result.url}`);
		return false;
	}

	// Quick check for empty content
	if (!result.content || result.content.trim().length < 50) {
		console.log(`Skipping result with insufficient content: ${result.url}`);
		return false;
	}

	try {
		const { object: evaluation } = await generateObject({
			model: anthropic("claude-4-sonnet-20250514"),
			prompt: EVAL_PROMPT(query, result, existingUrls),
			output: "enum",
			enum: ["relevant", "irrelevant"],
		});

		const isRelevant = evaluation === "relevant";
		console.log(`${result.url} - ${isRelevant ? "RELEVANT" : "IRRELEVANT"}`);
		return isRelevant;
	} catch (error) {
		console.error(`Error evaluating ${result.url}:`, error);
		return false;
	}
}

if (!process.env.EXA_API_KEY) {
	throw new Error("EXA_API_KEY is not set");
}

export default async function Agent(req: AgentRequest, resp: AgentResponse) {
	const { query, accumulatedSources } = SearchProcessParametersSchema.parse(
		await req.data.json()
	);

	const exa = new Exa(process.env.EXA_API_KEY);
	const searchResults: SearchResult[] = [];
	const existingUrls = accumulatedSources.map((s) => s.url);

	try {
		// Perform search deterministically
		const rawResults = await searchWeb(exa, query, 5);

		// Evaluate each result deterministically
		for (const result of rawResults) {
			const isRelevant = await evaluateResult(query, result, existingUrls);

			if (isRelevant) {
				searchResults.push(result);
				existingUrls.push(result.url); // Add to existing URLs to avoid duplicates in this batch

				// Limit to 3 relevant results per query
				if (searchResults.length >= 3) {
					break;
				}
			}
		}

		console.log(`Found ${searchResults.length} relevant results for: ${query}`);

		const payload = {
			searchResults,
			message: "Research completed successfully!",
		};

		return resp.json(payload);
	} catch (error) {
		console.error("Error in web search:", error);
		return resp.text(`Failed to search web: ${error}`, {
			status: 500,
			statusText: "Web Search Failed",
		});
	}
}
