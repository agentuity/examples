/**
 * Approval Agent: Demonstrates Mastra's agent approval patterns in Agentuity.
 *
 * Mastra's agent approval enables human-in-the-loop oversight for tool calls:
 * - Agent-level approval: All tool calls require approval (requireToolApproval)
 * - Tool-level approval: Specific tools require approval (requireApproval on tool)
 * - Suspend with context: Tools provide reasons for why approval is needed
 *
 * Flow:
 * 1. User sends a request → agent determines which tool to call via LLM
 * 2. If tool requires approval → suspend execution, store pending state
 * 3. User approves or declines via API
 * 4. If approved → execute tool, return LLM response with result
 * 5. If declined → return LLM response acknowledging the decline
 *
 * @see https://mastra.ai/docs/agents/agent-tool-approval
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

import { TOOLS_REQUIRING_APPROVAL, TOOL_SUSPEND_REASONS, executeTool, toolDefinitions } from './tools';

/**
 * AI Gateway: Routes requests to OpenAI, Anthropic, and other LLM providers.
 * One SDK key, unified observability and billing; no separate API keys needed.
 */
const client = new OpenAI();

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

// ============================================================================
// Schemas
// ============================================================================

/** Stored in thread state when a tool call is suspended for approval */
export const PendingApprovalSchema = s.object({
	id: s.string().describe('Unique approval request ID'),
	toolName: s.string().describe('Name of the tool requiring approval'),
	toolCallId: s.string().describe('OpenAI tool call ID for resuming the conversation'),
	toolArgs: s.string().describe('JSON-encoded tool arguments'),
	reason: s.string().describe('Why this tool call needs approval'),
	status: s.string().describe('Current status: pending, approved, or declined'),
	requestedAt: s.string().describe('ISO timestamp when approval was requested'),
	conversationState: s.string().describe('JSON-encoded conversation messages for resumption'),
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
	handler: async (ctx, { text, model = 'gpt-5-nano', requireToolApproval = false }) => {
		ctx.logger.info('──── Approval Agent ────');
		ctx.logger.info({ textLength: text.length, model, requireToolApproval });
		ctx.logger.info('Request IDs', {
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		});

		// Build initial messages
		const messages: OpenAI.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content:
					'You are a helpful assistant with access to tools. Use the appropriate tool when the user asks you to perform an action. Available tools: get_weather (weather lookups), search_records (database search), delete_user_data (permanently delete user data), send_notification (send email/SMS).',
			},
			{ role: 'user', content: text },
		];

		// Call LLM with tool definitions
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

		// Extract the tool call (narrow to function type since we only define function tools)
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

		ctx.logger.info('Tool call requested', { toolName, toolArgs });

		// ====================================================================
		// Approval Check
		// Mirrors Mastra's dual approval model:
		// - requireToolApproval (agent-level): all tools need approval
		// - TOOLS_REQUIRING_APPROVAL (tool-level): specific tools need approval
		// ====================================================================

		const needsApproval = requireToolApproval || TOOLS_REQUIRING_APPROVAL.has(toolName);

		if (needsApproval) {
			// Suspend: store pending approval in thread state
			// This mirrors Mastra's suspend() pattern where the tool call is paused
			const approvalId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

			// Determine suspend reason (tool-level context or generic agent-level message)
			const reason =
				TOOL_SUSPEND_REASONS[toolName] ??
				`Tool "${toolName}" requires approval before execution (agent-level approval enabled).`;

			const pendingApproval: PendingApproval = {
				id: approvalId,
				toolName,
				toolCallId: toolCall.id,
				toolArgs: JSON.stringify(toolArgs),
				reason,
				status: 'pending',
				requestedAt: new Date().toISOString(),
				// Store conversation state for resumption (approve/decline)
				conversationState: JSON.stringify({
					messages,
					assistantMessage: choice.message,
				}),
				model,
			};

			await ctx.thread.state.set('pendingApproval', pendingApproval);

			ctx.logger.info('Tool call suspended for approval', { approvalId, toolName, reason });

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
		// Immediate Execution (no approval required)
		// ====================================================================

		ctx.logger.info('Executing tool immediately (no approval required)', { toolName });

		const toolResult = await executeTool(toolName, toolArgs);

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

		// Store in approval history (auto-approved)
		await ctx.thread.state.push(
			'approvalHistory',
			{
				id: `auto_${Date.now()}`,
				toolName,
				toolArgs: JSON.stringify(toolArgs),
				status: 'approved',
				requestedAt: new Date().toISOString(),
				resolvedAt: new Date().toISOString(),
				tokens: totalTokens,
			} satisfies ApprovalHistoryEntry,
			10
		);

		ctx.logger.info('Tool executed successfully', { toolName, tokens: totalTokens });

		return {
			response,
			suspended: false,
			toolExecuted: toolName,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			tokens: totalTokens,
		};
	},
});

// ============================================================================
// Approve / Decline Helpers
// ============================================================================

/**
 * Approves a pending tool call and continues the LLM conversation.
 * Mirrors Mastra's agent.approveToolCall({ runId }) / agent.approveToolCallGenerate().
 */
export async function approveToolCall(
	pending: PendingApproval,
	thread: { id: string; state: { set: (key: string, value: unknown) => Promise<void>; push: (key: string, value: unknown, limit: number) => Promise<void>; delete: (key: string) => Promise<void> } }
): Promise<AgentOutputType> {
	const { messages, assistantMessage } = JSON.parse(pending.conversationState) as {
		messages: OpenAI.ChatCompletionMessageParam[];
		assistantMessage: OpenAI.ChatCompletionMessage;
	};

	const toolArgs = JSON.parse(pending.toolArgs) as Record<string, string>;

	// Execute the tool
	const toolResult = await executeTool(pending.toolName, toolArgs);

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
 * Declines a pending tool call and lets the LLM respond accordingly.
 * Mirrors Mastra's agent.declineToolCall({ runId }) / agent.declineToolCallGenerate().
 */
export async function declineToolCall(
	pending: PendingApproval,
	thread: { id: string; state: { set: (key: string, value: unknown) => Promise<void>; push: (key: string, value: unknown, limit: number) => Promise<void>; delete: (key: string) => Promise<void> } }
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
