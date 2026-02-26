/**
 * Evals for the network agent.
 * - network-approval-suspension (binary): Does the network suspend tool calls that require approval?
 * - network-suspend-resume (binary): Does the network properly suspend with a payload for confirmation tools?
 * - safe-network-tool-execution (binary): Do safe tools execute without network suspension?
 * - sub-agent-routing (binary): Does the network route to the correct sub-agent?
 */

import agent from './index';

/**
 * Eval: Network Approval Suspension
 * Verifies that tools marked as requiring approval within the network
 * are properly suspended rather than executed immediately.
 * Mirrors Mastra's agent-execution-approval / tool-execution-approval events.
 */
export const networkApprovalSuspensionEval = agent.createEval('network-approval-suspension', {
	description: 'Verifies that network tool calls requiring approval are suspended',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] network-approval-suspension: Starting');

		const sensitivePatterns = [/delete/i, /remove.*record/i, /send.*notification/i, /send.*email/i, /send.*sms/i];
		const isSensitiveRequest = sensitivePatterns.some((p) => p.test(input.text));

		if (!isSensitiveRequest) {
			return {
				passed: true,
				reason: 'Input does not target a sensitive tool',
				metadata: { isSensitiveRequest: false },
			};
		}

		const wasSuspended =
			output.suspended === true && output.suspendType === 'approval' && output.pendingApproval !== undefined;

		ctx.logger.info('[EVAL] network-approval-suspension: Completed', { isSensitiveRequest, wasSuspended });

		return {
			passed: wasSuspended,
			reason: wasSuspended
				? 'Network correctly suspended sensitive tool call for approval'
				: 'Network failed to suspend sensitive tool call',
			metadata: {
				isSensitiveRequest,
				wasSuspended,
				toolName: output.pendingApproval?.toolName ?? 'none',
				subAgent: output.subAgent ?? 'none',
			},
		};
	},
});

/**
 * Eval: Network Suspend/Resume
 * Verifies that confirmation tools properly suspend the network with a payload
 * containing the information needed for the user to respond.
 * Mirrors Mastra's agent-execution-suspended / tool-execution-suspended events.
 */
export const networkSuspendResumeEval = agent.createEval('network-suspend-resume', {
	description: 'Verifies that confirmation tools properly suspend the network with a payload',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] network-suspend-resume: Starting');

		const confirmPatterns = [/confirm/i, /verify/i, /choose/i, /select/i];
		const isConfirmRequest = confirmPatterns.some((p) => p.test(input.text));

		if (!isConfirmRequest) {
			return {
				passed: true,
				reason: 'Input does not target a confirmation tool',
				metadata: { isConfirmRequest: false },
			};
		}

		const wasSuspended =
			output.suspended === true && output.suspendType === 'suspend' && output.suspendedExecution !== undefined;

		if (wasSuspended) {
			const payload = JSON.parse(output.suspendedExecution!.suspendPayload) as Record<string, string>;
			const hasMessage = (payload.message?.length ?? 0) > 0;
			const hasAction = (payload.action?.length ?? 0) > 0;

			return {
				passed: hasMessage && hasAction,
				reason:
					hasMessage && hasAction
						? 'Network correctly suspended with payload containing message and action'
						: 'Suspend payload missing required fields',
				metadata: { hasMessage, hasAction, payload },
			};
		}

		return {
			passed: false,
			reason: 'Network did not suspend for confirmation request',
			metadata: { isConfirmRequest, suspended: output.suspended },
		};
	},
});

/**
 * Eval: Safe Tool Execution
 * Verifies that non-sensitive tools in the network execute immediately
 * without requiring approval or suspension.
 */
export const safeNetworkToolExecutionEval = agent.createEval('safe-network-tool-execution', {
	description: 'Verifies that safe network tools execute without requiring approval',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] safe-network-tool-execution: Starting');

		const safePatterns = [/search/i, /look\s*up/i, /find/i, /info.*about/i];
		const isSafeRequest = safePatterns.some((p) => p.test(input.text));

		if (!isSafeRequest || input.requireToolApproval) {
			return {
				passed: true,
				reason: input.requireToolApproval
					? 'Agent-level approval is enabled, suspension expected'
					: 'Input does not target a safe tool',
			};
		}

		const executedWithoutSuspension = output.suspended === false;

		ctx.logger.info('[EVAL] safe-network-tool-execution: Completed', { isSafeRequest, executedWithoutSuspension });

		return {
			passed: executedWithoutSuspension,
			reason: executedWithoutSuspension
				? 'Safe tool executed without network suspension'
				: 'Safe tool was incorrectly suspended',
			metadata: {
				isSafeRequest,
				suspended: output.suspended,
				toolExecuted: output.toolExecuted ?? 'none',
				subAgent: output.subAgent ?? 'none',
			},
		};
	},
});

/**
 * Eval: Sub-Agent Routing
 * Verifies that the network routes requests to the correct sub-agent
 * based on the nature of the request.
 */
export const subAgentRoutingEval = agent.createEval('sub-agent-routing', {
	description: 'Verifies that the network routes to the correct sub-agent',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] sub-agent-routing: Starting');

		const researchPatterns = [/search/i, /look\s*up/i, /find/i, /info/i];
		const operationsPatterns = [/delete/i, /send/i, /notification/i, /email/i, /sms/i];
		const confirmationPatterns = [/confirm/i, /verify/i, /choose/i];

		let expectedSubAgent: string | null = null;
		if (researchPatterns.some((p) => p.test(input.text))) expectedSubAgent = 'research';
		else if (operationsPatterns.some((p) => p.test(input.text))) expectedSubAgent = 'operations';
		else if (confirmationPatterns.some((p) => p.test(input.text))) expectedSubAgent = 'confirmation';

		if (!expectedSubAgent || !output.subAgent) {
			return {
				passed: true,
				reason: 'Could not determine expected routing or no sub-agent was used',
				metadata: { expectedSubAgent, actualSubAgent: output.subAgent ?? 'none' },
			};
		}

		const correctRouting = output.subAgent === expectedSubAgent;

		ctx.logger.info('[EVAL] sub-agent-routing: Completed', {
			expectedSubAgent,
			actualSubAgent: output.subAgent,
			correctRouting,
		});

		return {
			passed: correctRouting,
			reason: correctRouting
				? `Correctly routed to ${expectedSubAgent} sub-agent`
				: `Expected ${expectedSubAgent} sub-agent but routed to ${output.subAgent}`,
			metadata: { expectedSubAgent, actualSubAgent: output.subAgent },
		};
	},
});
