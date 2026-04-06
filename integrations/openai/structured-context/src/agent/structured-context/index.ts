/**
 * Structured Context Agent: Demonstrates typed context and structured output
 * with the OpenAI Agents JS SDK on Agentuity.
 *
 * OpenAI Agents SDK concepts shown:
 * - RunContext<T> for passing typed context to tools (never sent to LLM)
 * - outputType with Zod schema for structured JSON output
 * - Typed finalOutput matching the Zod schema
 * - Function tools accessing context for personalized data
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent, run, tool, setTracingDisabled } from '@openai/agents';
import type { RunContext } from '@openai/agents';
import { z } from 'zod';

// Disable OpenAI tracing — Agentuity provides its own observability
setTracingDisabled(true);

// ---------------------------------------------------------------------------
// Typed Context — passed to tools at runtime, never sent to the LLM
// ---------------------------------------------------------------------------

interface UserInfo {
	name: string;
	uid: number;
	role: string;
}

// ---------------------------------------------------------------------------
// Simulated contact database
// ---------------------------------------------------------------------------

const CONTACTS: Record<string, { email: string; company: string; title: string; phone: string }> = {
	alice: { email: 'alice@acme.com', company: 'Acme Corp', title: 'CTO', phone: '555-0101' },
	bob: { email: 'bob@globex.com', company: 'Globex Inc', title: 'VP Engineering', phone: '555-0202' },
	carol: { email: 'carol@initech.com', company: 'Initech', title: 'Product Manager', phone: '555-0303' },
	dave: { email: 'dave@umbrella.com', company: 'Umbrella Corp', title: 'Data Scientist', phone: '555-0404' },
};

// ---------------------------------------------------------------------------
// Tools — access RunContext<UserInfo> for personalized behavior
// ---------------------------------------------------------------------------

const lookupContact = tool({
	name: 'lookup_contact',
	description: 'Look up a contact by name. Returns their email, company, title, and phone.',
	parameters: z.object({
		name: z.string().describe('The contact name to look up'),
	}),
	execute: async ({ name }, ctx?: RunContext<UserInfo>) => {
		const requester = ctx?.context.name ?? 'unknown';
		const contact = CONTACTS[name.toLowerCase()];
		if (!contact) {
			return `No contact found for "${name}". Available: ${Object.keys(CONTACTS).join(', ')}`;
		}
		return `[Looked up by ${requester}] ${name}: ${contact.email}, ${contact.company}, ${contact.title}, ${contact.phone}`;
	},
});

const listContacts = tool({
	name: 'list_contacts',
	description: 'List all available contacts in the database.',
	parameters: z.object({}),
	execute: async (_args, ctx?: RunContext<UserInfo>) => {
		const role = ctx?.context.role ?? 'viewer';
		const names = Object.keys(CONTACTS);
		if (role === 'admin') {
			return `All contacts (admin view): ${names.map((n) => `${n} (${CONTACTS[n]!.company})`).join(', ')}`;
		}
		return `Available contacts: ${names.join(', ')}`;
	},
});

// ---------------------------------------------------------------------------
// Structured Output Schema — the LLM must return this exact shape
// ---------------------------------------------------------------------------

const ContactOutput = z.object({
	name: z.string().describe('Contact full name'),
	email: z.string().describe('Contact email address'),
	company: z.string().describe('Contact company name'),
	title: z.string().describe('Contact job title'),
	phone: z.string().describe('Contact phone number'),
	summary: z.string().describe('Brief summary of the contact lookup'),
});

// ---------------------------------------------------------------------------
// OpenAI Agents SDK Agent — with typed context and structured output
// ---------------------------------------------------------------------------

const assistant = new Agent<UserInfo, typeof ContactOutput>({
	name: 'Contact Finder',
	instructions:
		'You are a contact lookup assistant. Use the tools to find contact information. Always return complete, structured data about the contact.',
	model: 'gpt-5',
	tools: [lookupContact, listContacts],
	outputType: ContactOutput,
});

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The user message (e.g. "Find Alice" or "List all contacts")'),
});

export const AgentOutput = s.object({
	contact: s
		.object({
			name: s.string(),
			email: s.string(),
			company: s.string(),
			title: s.string(),
			phone: s.string(),
			summary: s.string(),
		})
		.optional()
		.describe('Structured contact data from outputType'),
	rawResponse: s.string().describe('Raw finalOutput as string'),
	contextUsed: s
		.object({
			name: s.string(),
			uid: s.number(),
			role: s.string(),
		})
		.describe('The RunContext passed to tools (never sent to LLM)'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('structured-context', {
	description:
		'OpenAI Agents SDK agent with RunContext<T> for typed context and outputType for structured JSON output',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Structured Context Agent ────');
		ctx.logger.info({ message });

		// Context is passed to tools but never sent to the LLM
		const userContext: UserInfo = {
			name: 'Demo User',
			uid: 42,
			role: 'admin',
		};

		ctx.logger.info('RunContext (not sent to LLM)', userContext);

		const result = await run(assistant, message, { context: userContext });

		// finalOutput is typed as z.infer<typeof ContactOutput> when outputType is set
		let contact: Record<string, unknown> | undefined;
		let rawResponse: string;

		if (typeof result.finalOutput === 'object' && result.finalOutput !== null) {
			contact = result.finalOutput as Record<string, unknown>;
			rawResponse = JSON.stringify(result.finalOutput, null, 2);
		} else {
			rawResponse = String(result.finalOutput ?? 'No response generated');
		}

		ctx.logger.info('Agent complete', {
			hasStructuredOutput: !!contact,
			responseLength: rawResponse.length,
		});

		return {
			contact: contact as AgentOutputContact | undefined,
			rawResponse,
			contextUsed: userContext,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

type AgentOutputContact = {
	name: string;
	email: string;
	company: string;
	title: string;
	phone: string;
	summary: string;
};

export default agent;
