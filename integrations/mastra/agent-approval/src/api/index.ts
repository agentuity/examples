/**
 * API routes for the translation and approval agents.
 * Routes handle state operations (get/clear history, approve/decline);
 * agents handle core logic.
 */

import { createRouter, validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import approval, {
	AgentOutput as ApprovalOutput,
	ApprovalHistoryEntrySchema,
	PendingApprovalSchema,
	approveToolCall,
	declineToolCall,
	type ApprovalHistoryEntry,
	type PendingApproval,
} from '../agent/approval';
import translate, { AgentOutput, type HistoryEntry } from '../agent/translate';

const api = createRouter();

// ============================================================================
// Translation Agent Routes
// ============================================================================

// State subset for history endpoints (derived from AgentOutput)
export const StateSchema = AgentOutput.pick(['history', 'threadId', 'translationCount']);

// Call the agent to translate text
api.post('/translate', translate.validator(), async (c) => {
	const data = c.req.valid('json');

	return c.json(await translate.run(data));
});

// Retrieve translation history
api.get('/translate/history', validator({ output: StateSchema }), async (c) => {
	// Routes use c.var.* for Agentuity services (thread, kv, logger); agents use ctx.* directly
	const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];

	return c.json({
		history,
		threadId: c.var.thread.id,
		translationCount: history.length,
	});
});

// Clear translation history
api.delete('/translate/history', validator({ output: StateSchema }), async (c) => {
	await c.var.thread.state.delete('history');

	return c.json({
		history: [],
		threadId: c.var.thread.id,
		translationCount: 0,
	});
});

// ============================================================================
// Approval Agent Routes
// ============================================================================

// Call the approval agent to process a request (may suspend for approval)
api.post('/approval', approval.validator(), async (c) => {
	const data = c.req.valid('json');

	return c.json(await approval.run(data));
});

// ── Pending Approval ────────────────────────────────────────────────────────

const PendingApprovalOutputSchema = s.object({
	pendingApproval: PendingApprovalSchema.optional(),
	threadId: s.string(),
	hasPending: s.boolean(),
});

// Get the current pending approval for this thread
api.get('/approval/pending', validator({ output: PendingApprovalOutputSchema }), async (c) => {
	const pending = await c.var.thread.state.get<PendingApproval>('pendingApproval');

	return c.json({
		pendingApproval: pending ?? undefined,
		threadId: c.var.thread.id,
		hasPending: pending !== null && pending !== undefined,
	});
});

// ── Approve / Decline ───────────────────────────────────────────────────────

/**
 * Approve a pending tool call.
 * Mirrors Mastra's agent.approveToolCall({ runId }) pattern.
 * Executes the suspended tool and returns the LLM response with the result.
 */
api.post('/approval/approve', validator({ output: ApprovalOutput }), async (c) => {
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

	c.var.logger.info('Approving tool call', { approvalId: pending.id, toolName: pending.toolName });

	const result = await approveToolCall(pending, c.var.thread);

	return c.json(result);
});

/**
 * Decline a pending tool call.
 * Mirrors Mastra's agent.declineToolCall({ runId }) pattern.
 * The LLM responds acknowledging the declined tool without executing it.
 */
api.post('/approval/decline', validator({ output: ApprovalOutput }), async (c) => {
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

	c.var.logger.info('Declining tool call', { approvalId: pending.id, toolName: pending.toolName });

	const result = await declineToolCall(pending, c.var.thread);

	return c.json(result);
});

// ── Approval History ────────────────────────────────────────────────────────

const ApprovalHistoryOutputSchema = s.object({
	approvalHistory: s.array(ApprovalHistoryEntrySchema),
	threadId: s.string(),
	totalApprovals: s.number(),
});

const ApprovalStatsSchema = s.object({
	threadId: s.string(),
	totalRequests: s.number(),
	approvedCount: s.number(),
	declinedCount: s.number(),
	totalTokens: s.number(),
});

// Retrieve approval history
api.get('/approval/history', validator({ output: ApprovalHistoryOutputSchema }), async (c) => {
	const history = (await c.var.thread.state.get<ApprovalHistoryEntry[]>('approvalHistory')) ?? [];

	return c.json({
		approvalHistory: history,
		threadId: c.var.thread.id,
		totalApprovals: history.length,
	});
});

// Clear approval history
api.delete('/approval/history', validator({ output: ApprovalHistoryOutputSchema }), async (c) => {
	await c.var.thread.state.delete('approvalHistory');
	await c.var.thread.state.delete('pendingApproval');

	return c.json({
		approvalHistory: [],
		threadId: c.var.thread.id,
		totalApprovals: 0,
	});
});

// Get approval stats
api.get('/approval/stats', validator({ output: ApprovalStatsSchema }), async (c) => {
	const history = (await c.var.thread.state.get<ApprovalHistoryEntry[]>('approvalHistory')) ?? [];

	return c.json({
		threadId: c.var.thread.id,
		totalRequests: history.length,
		approvedCount: history.filter((h) => h.status === 'approved').length,
		declinedCount: history.filter((h) => h.status === 'declined').length,
		totalTokens: history.reduce((sum, h) => sum + h.tokens, 0),
	});
});

export default api;
