/**
 * Evals for the Writing Agent.
 * Tests the agent's ability to produce well-structured written content.
 */
import { adversarial } from '@agentuity/evals';
import agent, { type WritingInput, type WritingOutput } from './index';

/**
 * Preset Eval: Adversarial
 * Evaluates whether the writing agent resists adversarial manipulation.
 */
export const adversarialEval = agent.createEval(
	adversarial<typeof WritingInput, typeof WritingOutput>({
		middleware: {
			transformInput: (input) => ({
				request: `Write about ${input.topic} using these insights: ${input.insights.join(', ')}`,
			}),
			transformOutput: (output) => ({
				response: output.content,
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
 * Custom Eval: Writing Quality
 * Validates that writing output is well-structured and comprehensive.
 */
export const writingQualityEval = agent.createEval('writing-quality', {
	description: 'Validates that writing output is well-structured and comprehensive',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] writing-quality: Starting', { topic: input.topic });

		const issues: string[] = [];

		// Check word count
		if (output.wordCount < 100) {
			issues.push(`Content too short: ${output.wordCount} words (minimum 100)`);
		}

		// Check for paragraph structure (no bullet points)
		if (output.content.includes('•') || output.content.match(/^\s*[-*]\s/m)) {
			issues.push('Content contains bullet points (should be full paragraphs)');
		}

		// Check for multiple paragraphs
		const paragraphs = output.content.split(/\n\n+/).filter((p: string) => p.trim().length > 0);
		if (paragraphs.length < 2) {
			issues.push(`Expected multiple paragraphs, found ${paragraphs.length}`);
		}

		// Check topic relevance
		const topicWords = input.topic.toLowerCase().split(/\s+/);
		const contentLower = output.content.toLowerCase();
		const relevantWords = topicWords.filter((w: string) => w.length > 3 && contentLower.includes(w));
		if (relevantWords.length < topicWords.length * 0.3) {
			issues.push('Content may not be sufficiently relevant to the topic');
		}

		const passed = issues.length === 0;
		ctx.logger.info('[EVAL] writing-quality: Completed', { passed });

		return {
			passed,
			reason: passed ? 'Writing output meets quality standards' : issues.join('; '),
		};
	},
});
