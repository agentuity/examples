/**
 * Shared TypeScript types for the deep research multi-agent system
 */

export interface SearchResult {
	title: string;
	url: string;
	content: string;
}

export interface Learning {
	learning: string;
	followUpQuestions: string[];
}

export interface Research {
	query: string;
	queries: string[];
	searchResults: SearchResult[];
	learnings: Learning[];
	completedQueries: string[];
}

export interface DeepResearchRequest {
	query: string;
	depth?: number; // 1-5, default 2
	breadth?: number; // 1-5, default 3
	maxResults?: number; // 5-100, default 20
}
