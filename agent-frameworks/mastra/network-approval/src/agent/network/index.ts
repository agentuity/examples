/**
 * Network Agent: Demonstrates Mastra's network approval patterns in Agentuity.
 *
 * Mastra's network approval extends agent approval to multi-agent networks:
 * - Approving network tool calls: Tools within sub-agents require approval
 * - Declining network tool calls: Decline prevents execution, network continues
 * - Suspending/resuming networks: Tools call suspend() with context, user provides resume data
 * - Automatic resumption: Network auto-resumes suspended tools on next user message
 *
 * This agent acts as a routing agent coordinating multiple conceptual sub-agents:
 * - Research sub-agent: search_web, lookup_info (no approval)
 * - Operations sub-agent: delete_records, send_notification (approval required)
 * - Confirmation sub-agent: request_confirmation (suspend/resume pattern)
 *
 * Flow variations:
 * 1. Safe tools -> immediate execution -> return result
 * 2. Approval-required tools -> suspend -> approve/decline -> execute or skip
 * 3. Suspend tools -> suspend with payload -> resume with user data -> execute
 *
 * @see https://mastra.ai/docs/agents/networks
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

import {
	TOOLS_REQUIRING_APPROVAL,
	TOOLS_WITH_SUSPEND,
	TOOL_SUB_AGENTS,
	TOOL_SUSPEND_REASONS,
	executeConfirmationTool,
	executeTool,
	getSuspendPayload,
	toolDefinitions,
} from './tools';

/**
 * AI Gateway: Routes requests to OpenAI, Anthropic, and other LLM providers.
 * One SDK key, unified observability and billing; no separate API keys needed.
 */
const client = new OpenAI();

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

// ============================================================================
// Schemas
// ============================================================================

/** Stored in thread state when a network tool call is suspended for approval */
export const PendingApprovalSchema = s.object({
	id: s.string().describe('Unique approval request ID'),
	toolName: s.string().describe('Name of the tool requiring approval'),
	toolCallId: s.string().describe('OpenAI tool call ID for resuming the conversation'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	subAgent: s.string().describe('Conceptual sub-agent this tool belongs to'),
	reason: s.string().describe('Why this tool call needs approval'),
	status: s.string().describe('Current status: pending, approved, or declined'),
	requestedAt: s.string().describe('ISO timestamp when approval was requested'),
	conversationState: s.string().describe('JSON-encoded conversation messages for resumption'),
	model: s.string().describe('Model used for the original request'),
});

export type PendingApproval = s.infer<typeof PendingApprovalSchema>;

/** Stored in thread state when a network primitive calls suspend() */
export const SuspendedExecutionSchema = s.object({
	id: s.string().describe('Unique suspension ID'),
	toolName: s.string().describe('Name of the suspended tool'),
	toolCallId: s.string().describe('OpenAI tool call ID for resuming the conversation'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	subAgent: s.string().describe('Conceptual sub-agent this tool belongs to'),
	suspendPayload: s.string().describe('JSON-encoded context from the suspended tool (message, action, options)'),
	status: s.string().describe('Current status: suspended or resumed'),
	suspendedAt: s.string().describe('ISO timestamp when execution was suspended'),
	conversationState: s.string().describe('JSON-encoded conversation messages for resumption'),
	model: s.string().describe('Model used for the original request'),
});

export type SuspendedExecution = s.infer<typeof SuspendedExecutionSchema>;

/** History entry for network operations */
export const NetworkHistoryEntrySchema = s.object({
	id: s.string().describe('Operation ID'),
	toolName: s.string().describe('Tool that was used'),
	subAgent: s.string().describe('Sub-agent the tool belongs to'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	type: s.string().describe('Operation type: immediate, approved, declined, or resumed'),
	requestedAt: s.string().describe('When the operation was requested'),
	resolvedAt: s.string().describe('When the operation was resolved'),
	tokens: s.number().describe('Total tokens used'),
});

export type NetworkHistoryEntry = s.infer<typeof NetworkHistoryEntrySchema>;

export const AgentInput = s.object({
	text: s.string().describe('The user request to process'),
	model: s.enum(MODELS).optional().describe('AI model to use'),
	requireToolApproval: s
		.boolean()
		.optional()
		.describe('Require approval for ALL tool calls (agent-level approval, mirrors Mastra requireToolApproval)'),
});

export type AgentInputType = s.infer<typeof AgentInput>;

export const AgentOutput = s.object({
	response: s.string().describe('Agent response text'),
	suspended: s.boolean().describe('Whether the network is waiting for user action'),
	suspendType: s.string().optional().describe('Type of suspension: approval or suspend'),
	pendingApproval: PendingApprovalSchema.optional().describe('Pending approval details (when suspendType is approval)'),
	suspendedExecution: SuspendedExecutionSchema.optional().describe('Suspended execution details (when suspendType is suspend)'),
	toolExecuted: s.string().optional().describe('Name of tool that was executed'),
	subAgent: s.string().optional().describe('Sub-agent that handled the request'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	sessionId: s.string().describe('Current session identifier'),
	tokens: s.number().describe('Tokens used'),
});

export type AgentOutputType = s.infer<typeof AgentOutput>;

// ============================================================================
// Agent Implementation
// ============================================================================

const agent = createAgent('network', {
	description: 'Routes requests through a network of sub-agents with approval and suspend/resume support',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { text, model = 'gpt-5-nano', requireToolApproval = false }) => {
		ctx.logger.info('──── Network Agent ────');
		ctx.logger.info({ textLength: text.length, model, requireToolApproval });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		// Build initial messages with network routing instructions
		const messages: OpenAI.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `You are a routing agent coordinating a network of specialized sub-agents. Route requests to the appropriate tool:

Research sub-agent tools: search_web (web search), lookup_info (entity lookup)
Operations sub-agent tools: delete_records (data deletion), send_notification (email/SMS)
Confirmation sub-agent tools: request_confirmation (when user needs to confirm or choose)

Use the appropriate tool based on the user's request. For dangerous or irreversible actions, prefer using request_confirmation first to verify intent.`,
			},
			{ role: 'user', content: text },
		];

		// Call LLM with all network tool definitions
		const completion = await client.chat.completions.create({
			model,
			messages,
			tools: toolDefinitions,
		});

		const choice = completion.choices[0];
		const tokens = completion.usage?.total_tokens ?? 0;

		// If the LLM didn't request a tool call, return the text response
		if (choice?.finish_reason !== 'tool_calls' || !choice.message.tool_calls?.length) {
			ctx.logger.info('No tool call requested, returning text response');

			return {
				response: choice?.message?.content ?? 'I could not process that request.',
				suspended: false,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		// Extract the tool call
		const toolCall = choice.message.tool_calls[0]!;
		if (toolCall.type !== 'function') {
			return {
				response: 'Unexpected tool call type.',
				suspended: false,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		const toolName = toolCall.function.name;
		const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;
		const subAgent = TOOL_SUB_AGENTS[toolName] ?? 'unknown';

		ctx.logger.info('Tool call requested', { toolName, toolArgs, subAgent });

		// ================================================================
		// Check 1: Suspend/Resume Pattern
		// Mirrors Mastra's suspend() in network primitives.
		// The tool suspends with a payload (message, action, options)
		// and waits for the user to provide resume data.
		// ================================================================

		if (TOOLS_WITH_SUSPEND.has(toolName)) {
			const suspendId = `suspend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const suspendPayload = getSuspendPayload(toolName, toolArgs);

			const suspended: SuspendedExecution = {
				id: suspendId,
				toolName,
				toolCallId: toolCall.id,
				toolArgs: JSON.stringify(toolArgs),
				subAgent,
				suspendPayload: JSON.stringify(suspendPayload),
				status: 'suspended',
				suspendedAt: new Date().toISOString(),
				conversationState: JSON.stringify({
					messages,
					assistantMessage: choice.message,
				}),
				model,
			};

			await ctx.thread.state.set('suspendedExecution', suspended);

			ctx.logger.info('Network suspended for user input', { suspendId, toolName, subAgent, suspendPayload });

			return {
				response: suspendPayload.message ?? `Tool "${toolName}" is waiting for input.`,
				suspended: true,
				suspendType: 'suspend',
				suspendedExecution: suspended,
				subAgent,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		// ================================================================
		// Check 2: Approval Pattern
		// Mirrors Mastra's requireApproval / requireToolApproval.
		// Either agent-level (all tools) or tool-level (specific tools).
		// ================================================================

		const needsApproval = requireToolApproval || TOOLS_REQUIRING_APPROVAL.has(toolName);

		if (needsApproval) {
			const approvalId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

			const reason =
				TOOL_SUSPEND_REASONS[toolName] ??
				`Tool "${toolName}" requires approval before execution (agent-level approval enabled).`;

			const pendingApproval: PendingApproval = {
				id: approvalId,
				toolName,
				toolCallId: toolCall.id,
				toolArgs: JSON.stringify(toolArgs),
				subAgent,
				reason,
				status: 'pending',
				requestedAt: new Date().toISOString(),
				conversationState: JSON.stringify({
					messages,
					assistantMessage: choice.message,
				}),
				model,
			};

			await ctx.thread.state.set('pendingApproval', pendingApproval);

			ctx.logger.info('Network suspended for approval', { approvalId, toolName, subAgent, reason });

			return {
				response: `Tool "${toolName}" (${subAgent} sub-agent) requires approval. ${reason}`,
				suspended: true,
				suspendType: 'approval',
				pendingApproval,
				subAgent,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		// ================================================================
		// Immediate Execution (no approval or suspend required)
		// ================================================================

		ctx.logger.info('Executing tool immediately', { toolName, subAgent });

		const toolResult = await executeTool(toolName, toolArgs, model);

		// Continue conversation with tool result
		const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
			...messages,
			choice.message,
			{
				role: 'tool',
				tool_call_id: toolCall.id,
				content: JSON.stringify(toolResult.data),
			},
		];

		const followUp = await client.chat.completions.create({
			model,
			messages: followUpMessages,
		});

		const totalTokens = tokens + (followUp.usage?.total_tokens ?? 0);
		const response = followUp.choices[0]?.message?.content ?? '';

		// Store in history
		await ctx.thread.state.push(
			'networkHistory',
			{
				id: `auto_${Date.now()}`,
				toolName,
				subAgent,
				toolArgs: JSON.stringify(toolArgs),
				type: 'immediate',
				requestedAt: new Date().toISOString(),
				resolvedAt: new Date().toISOString(),
				tokens: totalTokens,
			} satisfies NetworkHistoryEntry,
			10
		);

		ctx.logger.info('Tool executed successfully', { toolName, subAgent, tokens: totalTokens });

		return {
			response,
			suspended: false,
			toolExecuted: toolName,
			subAgent,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			tokens: totalTokens,
		};
	},
});

// ============================================================================
// Network Approval Functions
// ============================================================================

/**
 * Approves a pending tool call and continues the network.
 * Mirrors Mastra's routingAgent.approveNetworkToolCall({ runId, memory }).
 */
export async function approveNetworkToolCall(
	pending: PendingApproval,
	thread: {
		id: string;
		state: {
			set: (key: string, value: unknown) => Promise<void>;
			push: (key: string, value: unknown, limit: number) => Promise<void>;
			delete: (key: string) => Promise<void>;
		};
	}
): Promise<AgentOutputType> {
	const { messages, assistantMessage } = JSON.parse(pending.conversationState) as {
		messages: OpenAI.ChatCompletionMessageParam[];
		assistantMessage: OpenAI.ChatCompletionMessage;
	};

	const toolArgs = JSON.parse(pending.toolArgs) as Record<string, string>;

	// Execute the tool
	const toolResult = await executeTool(pending.toolName, toolArgs, pending.model);

	// Continue conversation with tool result
	const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
		...messages,
		assistantMessage,
		{
			role: 'tool',
			tool_call_id: pending.toolCallId,
			content: JSON.stringify(toolResult.data),
		},
	];

	const followUp = await client.chat.completions.create({
		model: pending.model,
		messages: followUpMessages,
	});

	const tokens = followUp.usage?.total_tokens ?? 0;
	const response = followUp.choices[0]?.message?.content ?? '';

	// Move to history
	await thread.state.push(
		'networkHistory',
		{
			id: pending.id,
			toolName: pending.toolName,
			subAgent: pending.subAgent,
			toolArgs: pending.toolArgs,
			type: 'approved',
			requestedAt: pending.requestedAt,
			resolvedAt: new Date().toISOString(),
			tokens,
		} satisfies NetworkHistoryEntry,
		10
	);

	// Clear pending
	await thread.state.delete('pendingApproval');

	return {
		response,
		suspended: false,
		toolExecuted: pending.toolName,
		subAgent: pending.subAgent,
		threadId: thread.id,
		sessionId: '',
		tokens,
	};
}

/**
 * Declines a pending tool call in the network.
 * Mirrors Mastra's routingAgent.declineNetworkToolCall({ runId, memory }).
 * The network continues without executing the tool.
 */
export async function declineNetworkToolCall(
	pending: PendingApproval,
	thread: {
		id: string;
		state: {
			set: (key: string, value: unknown) => Promise<void>;
			push: (key: string, value: unknown, limit: number) => Promise<void>;
			delete: (key: string) => Promise<void>;
		};
	}
): Promise<AgentOutputType> {
	const { messages, assistantMessage } = JSON.parse(pending.conversationState) as {
		messages: OpenAI.ChatCompletionMessageParam[];
		assistantMessage: OpenAI.ChatCompletionMessage;
	};

	// Provide a tool result indicating the call was declined
	const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
		...messages,
		assistantMessage,
		{
			role: 'tool',
			tool_call_id: pending.toolCallId,
			content: JSON.stringify({
				error: 'Tool call was declined by user.',
				declined: true,
			}),
		},
	];

	const followUp = await client.chat.completions.create({
		model: pending.model,
		messages: followUpMessages,
	});

	const tokens = followUp.usage?.total_tokens ?? 0;
	const response = followUp.choices[0]?.message?.content ?? '';

	// Move to history
	await thread.state.push(
		'networkHistory',
		{
			id: pending.id,
			toolName: pending.toolName,
			subAgent: pending.subAgent,
			toolArgs: pending.toolArgs,
			type: 'declined',
			requestedAt: pending.requestedAt,
			resolvedAt: new Date().toISOString(),
			tokens,
		} satisfies NetworkHistoryEntry,
		10
	);

	// Clear pending
	await thread.state.delete('pendingApproval');

	return {
		response,
		suspended: false,
		threadId: thread.id,
		sessionId: '',
		tokens,
	};
}

/**
 * Resumes a suspended network with user-provided data.
 * Mirrors Mastra's routingAgent.resumeNetwork(resumeData, { runId, memory }).
 *
 * When a tool calls suspend() with a payload (e.g. confirmation options),
 * the network pauses. This function resumes execution with the user's response.
 */
export async function resumeNetwork(
	suspended: SuspendedExecution,
	resumeData: Record<string, unknown>,
	thread: {
		id: string;
		state: {
			set: (key: string, value: unknown) => Promise<void>;
			push: (key: string, value: unknown, limit: number) => Promise<void>;
			delete: (key: string) => Promise<void>;
		};
	}
): Promise<AgentOutputType> {
	const { messages, assistantMessage } = JSON.parse(suspended.conversationState) as {
		messages: OpenAI.ChatCompletionMessageParam[];
		assistantMessage: OpenAI.ChatCompletionMessage;
	};

	const toolArgs = JSON.parse(suspended.toolArgs) as Record<string, string>;

	// Execute the tool with resume data
	const toolResult = TOOLS_WITH_SUSPEND.has(suspended.toolName)
		? executeConfirmationTool(toolArgs, resumeData)
		: await executeTool(suspended.toolName, toolArgs, suspended.model);

	// Continue conversation with tool result
	const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
		...messages,
		assistantMessage,
		{
			role: 'tool',
			tool_call_id: suspended.toolCallId,
			content: JSON.stringify(toolResult.data),
		},
	];

	const followUp = await client.chat.completions.create({
		model: suspended.model,
		messages: followUpMessages,
	});

	const tokens = followUp.usage?.total_tokens ?? 0;
	const response = followUp.choices[0]?.message?.content ?? '';

	// Move to history
	await thread.state.push(
		'networkHistory',
		{
			id: suspended.id,
			toolName: suspended.toolName,
			subAgent: suspended.subAgent,
			toolArgs: suspended.toolArgs,
			type: 'resumed',
			requestedAt: suspended.suspendedAt,
			resolvedAt: new Date().toISOString(),
			tokens,
		} satisfies NetworkHistoryEntry,
		10
	);

	// Clear suspended state
	await thread.state.delete('suspendedExecution');

	return {
		response,
		suspended: false,
		toolExecuted: suspended.toolName,
		subAgent: suspended.subAgent,
		threadId: thread.id,
		sessionId: '',
		tokens,
	};
}

export default agent;
