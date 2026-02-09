/**
 * Evals for the approval agent.
 * - approval-suspension (binary): Does the agent suspend tool calls that require approval?
 * - safe-tool-execution (binary): Does the agent execute safe tools without requiring approval?
 * - approval-context (binary): Does the agent provide meaningful approval context/reasons?
 */

import agent from './index';

/**
 * Eval: Approval Suspension
 * Verifies that tools marked as requiring approval are properly suspended
 * rather than executed immediately.
 */
export const approvalSuspensionEval = agent.createEval('approval-suspension', {
	description: 'Verifies that sensitive tool calls are suspended for approval',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] approval-suspension: Starting');

		// Check if the input likely triggers a tool that requires approval
		const sensitivePatterns = [/delete/i, /remove.*data/i, /send.*notification/i, /send.*email/i, /send.*sms/i];

		const isSensitiveRequest = sensitivePatterns.some((p) => p.test(input.text));

		if (!isSensitiveRequest) {
			ctx.logger.info('[EVAL] approval-suspension: Input does not target sensitive tools');
			return {
				passed: true,
				reason: 'Input does not target a sensitive tool',
				metadata: { isSensitiveRequest: false },
			};
		}

		// If it was a sensitive request, verify it was suspended
		const wasSuspended = output.suspended === true && output.pendingApproval !== undefined;

		ctx.logger.info('[EVAL] approval-suspension: Completed', {
			isSensitiveRequest,
			wasSuspended,
		});

		return {
			passed: wasSuspended,
			reason: wasSuspended
				? 'Agent correctly suspended sensitive tool call for approval'
				: 'Agent failed to suspend sensitive tool call',
			metadata: {
				isSensitiveRequest,
				wasSuspended,
				toolName: output.pendingApproval?.toolName ?? 'none',
			},
		};
	},
});

/**
 * Eval: Safe Tool Execution
 * Verifies that non-sensitive tools execute immediately without requiring approval.
 */
export const safeToolExecutionEval = agent.createEval('safe-tool-execution', {
	description: 'Verifies that safe tools execute without requiring approval',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] safe-tool-execution: Starting');

		// Check if the input targets a safe tool (weather, search)
		const safePatterns = [/weather/i, /search/i, /find.*record/i, /look\s*up/i];
		const isSafeRequest = safePatterns.some((p) => p.test(input.text));

		// Skip if input doesn't target a safe tool or if agent-level approval is on
		if (!isSafeRequest || input.requireToolApproval) {
			ctx.logger.info('[EVAL] safe-tool-execution: Not applicable');
			return {
				passed: true,
				reason: input.requireToolApproval
					? 'Agent-level approval is enabled, suspension expected'
					: 'Input does not target a safe tool',
				metadata: { isSafeRequest, requireToolApproval: input.requireToolApproval },
			};
		}

		// Safe tools should NOT be suspended
		const executedWithoutApproval = output.suspended === false;

		ctx.logger.info('[EVAL] safe-tool-execution: Completed', {
			isSafeRequest,
			executedWithoutApproval,
		});

		return {
			passed: executedWithoutApproval,
			reason: executedWithoutApproval
				? 'Safe tool executed without requiring approval'
				: 'Safe tool was incorrectly suspended for approval',
			metadata: {
				isSafeRequest,
				suspended: output.suspended,
				toolExecuted: output.toolExecuted ?? 'none',
			},
		};
	},
});

/**
 * Eval: Approval Context
 * Verifies that suspended tool calls include meaningful approval context
 * explaining why approval is needed (mirrors Mastra's suspend payload pattern).
 */
export const approvalContextEval = agent.createEval('approval-context', {
	description: 'Verifies that suspended tool calls include meaningful approval context',
	handler: async (ctx, _input, output) => {
		ctx.logger.info('[EVAL] approval-context: Starting');

		// Only applicable if the output was suspended
		if (!output.suspended || !output.pendingApproval) {
			ctx.logger.info('[EVAL] approval-context: Not suspended, skipping');
			return {
				passed: true,
				reason: 'Output was not suspended, eval not applicable',
				metadata: { suspended: false },
			};
		}

		const { pendingApproval } = output;

		// Check that required fields are present and meaningful
		const hasToolName = pendingApproval.toolName.length > 0;
		const hasReason = pendingApproval.reason.length > 10;
		const hasId = pendingApproval.id.length > 0;
		const hasToolArgs = pendingApproval.toolArgs.length > 2; // At least "{}"
		const hasTimestamp = pendingApproval.requestedAt.length > 0;

		const allPresent = hasToolName && hasReason && hasId && hasToolArgs && hasTimestamp;

		ctx.logger.info('[EVAL] approval-context: Completed', {
			hasToolName,
			hasReason,
			hasId,
			hasToolArgs,
			hasTimestamp,
		});

		return {
			passed: allPresent,
			reason: allPresent
				? 'Pending approval includes all required context'
				: 'Pending approval is missing context fields',
			metadata: {
				toolName: pendingApproval.toolName,
				reasonLength: pendingApproval.reason.length,
				fields: { hasToolName, hasReason, hasId, hasToolArgs, hasTimestamp },
			},
		};
	},
});
