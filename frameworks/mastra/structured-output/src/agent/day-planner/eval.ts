/**
 * Evals for the day planner agent.
 * - adversarial (score, from 0-1): Does the response resist adversarial manipulation attempts?
 * - structure-valid (binary, pass/fail): Is the output properly structured?
 */

import { adversarial } from '@agentuity/evals';
import { s } from '@agentuity/schema';
import Groq from 'groq-sdk';
import agent, { type AgentInput, type AgentOutput } from './index';

const groq = new Groq();

/**
 * Preset Eval (score type): Adversarial
 * Evaluates whether response resists adversarial manipulation attempts.
 * Uses middleware to transform agent I/O to the match the agent's input/output format.
 */
export const adversarialEval = agent.createEval(
	adversarial<typeof AgentInput, typeof AgentOutput>({
		middleware: {
			transformInput: (input) => ({
				request: `Create a ${input.planType ?? 'mixed'} plan:\n\n${input.prompt}`,
			}),
			transformOutput: (output) => ({
				response: output.summary,
			}),
		},
		onStart: (ctx, input) => {
			ctx.logger.info('[EVAL] adversarial: Starting', { planType: input.planType });
		},
		onComplete: (ctx, input, output, result) => {
			ctx.logger.info('[EVAL] adversarial: Completed', {
				passed: result.passed,
				reason: result.reason,
			});
		},
	})
);

/**
 * Custom Eval (binary type): Structure Valid
 * Verifies the plan output has valid structure with time blocks and activities.
 * Uses Groq SDK via AI Gateway for structured validation.
 */
const StructureCheckSchema = s.object({
	hasValidTimeBlocks: s.boolean().describe('Whether the plan has valid time blocks'),
	hasValidActivities: s.boolean().describe('Whether activities have required fields'),
	isWellOrganized: s.boolean().describe('Whether the plan is logically organized'),
	reason: s.string().describe('Brief explanation'),
});

type StructureCheck = s.infer<typeof StructureCheckSchema>;

export const structureValidEval = agent.createEval('structure-valid', {
	description: 'Verifies the plan output has valid structured data',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] structure-valid: Starting', { planType: input.planType });

		// Skip if no plan produced
		if (!output.plan || output.plan.length === 0) {
			ctx.logger.info('[EVAL] structure-valid: No plan to evaluate');

			return {
				passed: false,
				reason: 'No plan produced',
			};
		}

		// Generate JSON schema with strict mode for structured output
		const jsonSchema = s.toJSONSchema(StructureCheckSchema, { strict: true });

		const planSummary = output.plan.map((block) => ({
			name: block.name,
			activityCount: block.activities.length,
			activities: block.activities.map((a) => ({
				name: a.name,
				hasTime: Boolean(a.startTime && a.endTime),
				hasPriority: Boolean(a.priority),
			})),
		}));

		const completion = await groq.chat.completions.create({
			model: 'openai/gpt-oss-120b',
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'structure_check',
					schema: jsonSchema as Record<string, unknown>,
					strict: true,
				},
			},
			messages: [
				{
					role: 'user',
					content: `Evaluate if this day plan has valid structure:

Plan Structure:
${JSON.stringify(planSummary, null, 2)}

Summary: "${output.summary}"
Total Activities: ${output.totalActivities}

Check if:
1. Time blocks are logically named (Morning, Afternoon, Evening, etc.)
2. Each activity has a name, time range, and priority
3. The plan is well-organized and coherent`,
				},
			],
		});

		const content = completion.choices[0]?.message?.content;
		if (!content) {
			ctx.logger.warn('[EVAL] structure-valid: No response from structure check');
			return {
				passed: false,
				reason: 'No response from structure check',
			};
		}

		const result = JSON.parse(content) as StructureCheck;

		const passed = result.hasValidTimeBlocks && result.hasValidActivities && result.isWellOrganized;

		ctx.logger.info('[EVAL] structure-valid: Completed', { passed });

		return {
			passed,
			reason: result.reason,
			metadata: {
				hasValidTimeBlocks: result.hasValidTimeBlocks,
				hasValidActivities: result.hasValidActivities,
				isWellOrganized: result.isWellOrganized,
				timeBlockCount: output.plan.length,
				totalActivities: output.totalActivities,
			},
		};
	},
});
