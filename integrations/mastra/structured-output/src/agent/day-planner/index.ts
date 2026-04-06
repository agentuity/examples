/**
 * Day Planner Agent: Uses AI to generate structured daily plans.
 * Demonstrates structured output with well-defined schemas.
 * Uses @agentuity/schema for the Agentuity I/O layer and Mastra Agent
 * with Zod for type-safe structured output from the LLM.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import '../../lib/gateway';

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;
const PLAN_TYPES = ['work', 'personal', 'mixed'] as const;

// ---------------------------------------------------------------------------
// Zod schema — used by Mastra's structuredOutput for type-safe LLM responses
// ---------------------------------------------------------------------------
const DayPlanSchema = z.object({
	plan: z.array(
		z.object({
			name: z.string().describe('Name of the time block (e.g., Morning, Afternoon, Evening)'),
			activities: z.array(
				z.object({
					name: z.string().describe('Name of the activity'),
					startTime: z.string().describe('Start time in HH:MM format'),
					endTime: z.string().describe('End time in HH:MM format'),
					description: z.string().describe('Brief description of the activity'),
					priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
				})
			).describe('Activities in this time block'),
		})
	).describe('Time blocks making up the day plan'),
	summary: z.string().describe('Brief summary of the planned day'),
});

// ---------------------------------------------------------------------------
// @agentuity/schema types — used for Agentuity I/O validation and history
// ---------------------------------------------------------------------------

// Activity schema - structured output for each planned activity
export const ActivitySchema = s.object({
	name: s.string().describe('Name of the activity'),
	startTime: s.string().describe('Start time in HH:MM format'),
	endTime: s.string().describe('End time in HH:MM format'),
	description: s.string().describe('Brief description of the activity'),
	priority: s.enum(['high', 'medium', 'low']).describe('Priority level'),
});

export type Activity = s.infer<typeof ActivitySchema>;

// Time block schema - groups activities by time of day
export const TimeBlockSchema = s.object({
	name: s.string().describe('Name of the time block (e.g., Morning, Afternoon, Evening)'),
	activities: s.array(ActivitySchema).describe('Activities in this time block'),
});

export type TimeBlock = s.infer<typeof TimeBlockSchema>;

// History entry for storing past plans
export const HistoryEntrySchema = s.object({
	model: s.string().describe('AI model used for the plan'),
	sessionId: s.string().describe('Session ID when the plan was created'),
	prompt: s.string().describe('Original prompt (truncated)'),
	timestamp: s.string().describe('ISO timestamp when the plan was created'),
	tokens: s.number().describe('Number of tokens used'),
	planType: s.string().describe('Type of plan created'),
	activityCount: s.number().describe('Number of activities in the plan'),
});

export type HistoryEntry = s.infer<typeof HistoryEntrySchema>;

export const AgentInput = s.object({
	model: s.enum(MODELS).optional().describe('AI model to use for planning'),
	prompt: s.string().describe('Description of your day or what you need to plan'),
	planType: s.enum(PLAN_TYPES).optional().describe('Type of plan to create'),
});

export const AgentOutput = s.object({
	plan: s.array(TimeBlockSchema).describe('Structured daily plan with time blocks'),
	summary: s.string().describe('Brief summary of the planned day'),
	totalActivities: s.number().describe('Total number of activities planned'),
	history: s.array(HistoryEntrySchema).describe('Recent planning history'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	tokens: s.number().describe('Tokens used for this plan'),
});

// ---------------------------------------------------------------------------
// Mastra Agent — handles the LLM call with structured output via Zod schema
// ---------------------------------------------------------------------------
const plannerMastraAgent = new Agent({
	id: 'day-planner',
	name: 'Day Planner',
	instructions: `You are a day planning assistant. Create a structured daily plan based on the user's description.

Guidelines:
- Create 2-4 time blocks (Morning, Afternoon, Evening, Night)
- Each block should have 2-5 activities
- Be realistic with time estimates
- Adjust the focus based on the plan type provided in the request`,
	model: 'openai/gpt-5-nano',
});

// ---------------------------------------------------------------------------
// Agentuity agent wrapper — keeps schema validation and ctx integrations
// ---------------------------------------------------------------------------
const agent = createAgent('day-planner', {
	description: 'Creates structured daily plans from natural language descriptions',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { prompt, planType = 'mixed', model = 'gpt-5-nano' }) => {
		ctx.logger.info('──── Day Planner ────');
		ctx.logger.info({ planType, model, promptLength: prompt.length });
		ctx.logger.info('Request IDs', {
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		});

		const planTypeDescription =
			planType === 'work'
				? 'professional tasks'
				: planType === 'personal'
					? 'personal activities'
					: 'a mix of work and personal activities';

		// Use Mastra's structuredOutput to get a type-safe, parsed response
		const result = await plannerMastraAgent.generate(
			`Plan type: ${planType} (focus on ${planTypeDescription}).\n\n${prompt}`,
			{ structuredOutput: { schema: DayPlanSchema } }
		);

		const parsedPlan = result.object ?? {
			plan: [
				{
					name: 'Morning',
					activities: [
						{
							name: 'Plan your day',
							startTime: '09:00',
							endTime: '09:30',
							description: 'Take time to organize your schedule',
							priority: 'high' as const,
						},
					],
				},
			],
			summary: 'A simple day plan to get started.',
		};

		// Token usage — Mastra surfaces this via result.usage when available
		const tokens = (result.usage?.totalTokens ?? 0);

		const totalActivities = parsedPlan.plan.reduce(
			(sum, block) => sum + block.activities.length,
			0
		);

		// Add to history
		const truncate = (str: string, len: number) =>
			str.length > len ? `${str.slice(0, len)}...` : str;

		const newEntry: HistoryEntry = {
			model,
			sessionId: ctx.sessionId,
			prompt: truncate(prompt, 50),
			timestamp: new Date().toISOString(),
			tokens,
			planType,
			activityCount: totalActivities,
		};

		await ctx.thread.state.push('history', newEntry, 5);
		const history = (await ctx.thread.state.get<HistoryEntry[]>('history')) ?? [];

		ctx.logger.info('Plan complete', {
			tokens,
			totalActivities,
			historyCount: history.length,
		});

		return {
			plan: parsedPlan.plan,
			summary: parsedPlan.summary,
			totalActivities,
			history,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
			tokens,
		};
	},
});

export default agent;
