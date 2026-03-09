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
 * - Research sub-agent: search-web, lookup-info (no approval)
 * - Operations sub-agent: delete-records, send-notification (approval required)
 * - Confirmation sub-agent: request-confirmation (suspend/resume pattern)
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
import { Agent } from '@mastra/core/agent';

// Bridge Agentuity AI Gateway → Mastra's model resolution
if (!process.env.OPENAI_API_KEY && process.env.AGENTUITY_SDK_KEY) {
	const gw = process.env.AGENTUITY_AIGATEWAY_URL || process.env.AGENTUITY_TRANSPORT_URL || 'https://agentuity.ai';
	process.env.OPENAI_API_KEY = process.env.AGENTUITY_SDK_KEY;
	process.env.OPENAI_BASE_URL = `${gw}/gateway/openai`;
}
import type { CoreMessageV4 } from '@mastra/core/agent/message-list';

import {
	TOOLS_REQUIRING_APPROVAL,
	TOOLS_WITH_SUSPEND,
	TOOL_SUB_AGENTS,
	TOOL_SUSPEND_REASONS,
	executeTool,
	executeConfirmationWithResumeData,
	getSuspendPayload,
	searchWebTool,
	lookupInfoTool,
	deleteRecordsTool,
	sendNotificationTool,
	requestConfirmationTool,
} from './tools';

// System instruction string stored separately so it can be used when building
// conversation history messages without needing to call getInstructions() async.
const NETWORK_INSTRUCTIONS = `You are a routing agent coordinating a network of specialized sub-agents. Route requests to the appropriate tool:

Research sub-agent tools: search-web (web search), lookup-info (entity lookup)
Operations sub-agent tools: delete-records (data deletion), send-notification (email/SMS)
Confirmation sub-agent tools: request-confirmation (when user needs to confirm or choose)

Use the appropriate tool based on the user's request. For dangerous or irreversible actions, prefer using request-confirmation first to verify intent.`;

// ============================================================================
// Mastra Network Routing Agent
// ============================================================================

const networkMastraAgent = new Agent({
	id: 'network-routing-agent',
	name: 'Network Routing Agent',
	instructions: NETWORK_INSTRUCTIONS,
	model: 'openai/gpt-4o-mini',
	tools: {
		'search-web': searchWebTool,
		'lookup-info': lookupInfoTool,
		'delete-records': deleteRecordsTool,
		'send-notification': sendNotificationTool,
		'request-confirmation': requestConfirmationTool,
	},
});

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

// ============================================================================
// Schemas
// ============================================================================

/** Stored in thread state when a network tool call is suspended for approval */
export const PendingApprovalSchema = s.object({
	id: s.string().describe('Unique approval request ID'),
	toolName: s.string().describe('Name of the tool requiring approval'),
	toolCallId: s.string().describe('Tool call ID for resuming the conversation'),
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
	toolCallId: s.string().describe('Tool call ID for resuming the conversation'),
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
	handler: async (ctx, { text, requireToolApproval = false }) => {
		ctx.logger.info('──── Network Agent ────');
		ctx.logger.info({ textLength: text.length, requireToolApproval });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		// Build the user message for the Mastra agent
		const userMessages: CoreMessageV4[] = [
			{ role: 'user', content: text },
		];

		// Call the Mastra routing agent with maxSteps: 1 so we receive the LLM's
		// tool call decision without auto-executing tools. This lets us intercept
		// the call for approval or suspend/resume handling before execution.
		const result = await networkMastraAgent.generate(userMessages, { maxSteps: 1 });

		const tokens = result.usage?.totalTokens ?? 0;

		// If no tool was called, return the text response
		if (!result.toolCalls || result.toolCalls.length === 0) {
			ctx.logger.info('No tool call requested, returning text response');

			return {
				response: result.text || 'I could not process that request.',
				suspended: false,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		// Extract the first tool call from the Mastra result
		const toolCallChunk = result.toolCalls[0]!;
		const toolName = toolCallChunk.payload.toolName;
		const toolArgs = (toolCallChunk.payload.args ?? {}) as Record<string, unknown>;
		const toolCallId = toolCallChunk.payload.toolCallId;
		const subAgent = TOOL_SUB_AGENTS[toolName] ?? 'unknown';

		ctx.logger.info('Tool call requested', { toolName, toolArgs, subAgent });

		// Build the conversation state that captures what the LLM decided.
		// This is stored for approval/suspend resumption and includes system context.
		const conversationMessages: CoreMessageV4[] = [
			{ role: 'system', content: NETWORK_INSTRUCTIONS },
			...userMessages,
			{
				role: 'assistant',
				content: [
					{
						type: 'tool-call',
						toolCallId,
						toolName,
						args: toolArgs,
					},
				],
			},
		];

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
				toolCallId,
				toolArgs: JSON.stringify(toolArgs),
				subAgent,
				suspendPayload: JSON.stringify(suspendPayload),
				status: 'suspended',
				suspendedAt: new Date().toISOString(),
				conversationState: JSON.stringify(conversationMessages),
				model: 'openai/gpt-4o-mini',
			};

			await ctx.thread.state.set('suspendedExecution', suspended);

			ctx.logger.info('Network suspended for user input', { suspendId, toolName, subAgent, suspendPayload });

			return {
				response: suspendPayload['message'] ?? `Tool "${toolName}" is waiting for input.`,
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
				toolCallId,
				toolArgs: JSON.stringify(toolArgs),
				subAgent,
				reason,
				status: 'pending',
				requestedAt: new Date().toISOString(),
				conversationState: JSON.stringify(conversationMessages),
				model: 'openai/gpt-4o-mini',
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

		const toolResult = await executeTool(toolName, toolArgs);

		// Build follow-up messages: conversation history + tool result
		const followUpMessages: CoreMessageV4[] = [
			...conversationMessages,
			{
				role: 'tool',
				content: [
					{
						type: 'tool-result',
						toolCallId,
						toolName,
						result: toolResult.data,
					},
				],
			},
		];

		const followUpResult = await networkMastraAgent.generate(followUpMessages);

		const totalTokens = tokens + (followUpResult.usage?.totalTokens ?? 0);
		const response = followUpResult.text ?? '';

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
	const conversationMessages = JSON.parse(pending.conversationState) as CoreMessageV4[];
	const toolArgs = JSON.parse(pending.toolArgs) as Record<string, unknown>;

	// Execute the tool
	const toolResult = await executeTool(pending.toolName, toolArgs);

	// Build follow-up messages: stored conversation + tool result
	const followUpMessages: CoreMessageV4[] = [
		...conversationMessages,
		{
			role: 'tool',
			content: [
				{
					type: 'tool-result',
					toolCallId: pending.toolCallId,
					toolName: pending.toolName,
					result: toolResult.data,
				},
			],
		},
	];

	const followUpResult = await networkMastraAgent.generate(followUpMessages);

	const tokens = followUpResult.usage?.totalTokens ?? 0;
	const response = followUpResult.text ?? '';

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
	const conversationMessages = JSON.parse(pending.conversationState) as CoreMessageV4[];

	// Provide a tool result indicating the call was declined
	const followUpMessages: CoreMessageV4[] = [
		...conversationMessages,
		{
			role: 'tool',
			content: [
				{
					type: 'tool-result',
					toolCallId: pending.toolCallId,
					toolName: pending.toolName,
					result: {
						error: 'Tool call was declined by user.',
						declined: true,
					},
				},
			],
		},
	];

	const followUpResult = await networkMastraAgent.generate(followUpMessages);

	const tokens = followUpResult.usage?.totalTokens ?? 0;
	const response = followUpResult.text ?? '';

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
	const conversationMessages = JSON.parse(suspended.conversationState) as CoreMessageV4[];
	const toolArgs = JSON.parse(suspended.toolArgs) as Record<string, unknown>;

	// Execute the tool with resume data
	const toolResult = TOOLS_WITH_SUSPEND.has(suspended.toolName)
		? executeConfirmationWithResumeData(toolArgs, resumeData)
		: await executeTool(suspended.toolName, toolArgs);

	// Build follow-up messages: stored conversation + tool result
	const followUpMessages: CoreMessageV4[] = [
		...conversationMessages,
		{
			role: 'tool',
			content: [
				{
					type: 'tool-result',
					toolCallId: suspended.toolCallId,
					toolName: suspended.toolName,
					result: toolResult.data,
				},
			],
		},
	];

	const followUpResult = await networkMastraAgent.generate(followUpMessages);

	const tokens = followUpResult.usage?.totalTokens ?? 0;
	const response = followUpResult.text ?? '';

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
