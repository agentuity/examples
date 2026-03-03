import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const client = new OpenAI();

const agent = createAgent('hello', {
	description: 'An agent using OpenAI SDK directly',
	schema: {
		input: s.object({ name: s.string() }),
		output: s.object({ greeting: s.string(), personal_count: s.number() })
	},
	handler: async (ctx, { name }) => {

		// Basic logging functionality
		ctx.logger.info(`Agent handler received name: ${name}`);

		// Call to OpenAI
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

		const nameKey = `greeting_count_${name}`;
  		ctx.logger.info(`Looking for counter with key: ${nameKey}`);

		const counterResult = await ctx.kv.get('greetings', nameKey);
		ctx.logger.info(`Counter exists: ${counterResult.exists}`);

		let newCount: number;
		if (counterResult.exists && counterResult.data) {
			const data = ( counterResult.data) as { count: number };
			ctx.logger.info(`Retrieved counter data:`, data);
			const currentCount = data.count;
			newCount = currentCount + 1;
		} else {
			ctx.logger.info(`No existing counter found, starting at 1`);
			newCount = 1;
		}

		// Save updated counter with 24-hour TTL (86400 seconds)
		ctx.logger.info(`Saving counter ${newCount} for key: ${nameKey}`);
		await ctx.kv.set(
			'greetings',
			nameKey,
			{ count: newCount },
			{
			ttl: 86400,
			contentType: 'application/json',
			}
		);

		// Verify storage
		const verifyResult = await ctx.kv.get('greetings', nameKey);
		if (verifyResult.exists && verifyResult.data) {
			const verifiedData = verifyResult.data;
			ctx.logger.info(`Verified stored value:`, verifiedData);
		} else {
			ctx.logger.error(`Failed to verify storage for key: ${nameKey}`);
		}

		// Prepare response
		const responseData = {
			greeting,
			personal_count: newCount,
		};

		ctx.logger.info(`Generated greeting #${1} for ${name}`);

		return responseData;
	},})

export default agent;