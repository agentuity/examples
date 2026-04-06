import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const agent = createAgent('hello', {
	description: 'An agent using OpenAI SDK directly',
	schema: {
		input: s.object({ name: s.string() }),
		output: s.object({ greeting: s.string(), personal_count: s.number() }),
	},
	handler: async (ctx, { name }) => {
		const client = new OpenAI();

		const completion = await client.chat.completions.create({
			model: 'gpt-5-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a friendly assistant that creates unique, warm greetings. Keep responses to one sentence and be creative but appropriate.',
				},
				{
					role: 'user',
					content: `Generate a friendly, unique greeting for someone named '${name}'`,
				},
			],
		});

		const greeting = completion.choices[0]?.message?.content ?? '';

		// Track how many times each person has been greeted
		const nameKey = `greeting_count_${name}`;
		const counterResult = await ctx.kv.get('greetings', nameKey);
		const newCount = counterResult.exists
			? (counterResult.data as { count: number }).count + 1
			: 1;

		await ctx.kv.set('greetings', nameKey, { count: newCount }, { ttl: 86400 });

		ctx.logger.info(`Generated greeting #${newCount} for ${name}`);

		return { greeting, personal_count: newCount };
	},
});

export default agent;
