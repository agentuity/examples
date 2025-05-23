import { z } from 'zod';

export const SearchResultSchema = z.object({
	title: z.string(),
	url: z.string().url(),
	content: z.string(),
});

export const SearchResultsSchema = z.object({
	searchResults: z.array(SearchResultSchema),
	message: z.string(),
});

export const LearningSchema = z.object({
	learning: z.string(),
	followUpQuestions: z.array(z.string()),
});

export const ResearchSchema = z.object({
	query: z.string(),
	queries: z.array(z.string()),
	searchResults: z.array(SearchResultSchema),
	learnings: z.array(LearningSchema),
	completedQueries: z.array(z.string()),
});

export const DeepResearchSchema = z.object({
	query: z.string().min(1),
	depth: z.number().min(1).max(5).optional(),
	breadth: z.number().min(1).max(5).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
export type Learning = z.infer<typeof LearningSchema>;
export type Research = z.infer<typeof ResearchSchema>;
