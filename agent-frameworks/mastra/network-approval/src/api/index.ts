/**
 * API routes for the network agent.
 * Routes handle state operations (get/clear history, approve/decline/resume);
 * the agent handles core logic.
 */

import { createRouter, validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import network, {
	AgentOutput as NetworkOutput,
	NetworkHistoryEntrySchema,
	PendingApprovalSchema,
	SuspendedExecutionSchema,
	approveNetworkToolCall,
	declineNetworkToolCall,
	resumeNetwork,
	type NetworkHistoryEntry,
	type PendingApproval,
	type SuspendedExecution,
} from '../agent/network';

const api = createRouter();

// ============================================================================
// Network Agent Routes
// ============================================================================

// Send a request to the network (may suspend for approval or user input)
api.post('/network', network.validator(), async (c) => {
	const data = c.req.valid('json');

	return c.json(await network.run(data));
});

// ── Pending Approval ────────────────────────────────────────────────────────

export const PendingApprovalOutputSchema = s.object({
	pendingApproval: PendingApprovalSchema.optional(),
	threadId: s.string(),
	hasPending: s.boolean(),
});

// Get the current pending approval for this thread
api.get('/network/pending', validator({ output: PendingApprovalOutputSchema }), async (c) => {
	const pending = await c.var.thread.state.get<PendingApproval>('pendingApproval');

	return c.json({
		pendingApproval: pending ?? undefined,
		threadId: c.var.thread.id,
		hasPending: pending !== null && pending !== undefined,
	});
});

// ── Suspended Execution ─────────────────────────────────────────────────────

export const SuspendedExecutionOutputSchema = s.object({
	suspendedExecution: SuspendedExecutionSchema.optional(),
	threadId: s.string(),
	hasSuspended: s.boolean(),
});

// Get the current suspended execution for this thread
api.get('/network/suspended', validator({ output: SuspendedExecutionOutputSchema }), async (c) => {
	const suspended = await c.var.thread.state.get<SuspendedExecution>('suspendedExecution');

	return c.json({
		suspendedExecution: suspended ?? undefined,
		threadId: c.var.thread.id,
		hasSuspended: suspended !== null && suspended !== undefined,
	});
});

// ── Approve / Decline / Resume ──────────────────────────────────────────────

/**
 * Approve a pending tool call in the network.
 * Mirrors Mastra's routingAgent.approveNetworkToolCall({ runId, memory }).
 * Executes the suspended tool and returns the LLM response with the result.
 */
api.post('/network/approve', validator({ output: NetworkOutput }), async (c) => {
	const pending = await c.var.thread.state.get<PendingApproval>('pendingApproval');

	if (!pending) {
		return c.json(
			{
				response: 'No pending approval found.',
				suspended: false,
				threadId: c.var.thread.id,
				sessionId: '',
				tokens: 0,
			},
			404
		);
	}

	c.var.logger.info('Approving network tool call', {
		approvalId: pending.id,
		toolName: pending.toolName,
		subAgent: pending.subAgent,
	});

	const result = await approveNetworkToolCall(pending, c.var.thread);

	return c.json(result);
});

/**
 * Decline a pending tool call in the network.
 * Mirrors Mastra's routingAgent.declineNetworkToolCall({ runId, memory }).
 * The network continues without executing the tool.
 */
api.post('/network/decline', validator({ output: NetworkOutput }), async (c) => {
	const pending = await c.var.thread.state.get<PendingApproval>('pendingApproval');

	if (!pending) {
		return c.json(
			{
				response: 'No pending approval found.',
				suspended: false,
				threadId: c.var.thread.id,
				sessionId: '',
				tokens: 0,
			},
			404
		);
	}

	c.var.logger.info('Declining network tool call', {
		approvalId: pending.id,
		toolName: pending.toolName,
		subAgent: pending.subAgent,
	});

	const result = await declineNetworkToolCall(pending, c.var.thread);

	return c.json(result);
});

/**
 * Resume a suspended network with user-provided data.
 * Mirrors Mastra's routingAgent.resumeNetwork(resumeData, { runId, memory }).
 *
 * When a tool calls suspend() with a payload (e.g. confirmation options),
 * this endpoint accepts the user's response and resumes network execution.
 */
export const ResumeInputSchema = s.object({
	confirmed: s.boolean().optional().describe('Whether the user confirmed the action'),
	choice: s.string().optional().describe('User choice from the provided options'),
});

api.post('/network/resume', validator({ input: ResumeInputSchema, output: NetworkOutput }), async (c) => {
	const suspended = await c.var.thread.state.get<SuspendedExecution>('suspendedExecution');

	if (!suspended) {
		return c.json(
			{
				response: 'No suspended execution found.',
				suspended: false,
				threadId: c.var.thread.id,
				sessionId: '',
				tokens: 0,
			},
			404
		);
	}

	const resumeData = c.req.valid('json');

	c.var.logger.info('Resuming network', {
		suspendId: suspended.id,
		toolName: suspended.toolName,
		subAgent: suspended.subAgent,
		resumeData,
	});

	const result = await resumeNetwork(suspended, resumeData, c.var.thread);

	return c.json(result);
});

// ── Network History ─────────────────────────────────────────────────────────

export const NetworkHistoryOutputSchema = s.object({
	networkHistory: s.array(NetworkHistoryEntrySchema),
	threadId: s.string(),
	totalOperations: s.number(),
});

export const NetworkStatsSchema = s.object({
	threadId: s.string(),
	totalOperations: s.number(),
	immediateCount: s.number(),
	approvedCount: s.number(),
	declinedCount: s.number(),
	resumedCount: s.number(),
	totalTokens: s.number(),
});

// Retrieve network operation history
api.get('/network/history', validator({ output: NetworkHistoryOutputSchema }), async (c) => {
	const history = (await c.var.thread.state.get<NetworkHistoryEntry[]>('networkHistory')) ?? [];

	return c.json({
		networkHistory: history,
		threadId: c.var.thread.id,
		totalOperations: history.length,
	});
});

// Clear network history and pending state
api.delete('/network/history', validator({ output: NetworkHistoryOutputSchema }), async (c) => {
	await c.var.thread.state.delete('networkHistory');
	await c.var.thread.state.delete('pendingApproval');
	await c.var.thread.state.delete('suspendedExecution');

	return c.json({
		networkHistory: [],
		threadId: c.var.thread.id,
		totalOperations: 0,
	});
});

// Get network operation stats
api.get('/network/stats', validator({ output: NetworkStatsSchema }), async (c) => {
	const history = (await c.var.thread.state.get<NetworkHistoryEntry[]>('networkHistory')) ?? [];

	return c.json({
		threadId: c.var.thread.id,
		totalOperations: history.length,
		immediateCount: history.filter((h) => h.type === 'immediate').length,
		approvedCount: history.filter((h) => h.type === 'approved').length,
		declinedCount: history.filter((h) => h.type === 'declined').length,
		resumedCount: history.filter((h) => h.type === 'resumed').length,
		totalTokens: history.reduce((sum, h) => sum + h.tokens, 0),
	});
});

export default api;
