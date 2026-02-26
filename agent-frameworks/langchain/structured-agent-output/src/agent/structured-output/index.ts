/**
 * Structured Output Agent: Demonstrates LangChain's structured output patterns.
 *
 * LangChain concepts shown:
 * - Zod schema defining the expected output shape
 * - model.withStructuredOutput(schema) for typed extraction
 * - Two-step pattern: agent gathers data with tools, then structured extraction
 * - Tools that gather data for structured extraction
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import {
	createAgent as createLangChainAgent,
	tool,
} from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Zod schema for structured output — the shape the LLM must return
// ---------------------------------------------------------------------------

const ContactInfoSchema = z.object({
	name: z.string().describe('Full name of the person'),
	email: z.string().describe('Email address, or "not found" if unavailable'),
	phone: z.string().describe('Phone number, or "not found" if unavailable'),
	company: z.string().describe('Company or organization name, or "not found"'),
	role: z.string().describe('Job title or role, or "not found"'),
	summary: z.string().describe('Brief one-sentence summary of the contact'),
});

// ---------------------------------------------------------------------------
// Tools — gather data for structured extraction
// ---------------------------------------------------------------------------

const lookupPerson = tool(
	async ({ name }) => {
		const people: Record<string, string> = {
			'jane doe': 'Jane Doe is a Senior Engineer at TechCorp. Email: jane@techcorp.com, Phone: 555-0101. She leads the platform team.',
			'john smith': 'John Smith is the CTO of StartupAI. Email: john@startupai.io, Phone: 555-0202. He oversees all engineering.',
			'alice chen': 'Alice Chen is a Product Manager at DataFlow Inc. Email: alice.chen@dataflow.com. She manages the analytics product.',
			'bob wilson': 'Bob Wilson is a freelance consultant. Email: bob@wilson.dev, Phone: 555-0404. Specializes in cloud architecture.',
		};
		const key = name.toLowerCase();
		return people[key] ?? `No records found for "${name}". Only basic info: ${name} appears to be a software professional.`;
	},
	{
		name: 'lookup_person',
		description: 'Look up contact information for a person by name',
		schema: z.object({ name: z.string().describe('Person name to look up') }),
	},
);

const searchCompany = tool(
	async ({ company }) => {
		const companies: Record<string, string> = {
			techcorp: 'TechCorp — Enterprise SaaS company, 500 employees, HQ in San Francisco.',
			startupai: 'StartupAI — AI startup, 50 employees, Series B, based in NYC.',
			'dataflow inc': 'DataFlow Inc — Data analytics platform, 200 employees, Austin TX.',
		};
		const key = company.toLowerCase();
		return companies[key] ?? `${company}: No detailed records. Appears to be a technology company.`;
	},
	{
		name: 'search_company',
		description: 'Search for company information',
		schema: z.object({ company: z.string().describe('Company name') }),
	},
);

// ---------------------------------------------------------------------------
// LangChain Models
// ---------------------------------------------------------------------------

const model = new ChatOpenAI({ model: 'gpt-4.1', temperature: 0 });

// Step 1: Agent with tools to gather information
const langchainAgent = createLangChainAgent({
	model,
	tools: [lookupPerson, searchCompany],
	systemPrompt: `You are a contact information extraction assistant. When asked about a person, use the available tools to look up their information. Summarize everything you find about the person clearly.`,
});

// Step 2: Structured extraction model — withStructuredOutput forces typed output
// Using method: "functionCalling" to use tool calling instead of response_format/parse
const structuredModel = model.withStructuredOutput(ContactInfoSchema, {
	method: 'functionCalling',
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message — e.g. "Look up Jane Doe"'),
});

export const AgentOutput = s.object({
	structuredResponse: s.object({
		name: s.string(),
		email: s.string(),
		phone: s.string(),
		company: s.string(),
		role: s.string(),
		summary: s.string(),
	}).describe('The structured contact info extracted by the agent'),
	rawResponse: s.string().describe('The raw text response from the agent'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('structured-output', {
	description: 'LangChain agent with withStructuredOutput for typed data extraction',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Structured Output Agent ────');
		ctx.logger.info({ message });

		// Step 1: Agent gathers data using tools
		const result = await langchainAgent.invoke({
			messages: [new HumanMessage(message)],
		});

		// Extract raw text response from the agent
		const lastAi = [...result.messages]
			.reverse()
			.find((m: any) => m._getType?.() === 'ai');
		const rawResponse = lastAi?.content
			? typeof lastAi.content === 'string'
				? lastAi.content
				: JSON.stringify(lastAi.content)
			: 'No response generated';

		ctx.logger.info('Agent gathered info', { rawResponse: rawResponse.slice(0, 100) });

		// Step 2: Extract structured data using withStructuredOutput
		const structured = await structuredModel.invoke([
			new HumanMessage(`Extract contact information from the following text. Use "not found" for any missing fields.\n\n${rawResponse}`),
		]);

		ctx.logger.info('Structured output', { structured });

		return {
			structuredResponse: structured,
			rawResponse,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
