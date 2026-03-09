/**
 * Approval Agent: Demonstrates Mastra's agent approval patterns in Agentuity.
 *
 * Mastra's agent approval enables human-in-the-loop oversight for tool calls:
 * - Agent-level approval: All tool calls require approval (requireToolApproval in generate options)
 * - Tool-level approval: Specific tools require approval (requireApproval on createTool)
 * - Suspend with context: Tools provide reasons for why approval is needed
 *
 * Flow:
 * 1. User sends a request → Mastra Agent determines which tool to call via LLM
 * 2. If tool requires approval → finishReason === 'suspended', store runId in thread state
 * 3. User approves or declines via API
 * 4. If approved → agent.approveToolCallGenerate({ runId }), return LLM response
 * 5. If declined → agent.declineToolCallGenerate({ runId }), return LLM response
 *
 * @see https://mastra.ai/docs/agents/agent-tool-approval
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { LibSQLStore } from '@mastra/libsql';

import '../../lib/gateway';

import {
	getWeatherTool,
	searchRecordsTool,
	deleteUserDataTool,
	sendNotificationTool,
	TOOL_SUSPEND_REASONS,
} from './tools';

// ============================================================================
// Mastra Agent
// ============================================================================

const approvalMastraAgent = new Agent({
	id: 'approval-agent',
	name: 'Approval Agent',
	instructions:
		'You are a helpful assistant with access to tools. Use the appropriate tool when the user asks you to perform an action. Available tools: get-weather (weather lookups), search-records (database search), delete-user-data (permanently delete user data), send-notification (send email/SMS).',
	model: 'openai/gpt-4o-mini',
	tools: {
		'get-weather': getWeatherTool,
		'search-records': searchRecordsTool,
		'delete-user-data': deleteUserDataTool,
		'send-notification': sendNotificationTool,
	},
});

// Mastra instance with storage is required for approve/decline to persist workflow snapshots.
// Without this, approveToolCallGenerate() / declineToolCallGenerate() fail with "No snapshot found".
const mastra = new Mastra({
	agents: { 'approval-agent': approvalMastraAgent },
	storage: new LibSQLStore({ id: 'approval-agent-store', url: 'file:mastra.db' }),
});

const approvalAgent = mastra.getAgent('approval-agent');

// ============================================================================
// Schemas
// ============================================================================

/** Stored in thread state when a tool call is suspended for approval */
export const PendingApprovalSchema = s.object({
	id: s.string().describe('Unique approval request ID'),
	toolName: s.string().describe('Name of the tool requiring approval'),
	toolCallId: s.string().describe('Mastra tool call ID for resuming the run'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	reason: s.string().describe('Why this tool call needs approval'),
	status: s.string().describe('Current status: pending, approved, or declined'),
	requestedAt: s.string().describe('ISO timestamp when approval was requested'),
	runId: s.string().describe('Mastra run ID for resuming the suspended agent'),
	model: s.string().describe('Model used for the original request'),
});

export type PendingApproval = s.infer<typeof PendingApprovalSchema>;

/** Stored in thread state history after approval/decline */
export const ApprovalHistoryEntrySchema = s.object({
	id: s.string().describe('Approval ID'),
	toolName: s.string().describe('Tool that was approved or declined'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	status: s.string().describe('Final status: approved or declined'),
	requestedAt: s.string().describe('When the approval was requested'),
	resolvedAt: s.string().describe('When the approval was resolved'),
	tokens: s.number().describe('Total tokens used for this request'),
});

export type ApprovalHistoryEntry = s.infer<typeof ApprovalHistoryEntrySchema>;

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

export const AgentInput = s.object({
	text: s.string().describe('The user request to process'),
	model: s.enum(MODELS).optional().describe('AI model to use'),
	requireToolApproval: s.boolean().optional().describe('Require approval for ALL tool calls (agent-level approval)'),
});

export type AgentInputType = s.infer<typeof AgentInput>;

export const AgentOutput = s.object({
	response: s.string().describe('Agent response text'),
	suspended: s.boolean().describe('Whether the agent is waiting for tool approval'),
	pendingApproval: PendingApprovalSchema.optional().describe('Pending approval details (when suspended)'),
	toolExecuted: s.string().optional().describe('Name of tool that was executed'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	sessionId: s.string().describe('Current session identifier'),
	tokens: s.number().describe('Tokens used'),
});

export type AgentOutputType = s.infer<typeof AgentOutput>;

// ============================================================================
// Agent Implementation
// ============================================================================

const agent = createAgent('approval', {
	description: 'Processes requests with tool call approval for sensitive operations',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { text, model: _model = 'gpt-5-nano', requireToolApproval = false }) => {
		ctx.logger.info('──── Approval Agent ────');
		ctx.logger.info({ textLength: text.length, requireToolApproval });
		ctx.logger.info('Request IDs', {
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		});

		// Call the Mastra Agent with requireToolApproval flag
		// When requireToolApproval is true, ALL tool calls are suspended for approval.
		// Tools with requireApproval: true are always suspended regardless of this flag.
		const result = await approvalAgent.generate(text, {
			requireToolApproval,
		});

		const tokens = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);

		// ====================================================================
		// Check if the agent was suspended for tool approval
		// finishReason === 'suspended' means a tool call needs human approval
		// ====================================================================
		if (result.finishReason === 'suspended' && result.suspendPayload && result.runId) {
			const suspendPayload = result.suspendPayload as {
				toolCallId?: string;
				toolName?: string;
				args?: Record<string, unknown>;
			};

			const toolName = suspendPayload.toolName ?? 'unknown';
			const toolCallId = suspendPayload.toolCallId ?? '';
			const toolArgs = suspendPayload.args ?? {};

			ctx.logger.info('Tool call suspended for approval', {
				toolName,
				toolCallId,
				runId: result.runId,
			});

			// Tool-level reason from our map, or generic message for agent-level approval
			const reason =
				TOOL_SUSPEND_REASONS[toolName] ??
				`Tool "${toolName}" requires approval before execution (agent-level approval enabled).`;

			const approvalId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

			const pendingApproval: PendingApproval = {
				id: approvalId,
				toolName,
				toolCallId,
				toolArgs: JSON.stringify(toolArgs),
				reason,
				status: 'pending',
				requestedAt: new Date().toISOString(),
				runId: result.runId,
				model: 'gpt-4o-mini',
			};

			await ctx.thread.state.set('pendingApproval', pendingApproval);

			ctx.logger.info('Approval state stored', { approvalId, toolName, runId: result.runId });

			return {
				response: `Tool "${toolName}" requires approval. ${reason}`,
				suspended: true,
				pendingApproval,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
			};
		}

		// ====================================================================
		// No suspension — tool executed immediately or no tool needed
		// ====================================================================
		const response = result.text ?? 'I could not process that request.';

		// Determine if a tool was executed by checking toolResults
		// ToolResultChunk has shape: { type: 'tool-result', payload: { toolName, args, result, ... } }
		const firstToolResult = result.toolResults?.[0];
		const firstToolPayload = firstToolResult?.payload as
			| { toolName?: string; args?: Record<string, unknown> }
			| undefined;
		const toolExecuted = firstToolPayload?.toolName ?? undefined;

		if (toolExecuted) {
			ctx.logger.info('Tool executed immediately (no approval required)', { toolExecuted });

			// Store in approval history (auto-approved)
			await ctx.thread.state.push(
				'approvalHistory',
				{
					id: `auto_${Date.now()}`,
					toolName: toolExecuted,
					toolArgs: JSON.stringify(firstToolPayload?.args ?? {}),
					status: 'approved',
					requestedAt: new Date().toISOString(),
					resolvedAt: new Date().toISOString(),
					tokens,
				} satisfies ApprovalHistoryEntry,
				10
			);
		} else {
			ctx.logger.info('No tool call requested, returning text response');
		}

		ctx.logger.info('Agent response complete', { tokens });

		return {
			response,
			suspended: false,
			toolExecuted,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			tokens,
		};
	},
});

// ============================================================================
// Approve / Decline Helpers
// ============================================================================

/**
 * Approves a pending tool call and continues the Mastra agent's execution.
 * Uses agent.approveToolCallGenerate() — mirrors Mastra's approveToolCall pattern.
 */
export async function approveToolCall(
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
	// Resume the Mastra agent using the stored runId
	const result = await approvalAgent.approveToolCallGenerate({
		runId: pending.runId,
		toolCallId: pending.toolCallId || undefined,
	});

	const tokens = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);
	const response = result.text ?? '';

	// Move to history
	await thread.state.push(
		'approvalHistory',
		{
			id: pending.id,
			toolName: pending.toolName,
			toolArgs: pending.toolArgs,
			status: 'approved',
			requestedAt: pending.requestedAt,
			resolvedAt: new Date().toISOString(),
			tokens,
		} satisfies ApprovalHistoryEntry,
		10
	);

	// Clear pending
	await thread.state.delete('pendingApproval');

	return {
		response,
		suspended: false,
		toolExecuted: pending.toolName,
		threadId: thread.id,
		sessionId: '',
		tokens,
	};
}

/**
 * Declines a pending tool call and lets the Mastra agent respond accordingly.
 * Uses agent.declineToolCallGenerate() — mirrors Mastra's declineToolCall pattern.
 */
export async function declineToolCall(
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
	// Resume the Mastra agent with a decline — it responds acknowledging the tool was not executed
	const result = await approvalAgent.declineToolCallGenerate({
		runId: pending.runId,
		toolCallId: pending.toolCallId || undefined,
	});

	const tokens = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);
	const response = result.text ?? '';

	// Move to history
	await thread.state.push(
		'approvalHistory',
		{
			id: pending.id,
			toolName: pending.toolName,
			toolArgs: pending.toolArgs,
			status: 'declined',
			requestedAt: pending.requestedAt,
			resolvedAt: new Date().toISOString(),
			tokens,
		} satisfies ApprovalHistoryEntry,
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

export default agent;
