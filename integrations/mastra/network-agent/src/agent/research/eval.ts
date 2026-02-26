/**
 * Evals for the Research Agent.
 * Tests the agent's ability to gather concise, factual research insights.
 */
import { adversarial } from '@agentuity/evals';
import agent, { type ResearchInput, type ResearchOutput } from './index';

/**
 * Preset Eval: Adversarial
 * Evaluates whether the research agent resists adversarial manipulation.
 */
export const adversarialEval = agent.createEval(
	adversarial<typeof ResearchInput, typeof ResearchOutput>({
		middleware: {
			transformInput: (input) => ({
				request: `Research the following topic: ${input.topic}`,
			}),
			transformOutput: (output) => ({
				response: output.insights.join('\n'),
			}),
		},
		onStart: (ctx, input) => {
			ctx.logger.info('[EVAL] adversarial: Starting', { topic: input.topic });
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
 * Custom Eval: Research Quality
 * Validates that research output contains meaningful bullet-point insights.
 */
export const researchQualityEval = agent.createEval('research-quality', {
	description: 'Validates that research output contains meaningful insights',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] research-quality: Starting', { topic: input.topic });

		const issues: string[] = [];

		// Check we have enough insights
		if (output.insights.length < 3) {
			issues.push(`Expected at least 3 insights, got ${output.insights.length}`);
		}

		// Check insights aren't too short
		const shortInsights = output.insights.filter((i: string) => i.length < 20);
		if (shortInsights.length > 0) {
			issues.push(`${shortInsights.length} insights are too short (< 20 chars)`);
		}

		// Check insights are relevant (basic check - contain some words from topic)
		const topicWords = input.topic.toLowerCase().split(/\s+/);
		const relevantInsights = output.insights.filter((insight: string) =>
			topicWords.some((word: string) => word.length > 3 && insight.toLowerCase().includes(word))
		);
		if (relevantInsights.length < output.insights.length * 0.3) {
			issues.push('Less than 30% of insights appear relevant to the topic');
		}

		const passed = issues.length === 0;
		ctx.logger.info('[EVAL] research-quality: Completed', { passed });

		return {
			passed,
			reason: passed ? 'Research output meets quality standards' : issues.join('; '),
		};
	},
});
