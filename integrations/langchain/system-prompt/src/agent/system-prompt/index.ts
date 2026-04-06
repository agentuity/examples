/**
 * System Prompt Agent: Demonstrates LangChain's system prompt patterns.
 *
 * LangChain concepts shown:
 * - Static systemPrompt as a string
 * - Dynamic system prompt via middleware (changes based on user expertise level)
 * - Custom stateSchema with additional fields beyond messages (user preferences / memory)
 * - stateSchema parameter on createAgent()
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	createMiddleware,
	tool,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Custom State Schema — extends messages with user preferences (memory)
// ---------------------------------------------------------------------------

const AgentState = Annotation.Root({
	...MessagesAnnotation.spec,
	userPreferences: Annotation<{
		expertiseLevel: 'beginner' | 'intermediate' | 'expert';
		preferredLanguage: string;
		verbosity: 'concise' | 'detailed';
	}>({
		value: (_prev, next) => next,
		default: () => ({
			expertiseLevel: 'beginner',
			preferredLanguage: 'English',
			verbosity: 'detailed',
		}),
	}),
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const search = tool(
	async ({ query }) => {
		return `Search results for "${query}": Found 5 relevant articles about ${query}.`;
	},
	{
		name: 'search',
		description: 'Search for information on a topic',
		schema: z.object({ query: z.string().describe('The search query') }),
	},
);

const getDocumentation = tool(
	async ({ topic }) => {
		const docs: Record<string, string> = {
			react: 'React is a JavaScript library for building user interfaces. Key concepts: components, hooks, state, props, JSX.',
			typescript: 'TypeScript adds static typing to JavaScript. Key concepts: interfaces, generics, type guards, utility types.',
			langchain: 'LangChain is a framework for building LLM applications. Key concepts: agents, chains, tools, middleware, memory.',
			agentuity: 'Agentuity is a full-stack platform for AI agents. Key concepts: agents, threads, sessions, middleware, deployment.',
		};
		return docs[topic.toLowerCase()] ?? `Documentation for ${topic}: comprehensive guide covering fundamentals to advanced patterns.`;
	},
	{
		name: 'get_documentation',
		description: 'Get documentation for a programming topic',
		schema: z.object({ topic: z.string().describe('The programming topic') }),
	},
);

// ---------------------------------------------------------------------------
// LangChain Model
// ---------------------------------------------------------------------------

const model = new ChatOpenAI({ model: 'gpt-5', maxTokens: 1500 });

// ---------------------------------------------------------------------------
// Static system prompt — base personality and instructions
// ---------------------------------------------------------------------------

const STATIC_SYSTEM_PROMPT = `You are a knowledgeable programming assistant called CodeHelper.
You specialize in web development, TypeScript, and AI/LLM frameworks.
Always be helpful and provide accurate, well-structured answers.
When using tools, explain what you found and how it relates to the user's question.`;

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message'),
	expertiseLevel: s
		.enum(['beginner', 'intermediate', 'expert'] as const)
		.optional()
		.describe('User expertise level for dynamic prompt adjustment'),
	verbosity: s
		.enum(['concise', 'detailed'] as const)
		.optional()
		.describe('Response verbosity preference'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The agent response'),
	promptMode: s.string().describe('Which prompt mode was active'),
	staticPrompt: s.string().describe('The static system prompt used'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('system-prompt', {
	description: 'LangChain agent demonstrating static and dynamic system prompts with custom state schema',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message, expertiseLevel = 'beginner', verbosity = 'detailed' }) => {
		ctx.logger.info('──── System Prompt Agent ────');
		ctx.logger.info({ message, expertiseLevel, verbosity });

		// Track prompt mode — scoped to this request
		let activePromptMode = '';

		// Middleware and agent created per-request so the closure captures the local variable
		const dynamicSystemPromptMiddleware = createMiddleware({
			name: 'DynamicSystemPrompt',
			wrapModelCall: (request, handler) => {
				const runtime = request.runtime as { context?: { expertiseLevel?: string; verbosity?: string } } | undefined;
				const level = runtime?.context?.expertiseLevel ?? 'beginner';
				const verb = runtime?.context?.verbosity ?? 'detailed';

				let dynamicAddition = '';

				if (level === 'expert') {
					dynamicAddition = `\n\nThe user is an expert developer. Be technical and concise. Skip basic explanations. Use precise terminology. Include advanced patterns and edge cases.`;
					activePromptMode = 'Expert mode: technical, concise, advanced patterns';
				} else if (level === 'intermediate') {
					dynamicAddition = `\n\nThe user has intermediate programming knowledge. Provide clear explanations with some technical depth. Include code examples when helpful. Mention best practices.`;
					activePromptMode = 'Intermediate mode: balanced explanations with examples';
				} else {
					dynamicAddition = `\n\nThe user is a beginner. Use simple language and avoid jargon. Break concepts into small steps. Provide analogies where helpful. Always include basic code examples with comments.`;
					activePromptMode = 'Beginner mode: simple language, step-by-step, analogies';
				}

				if (verb === 'concise') {
					dynamicAddition += ' Keep responses short and to the point.';
					activePromptMode += ' + concise';
				} else {
					dynamicAddition += ' Provide thorough, detailed explanations.';
					activePromptMode += ' + detailed';
				}

				const messages = request.messages.map((m: any, i: number) => {
					if (i === 0 && m._getType?.() === 'system') {
						return { ...m, content: m.content + dynamicAddition };
					}
					return m;
				});

				return handler({ ...request, messages });
			},
		});

		const langchainAgent = createLangChainAgent({
			model,
			tools: [search, getDocumentation],
			middleware: [dynamicSystemPromptMiddleware],
			systemPrompt: STATIC_SYSTEM_PROMPT,
			stateSchema: AgentState,
		});

		const result = await langchainAgent.invoke(
			{
				messages: [new HumanMessage(message)],
				userPreferences: {
					expertiseLevel,
					preferredLanguage: 'English',
					verbosity,
				},
			},
			{ context: { expertiseLevel, verbosity } },
		);

		// Extract response
		const lastAi = [...result.messages]
			.reverse()
			.find((m: any) => m._getType?.() === 'ai');
		const response = lastAi?.content
			? typeof lastAi.content === 'string'
				? lastAi.content
				: JSON.stringify(lastAi.content)
			: 'No response generated';

		ctx.logger.info('Agent complete', { promptMode: activePromptMode });

		return {
			response,
			promptMode: activePromptMode,
			staticPrompt: STATIC_SYSTEM_PROMPT,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
