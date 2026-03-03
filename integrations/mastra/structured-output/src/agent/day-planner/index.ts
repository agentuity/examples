/**
 * Day Planner Agent: Uses AI to generate structured daily plans.
 * Demonstrates structured output with well-defined schemas.
 * Uses @agentuity/schema - a lightweight, built-in schema library.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

/**
 * AI Gateway: Routes requests to OpenAI, Anthropic, and other LLM providers.
 * One SDK key, unified observability and billing; no separate API keys needed.
 */
const client = new OpenAI();

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;
const PLAN_TYPES = ['work', 'personal', 'mixed'] as const;

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

// Agent definition with automatic schema validation
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

		const systemPrompt = `You are a day planning assistant. Create a structured daily plan based on the user's description.

Return a JSON object with this exact structure:
{
  "plan": [
    {
      "name": "Morning",
      "activities": [
        {
          "name": "Activity name",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "description": "Brief description",
          "priority": "high" | "medium" | "low"
        }
      ]
    }
  ],
  "summary": "Brief summary of the day"
}

Guidelines:
- Create 2-4 time blocks (Morning, Afternoon, Evening, Night)
- Each block should have 2-5 activities
- Plan type is: ${planType} (focus on ${planType === 'work' ? 'professional tasks' : planType === 'personal' ? 'personal activities' : 'a mix of both'})
- Be realistic with time estimates
- Return ONLY valid JSON, no additional text`;

		const completion = await client.chat.completions.create({
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: prompt },
			],
			response_format: { type: 'json_object' },
		});

		const content = completion.choices[0]?.message?.content ?? '{}';
		const tokens = completion.usage?.total_tokens ?? 0;

		let parsedPlan: { plan: TimeBlock[]; summary: string };
		try {
			parsedPlan = JSON.parse(content);
		} catch {
			parsedPlan = {
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
		}

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
