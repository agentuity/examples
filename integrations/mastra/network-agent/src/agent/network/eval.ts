/**
 * Evals for the Network Agent.
 * Tests the routing agent's ability to coordinate multiple agents and tools.
 */
import { adversarial } from '@agentuity/evals';
import agent, { type NetworkInput, type NetworkOutput } from './index';

/**
 * Preset Eval: Adversarial
 * Evaluates whether the network agent resists adversarial manipulation.
 */
export const adversarialEval = agent.createEval(
	adversarial<typeof NetworkInput, typeof NetworkOutput>({
		middleware: {
			transformInput: (input) => ({
				request: input.message,
			}),
			transformOutput: (output) => ({
				response: output.response,
			}),
		},
		onStart: (ctx, input) => {
			ctx.logger.info('[EVAL] adversarial: Starting', { message: input.message });
		},
		onComplete: (ctx, _input, _output, result) => {
			ctx.logger.info('[EVAL] adversarial: Completed', {
				passed: result.passed,
				reason: result.reason,
			});
		},
	})
);

/**
 * Custom Eval: Network Routing
 * Validates that the network agent routes to appropriate primitives.
 */
export const routingEval = agent.createEval('network-routing', {
	description: 'Validates that the network agent routes to appropriate primitives',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] network-routing: Starting', { message: input.message });

		const issues: string[] = [];
		const messageLower = input.message.toLowerCase();

		// Check weather routing
		if (messageLower.includes('weather') && !output.executedPrimitives.includes('get_weather')) {
			issues.push('Weather question should have used get_weather tool');
		}

		// Check research routing
		if (
			(messageLower.includes('research') || messageLower.includes('facts about')) &&
			!output.executedPrimitives.includes('research_topic') &&
			!output.executedPrimitives.includes('city_research')
		) {
			issues.push('Research request should have used research_topic or city_research');
		}

		// Check that we got a meaningful response
		if (output.response.length < 50) {
			issues.push('Response is too short to be meaningful');
		}

		const passed = issues.length === 0;
		ctx.logger.info('[EVAL] network-routing: Completed', { passed });

		return {
			passed,
			reason: passed ? 'Network routing decisions are appropriate' : issues.join('; '),
		};
	},
});

/**
 * Custom Eval: Multi-Step Handling
 * Validates that complex tasks use multiple primitives correctly.
 */
export const multiStepEval = agent.createEval('multi-step-handling', {
	description: 'Validates that complex tasks use multiple primitives correctly',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] multi-step-handling: Starting', { message: input.message });

		const issues: string[] = [];
		const messageLower = input.message.toLowerCase();

		// Check for research + writing pattern
		if (messageLower.includes('write') && messageLower.includes('research')) {
			const hasResearch = output.executedPrimitives.includes('research_topic');
			const hasWriting = output.executedPrimitives.includes('write_content');

			if (!hasResearch || !hasWriting) {
				issues.push('Request for research + writing should use both primitives');
			}

			// Check order: research should come before writing
			const researchIndex = output.executedPrimitives.indexOf('research_topic');
			const writingIndex = output.executedPrimitives.indexOf('write_content');
			if (researchIndex > writingIndex) {
				issues.push('Research should be executed before writing');
			}
		}

		// Check event flow
		const eventTypes = output.events.map((e: { type: string }) => e.type);
		if (!eventTypes.includes('network-start')) {
			issues.push('Missing network-start event');
		}
		if (!eventTypes.includes('network-complete')) {
			issues.push('Missing network-complete event');
		}

		const passed = issues.length === 0;
		ctx.logger.info('[EVAL] multi-step-handling: Completed', { passed });

		return {
			passed,
			reason: passed ? 'Multi-step task handling is correct' : issues.join('; '),
		};
	},
});
