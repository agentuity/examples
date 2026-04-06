/**
 * Agent Handoffs: Demonstrates multi-agent handoffs with the OpenAI Agents JS SDK on Agentuity.
 *
 * OpenAI Agents SDK concepts shown:
 * - handoffs array for basic agent-to-agent delegation
 * - handoff() with onHandoff callback and inputType for typed escalation data
 * - handoff() with toolNameOverride for custom tool naming
 * - Agent.create() for proper type inference across handoff chains
 * - result.lastAgent to track which agent handled the request
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent, run, tool, handoff, setTracingDisabled } from '@openai/agents';
import { z } from 'zod';

// Disable OpenAI tracing — Agentuity provides its own observability
setTracingDisabled(true);

// ---------------------------------------------------------------------------
// Specialist Agent Tools
// ---------------------------------------------------------------------------

const lookupInvoice = tool({
	name: 'lookup_invoice',
	description: 'Look up an invoice by customer name or invoice number',
	parameters: z.object({
		query: z.string().describe('Customer name or invoice number'),
	}),
	execute: async ({ query }) => {
		const invoices: Record<string, string> = {
			alice: 'INV-001: $250.00 — Web hosting (Jan 2025), Status: Paid',
			bob: 'INV-002: $1,200.00 — Enterprise plan (Q1 2025), Status: Overdue',
			carol: 'INV-003: $89.99 — Starter plan (Feb 2025), Status: Paid',
			'inv-001': 'INV-001: $250.00 — Web hosting (Jan 2025), Customer: Alice, Status: Paid',
			'inv-002': 'INV-002: $1,200.00 — Enterprise plan (Q1 2025), Customer: Bob, Status: Overdue',
		};
		return invoices[query.toLowerCase()] ?? `No invoice found for "${query}"`;
	},
});

const processRefund = tool({
	name: 'process_refund',
	description: 'Process a refund for an invoice',
	parameters: z.object({
		invoiceId: z.string().describe('The invoice ID to refund'),
		reason: z.string().describe('Reason for the refund'),
	}),
	execute: async ({ invoiceId, reason }) => {
		return `Refund processed for ${invoiceId}. Reason: ${reason}. Amount will be credited within 3-5 business days.`;
	},
});

// ---------------------------------------------------------------------------
// Specialist Agents
// ---------------------------------------------------------------------------

const billingAgent = new Agent({
	name: 'Billing Agent',
	instructions:
		'You are a billing specialist. Help customers with invoice lookups, payment status, and billing questions. Use the lookup_invoice tool to find invoices.',
	model: 'gpt-5',
	tools: [lookupInvoice],
});

const refundAgent = new Agent({
	name: 'Refund Agent',
	instructions:
		'You are a refund specialist. Process refund requests immediately using the process_refund tool. Do not ask for confirmation — just process the refund right away based on the information provided.',
	model: 'gpt-5',
	tools: [processRefund],
});

const faqAgent = new Agent({
	name: 'FAQ Agent',
	instructions: `You are an FAQ agent. Answer common questions about the service:
- Business hours: Mon-Fri 9am-5pm EST
- Support email: support@example.com
- Free trial: 14 days, no credit card required
- Plans: Starter ($89/mo), Pro ($249/mo), Enterprise (custom)
- Refund policy: Full refund within 30 days`,
	model: 'gpt-5',
});

// ---------------------------------------------------------------------------
// Triage Agent — routes to specialists via handoffs
// ---------------------------------------------------------------------------

// Typed escalation input for refund handoff
const EscalationData = z.object({
	reason: z.string().describe('Why this is being escalated to refunds'),
});

// Factory: creates the triage agent with logger access for onHandoff callbacks
function createTriageAgent(logger: { info: (...args: unknown[]) => void }) {
	return Agent.create({
		name: 'Triage Agent',
		instructions: `You are a customer service triage agent. Route customer requests to the right specialist:
- Billing questions (invoices, payments, account balance) → Billing Agent
- Refund requests → Refund Agent (use escalate_to_refund)
- General questions (hours, pricing, plans, policies) → FAQ Agent

Always route to a specialist. Do not try to answer questions yourself.`,
		model: 'gpt-5',
		handoffs: [
			// Basic handoff — just pass the agent directly
			billingAgent,
			// Customized handoff — with callback, typed input, and custom tool name
			handoff(refundAgent, {
				onHandoff: (_ctx, input) => {
					logger.info('Refund escalation:', input?.reason);
				},
				inputType: EscalationData,
				toolNameOverride: 'escalate_to_refund',
				toolDescriptionOverride: 'Escalate to refund specialist with a reason',
			}),
			// Basic handoff for FAQ
			faqAgent,
		],
	});
}

// ---------------------------------------------------------------------------
// Agentuity Agent Wrapper
// ---------------------------------------------------------------------------

export const AgentInput = s.object({
	message: s.string().describe('The customer message'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The final agent response'),
	handedOffTo: s.string().describe('Which specialist agent handled the request'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
});

const agent = createAgent('handoffs', {
	description:
		'OpenAI Agents SDK multi-agent handoff system with triage routing to billing, refund, and FAQ specialists',
	schema: { input: AgentInput, output: AgentOutput },
	handler: async (ctx, { message }) => {
		ctx.logger.info('──── Agent Handoffs ────');
		ctx.logger.info({ message });

		const triageAgent = createTriageAgent(ctx.logger);
		const result = await run(triageAgent, message);

		ctx.logger.info('Run result', {
			finalOutput: result.finalOutput,
			finalOutputType: typeof result.finalOutput,
			lastAgent: result.lastAgent?.name,
			newItemsCount: result.newItems.length,
		});

		// After handoffs, finalOutput may be undefined — fall back to the last
		// text output item produced by the specialist agent.
		let response: string;
		if (result.finalOutput && typeof result.finalOutput === 'string') {
			response = result.finalOutput;
		} else if (result.finalOutput) {
			response = JSON.stringify(result.finalOutput);
		} else {
			// Extract the last message_output_item text from newItems
			const lastMessage = [...result.newItems]
				.reverse()
				.find((item) => item.type === 'message_output_item');
			const raw = lastMessage?.rawItem as Record<string, unknown> | undefined;
			const content = raw?.content as Array<Record<string, unknown>> | undefined;
			const textPart = content?.find((c) => c.type === 'output_text');
			response = (textPart?.text as string) ?? 'No response generated';
		}

		const handedOffTo = result.lastAgent?.name ?? 'Triage Agent';

		ctx.logger.info('Handoff complete', { handedOffTo, responseLength: response.length });

		return {
			response,
			handedOffTo,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};
	},
});

export default agent;
