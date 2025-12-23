import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const agent = createAgent('developer', {
	description:
		'Agentuity platform expert - explains SDK, architecture, and development practices',
	schema: {
		input: s.object({
			prompt: s.string(),
			conversationHistory: s.optional(
				s.array(
					s.object({
						role: s.string(),
						content: s.string(),
					})
				)
			),
		}),
		output: s.union(
			s.string(), // Success response
			s.object({ error: s.string(), message: s.string() }) // Error
		),
	},
	handler: async (ctx, { prompt, conversationHistory }) => {
		ctx.logger.info('Developer agent processing request');

		try {
			// Load Agentuity documentation content (with caching)
			let docContent: string;
			const cacheKey = 'agentuity_llms_txt';
			const cached = await ctx.kv.get('content', cacheKey);

			if (cached.exists) {
				ctx.logger.info('Using cached Agentuity documentation');
				docContent = cached.data as string;
			} else {
				ctx.logger.info('Loading Agentuity documentation from file');
				docContent = await Bun.file('src/content/agentuity/llms.txt').text();

				// Cache indefinitely (content is static)
				await ctx.kv.set('content', cacheKey, docContent);
			}

			// Build conversation context
			const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
				[];

			if (conversationHistory && conversationHistory.length > 0) {
				// Include last 5 turns
				const recentHistory = conversationHistory.slice(-10);
				for (const msg of recentHistory) {
					messages.push({
						role: msg.role as 'user' | 'assistant',
						content: msg.content,
					});
				}
			}

			// Current user prompt
			messages.push({ role: 'user', content: prompt });

			// Generate response using OpenAI
			const result = await generateText({
				model: openai('gpt-4o-mini'),
				system: `You are an expert on the Agentuity platform, helping developers understand and use the SDK effectively.

Use the following Agentuity documentation to answer questions:

${docContent}

Important guidelines:
- Only answer questions based on the official Agentuity documentation provided above
- Reference www.agentuity.dev for additional documentation
- If information is not in the documentation, acknowledge that and DO NOT make up information
- Provide code examples when helpful
- Be clear, concise, and technically accurate
- Guide developers to best practices`,
				messages,
			});

			ctx.logger.info('Developer agent generated response');
			return result.text;
		} catch (error) {
			ctx.logger.error(
				`Developer agent error: ${error instanceof Error ? error.message : String(error)}`
			);
			return {
				error: 'processing_failed',
				message:
					'Unable to process your Agentuity question. Please try again.',
			};
		}
	},
});

export default agent;
