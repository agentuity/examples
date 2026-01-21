import { createRouter } from '@agentuity/runtime';
import orchestratorAgent from '@agent/orchestrator';
import researcherAgent from '@agent/researcher';
import webSearchAgent from '@agent/web-search';
import authorAgent from '@agent/author';

const api = createRouter();

// Main endpoint - orchestrator coordinates entire workflow
// Input: { query: string, depth?: number, breadth?: number, maxResults?: number }
api.post('/research', orchestratorAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await orchestratorAgent.run(data);
	return c.json(result);
});

// Individual agent endpoints for testing/debugging

// Orchestrator - same as /research
// Input: { query: string, depth?: number, breadth?: number, maxResults?: number }
api.post('/orchestrator', orchestratorAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await orchestratorAgent.run(data);
	return c.json(result);
});

// Researcher - executes iterative deep research
// Input: { query: string, depth: number, breadth: number, maxResults: number }
api.post('/researcher', researcherAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await researcherAgent.run(data);
	return c.json(result);
});

// Web Search - performs single search with relevance evaluation
// Input: { query: string, accumulatedSources: SearchResult[] }
api.post('/web-search', webSearchAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await webSearchAgent.run(data);
	return c.json(result);
});

// Author - generates markdown report from research data
// Input: Research object { query, queries[], searchResults[], learnings[], completedQueries[] }
api.post('/author', authorAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await authorAgent.run(data);
	return c.json(result);
});

export default api;
