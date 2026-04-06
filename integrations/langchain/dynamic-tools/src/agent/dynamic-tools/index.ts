/**
 * Dynamic Tools Agent: Demonstrates LangChain's dynamic tool filtering and runtime registration.
 *
 * LangChain concepts shown:
 * - Filtering pre-registered tools by state (authentication + message count)
 * - Filtering tools by runtime context (user role: admin/editor/viewer)
 * - Conditional tool visibility + custom tool execution via wrapModelCall + wrapToolCall
 * - Multiple middleware layers composed together
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	createMiddleware,
	tool,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// LangChain Tools — all pre-registered, selectively exposed
// ---------------------------------------------------------------------------

const publicSearch = tool(
	async ({ query }) => {
		return `Public search results for "${query}": Found 3 articles.`;
	},
	{
		name: 'public_search',
		description: 'Search publicly available information',
		schema: z.object({ query: z.string().describe('The search query') }),
	},
);

const publicWeather = tool(
	async ({ location }) => {
		const data: Record<string, string> = {
			'san francisco': '62°F, Foggy',
			'new york': '75°F, Partly cloudy',
			tokyo: '80°F, Sunny',
			london: '58°F, Rainy',
		};
		return data[location.toLowerCase()] ?? `${location}: 72°F, Sunny`;
	},
	{
		name: 'public_weather',
		description: 'Get current weather for a city',
		schema: z.object({ location: z.string().describe('The city') }),
	},
);

const readDatabase = tool(
	async ({ table }) => {
		return `Read ${table}: 42 records found. Sample: {id: 1, name: "Example", status: "active"}`;
	},
	{
		name: 'read_database',
		description: 'Read records from a database table',
		schema: z.object({ table: z.string().describe('Table name to query') }),
	},
);

const writeDatabase = tool(
	async ({ table, data }) => {
		return `Wrote to ${table}: ${data}. Record created with id: 43.`;
	},
	{
		name: 'write_database',
		description: 'Write a record to a database table',
		schema: z.object({
			table: z.string().describe('Table name'),
			data: z.string().describe('JSON data to write'),
		}),
	},
);

const deleteData = tool(
	async ({ table, id }) => {
		return `Deleted record ${id} from ${table}. Operation logged.`;
	},
	{
		name: 'delete_data',
		description: 'Delete a record from a database table (admin only)',
		schema: z.object({
			table: z.string().describe('Table name'),
			id: z.string().describe('Record ID to delete'),
		}),
	},
);

const advancedSearch = tool(
	async ({ query, filters }) => {
		return `Advanced search for "${query}" with filters [${filters}]: Found 12 results with relevance scoring.`;
	},
	{
		name: 'advanced_search',
		description: 'Advanced search with filters (requires 5+ messages in conversation)',
		schema: z.object({
			query: z.string().describe('The search query'),
			filters: z.string().optional().describe('Comma-separated filters'),
		}),
	},
);

// Conditionally visible tool — pre-registered but hidden/shown by middleware
const calculateTip = tool(
	async ({ billAmount, tipPercentage = 20 }) => {
		const tip = billAmount * (tipPercentage / 100);
		return `Tip: $${tip.toFixed(2)}, Total: $${(billAmount + tip).toFixed(2)}`;
	},
	{
		name: 'calculate_tip',
		description: 'Calculate the tip amount for a bill',
		schema: z.object({
			billAmount: z.number().describe('The bill amount'),
			tipPercentage: z.number().default(20).describe('Tip percentage'),
		}),
	},
);

const allTools = [publicSearch, publicWeather, readDatabase, writeDatabase, deleteData, advancedSearch, calculateTip];

// ---------------------------------------------------------------------------
// LangChain Model
// ---------------------------------------------------------------------------

const model = new ChatOpenAI({ model: 'gpt-5', maxTokens: 1000 });

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message'),
	userRole: s
		.enum(['admin', 'editor', 'viewer'] as const)
		.optional()
		.describe('User role for context-based filtering'),
	authenticated: s.boolean().optional().describe('Whether the user is authenticated'),
	conversationHistory: s
		.array(
			s.object({
				role: s.string(),
				content: s.string(),
			}),
		)
		.optional()
		.describe('Previous messages to affect state-based filtering'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The agent response'),
	filtersApplied: s.array(s.string()).describe('Which middleware filters were applied'),
	availableToolCount: s.number().describe('Number of tools available after filtering'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('dynamic-tools', {
	description: 'LangChain agent with dynamic tool filtering by state, context, and runtime registration',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message, userRole = 'viewer', authenticated = false, conversationHistory = [] }) => {
		ctx.logger.info('──── Dynamic Tools Agent ────');
		ctx.logger.info({ message, userRole, authenticated, historyLength: conversationHistory.length });

		// Track applied filters — scoped to this request
		const appliedFilters: string[] = [];

		// Tracks the final filtered tool count after all middleware runs; updated
		// by each wrapModelCall so the last middleware's count wins (innermost).
		let filteredToolCount = allTools.length;

		// Middleware and agent created per-request so closures capture the local array
		const stateBasedTools = createMiddleware({
			name: 'StateBasedTools',
			wrapModelCall: (request, handler) => {
				const runtime = request.runtime as { context?: { authenticated?: boolean } } | undefined;
				const isAuthenticated = runtime?.context?.authenticated ?? false;
				const messageCount = request.state.messages.length;

				let filteredTools = request.tools;

				if (!isAuthenticated) {
					filteredTools = request.tools.filter(
						(t: any) => typeof t.name === 'string' && t.name.startsWith('public_'),
					);
					appliedFilters.push('unauthenticated: public_ tools only');
				} else if (messageCount < 5) {
					filteredTools = request.tools.filter(
						(t: any) => typeof t.name === 'string' && t.name !== 'advanced_search',
					);
					appliedFilters.push('authenticated, <5 msgs: no advanced_search');
				} else {
					appliedFilters.push('authenticated, 5+ msgs: all tools');
				}

				filteredToolCount = filteredTools.length;
				return handler({ ...request, tools: filteredTools });
			},
		});

		const contextBasedTools = createMiddleware({
			name: 'ContextBasedTools',
			wrapModelCall: (request, handler) => {
				const runtime = request.runtime as { context?: { userRole?: string } } | undefined;
				const role = runtime?.context?.userRole ?? 'viewer';

				let filteredTools = request.tools;

				if (role === 'admin') {
					appliedFilters.push(`role=${role}: all tools`);
				} else if (role === 'editor') {
					filteredTools = request.tools.filter((t: any) => t.name !== 'delete_data');
					appliedFilters.push(`role=${role}: no delete_data`);
				} else {
					filteredTools = request.tools.filter(
						(t: any) =>
							typeof t.name === 'string' &&
							(t.name.startsWith('read_') || t.name.startsWith('public_')),
					);
					appliedFilters.push(`role=${role}: read/public only`);
				}

				filteredToolCount = filteredTools.length;
				return handler({ ...request, tools: filteredTools });
			},
		});

		const dynamicToolMiddleware = createMiddleware({
			name: 'DynamicToolMiddleware',
			wrapModelCall: (request, handler) => {
				const hasTip = request.tools.some((t: any) => t.name === 'calculate_tip');
				appliedFilters.push(hasTip ? 'dynamic: calculate_tip visible' : 'dynamic: calculate_tip filtered out');
				return handler(request);
			},
			wrapToolCall: (request, handler) => {
				if (request.toolCall.name === 'calculate_tip') {
					appliedFilters.push('dynamic: intercepted calculate_tip execution');
				}
				return handler(request);
			},
		});

		const langchainAgent = createLangChainAgent({
			model,
			tools: allTools,
			middleware: [stateBasedTools, contextBasedTools, dynamicToolMiddleware],
			systemPrompt:
				'You are a helpful assistant. Use the available tools to answer questions. If a tool is not available, explain that the user may need different permissions.',
		});

		// Build messages
		const messages = [
			...conversationHistory.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user' as const, content: message },
		];

		// Invoke with context for the middleware to read
		const result = await langchainAgent.invoke(
			{ messages },
			{
				context: { userRole, authenticated },
			},
		);

		// Extract response
		const lastAi = [...result.messages]
			.reverse()
			.find((m: any) => (m as any)._getType?.() === 'ai');
		const response = lastAi?.content
			? typeof lastAi.content === 'string'
				? lastAi.content
				: JSON.stringify(lastAi.content)
			: 'No response generated';

		ctx.logger.info('Agent complete', { filtersApplied: appliedFilters });

		return {
			response,
			filtersApplied: appliedFilters,
			availableToolCount: filteredToolCount,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
