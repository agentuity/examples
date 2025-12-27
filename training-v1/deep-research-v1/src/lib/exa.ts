/**
 * Exa API client utilities for web search
 */

import Exa from 'exa-js';
import type { SearchResult } from './types';

export function createExaClient(): Exa {
	const apiKey = process.env.EXA_API_KEY;
	if (!apiKey) {
		throw new Error('EXA_API_KEY environment variable is required');
	}
	return new Exa(apiKey);
}

export async function searchWeb(
	query: string,
	numResults: number,
	ctx: { logger: { info: (msg: string) => void } },
): Promise<SearchResult[]> {
	ctx.logger.info(`Searching Exa for: ${query}`);

	const exa = createExaClient();
	const results = await exa.searchAndContents(query, {
		numResults,
		livecrawl: 'always',
	});

	return results.results.map((r: any) => ({
		title: r.title || 'Untitled',
		url: r.url,
		content: r.text || '',
	}));
}
