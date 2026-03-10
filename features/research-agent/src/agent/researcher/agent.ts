import Anthropic from '@anthropic-ai/sdk';
import { createAgent } from '@agentuity/runtime';
import { ResearchInput, ResearchOutput } from './types';

const client = new Anthropic();
const MAX_STEPS = 8;

const SYSTEM_PROMPT = `You are a research assistant that investigates topics using Wikipedia.

Follow this loop:
1. **Plan** — decide what to search for next
2. **Search** — use search_wikipedia to find relevant articles
3. **Read** — use get_article to read promising article intros
4. **Finish** — once you have enough information (usually 2-4 sources), call finish_research

When calling finish_research, write a clear 2-3 paragraph summary that synthesizes what you learned. Include the total number of distinct articles you read.`;

const tools: Anthropic.Tool[] = [
	{
		name: 'search_wikipedia',
		description: 'Search Wikipedia for articles matching a query. Returns titles and snippets.',
		input_schema: {
			type: 'object' as const,
			properties: {
				query: { type: 'string', description: 'The search query' },
			},
			required: ['query'],
		},
	},
	{
		name: 'get_article',
		description: 'Get the introductory text of a Wikipedia article by title.',
		input_schema: {
			type: 'object' as const,
			properties: {
				title: { type: 'string', description: 'The exact Wikipedia article title' },
			},
			required: ['title'],
		},
	},
	{
		name: 'finish_research',
		description: 'Call this when you have gathered enough information to write a summary.',
		input_schema: {
			type: 'object' as const,
			properties: {
				summary: { type: 'string', description: 'A 2-3 paragraph synthesis of your research' },
				sourcesUsed: { type: 'number', description: 'Number of distinct articles you read' },
			},
			required: ['summary', 'sourcesUsed'],
		},
	},
];

async function searchWikipedia(query: string): Promise<string> {
	const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
	const res = await fetch(url);
	if (!res.ok) return `Wikipedia search failed: HTTP ${res.status}`;
	const data = await res.json();
	const results = data?.query?.search;
	if (!results?.length) return 'No results found.';
	return JSON.stringify(results.map((r: { title: string; snippet: string }) => ({
		title: r.title,
		snippet: r.snippet.replace(/<[^>]*>/g, ''),
	})));
}

async function getArticle(title: string): Promise<string> {
	const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
	const res = await fetch(url);
	if (!res.ok) return `Failed to fetch article: HTTP ${res.status}`;
	const data = await res.json();
	const pages = data?.query?.pages;
	if (!pages) return 'No content found.';
	const page = Object.values(pages)[0] as { extract?: string };
	return page.extract ?? 'No content found.';
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
	switch (name) {
		case 'search_wikipedia':
			return await searchWikipedia(input.query as string);
		case 'get_article':
			return await getArticle(input.title as string);
		default:
			return `Unknown tool: ${name}`;
	}
}

const agent = createAgent('researcher', {
	description: 'Researches a topic using Wikipedia and returns a structured summary',

	schema: {
		input: ResearchInput,
		output: ResearchOutput,
	},

	handler: async (ctx, input) => {
		ctx.logger.info('Starting research on: %s', input.topic);

		const messages: Anthropic.MessageParam[] = [
			{ role: 'user', content: `Research this topic thoroughly: ${input.topic}` },
		];

		// The agent loop: plan → act → observe → repeat
		for (let step = 0; step < MAX_STEPS; step++) {
			const response = await client.messages.create({
				model: 'claude-haiku-4-5',
				max_tokens: 4096,
				system: SYSTEM_PROMPT,
				tools,
				messages,
			});

			// If the model is done talking (no tool calls), break
			if (response.stop_reason !== 'tool_use') {
				ctx.logger.info('Model stopped without finish_research at step %d', step);
				break;
			}

			// Add the assistant's response (contains tool_use blocks)
			messages.push({ role: 'assistant', content: response.content });

			// Process each tool call in the response
			const toolResults: Anthropic.ToolResultBlockParam[] = [];

			for (const block of response.content) {
				if (block.type !== 'tool_use') continue;

				ctx.logger.info('Step %d: %s(%s)', step, block.name, JSON.stringify(block.input));

				// finish_research carries the final output — return it directly
				if (block.name === 'finish_research') {
					const result = block.input as { summary: string; sourcesUsed: number };
					ctx.logger.info('Research complete: %d sources used', result.sourcesUsed);
					return result;
				}

				const result = await executeTool(block.name, block.input as Record<string, unknown>);
				toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
			}

			// Send tool results back to continue the loop
			messages.push({ role: 'user', content: toolResults });
		}

		// Fallback if the model never called finish_research
		return { summary: 'Research could not be completed. Please try a more specific topic.', sourcesUsed: 0 };
	},
});

export default agent;
