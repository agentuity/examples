import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const agent = createAgent('conference', {
	description:
		'AI Engineer World Fair 2025 conference expert - answers questions about schedule, speakers, sessions, and venue',
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
		ctx.logger.info('Conference agent processing request');

		try {
			// Load conference content (with caching)
			let conferenceContent: string;
			const cacheKey = 'conference_llms_txt';
			const cached = await ctx.kv.get('content', cacheKey);

			if (cached.exists) {
				ctx.logger.info('Using cached conference content');
				conferenceContent = cached.data as string;
			} else {
				ctx.logger.info('Loading conference content from file');
				conferenceContent = await Bun.file('src/content/conference/llms.txt').text();

				// Cache indefinitely (content is static)
				await ctx.kv.set('content', cacheKey, conferenceContent);
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
				system: `You are an expert on AI Engineer World Fair 2025, taking place June 3-5, 2025 at the SF Marriott Marquis in San Francisco.

Use the following conference information to answer questions accurately:

${conferenceContent}

Important guidelines:
- Only answer questions based on the information provided above
- If information is not available, acknowledge that and DO NOT make up information
- Be helpful and conversational
- Include specific details like times, locations, and speaker names when relevant
- If asked about multiple items, provide a clear organized response`,
				messages,
			});

			ctx.logger.info('Conference agent generated response');
			return result.text;
		} catch (error) {
			ctx.logger.error(
				`Conference agent error: ${error instanceof Error ? error.message : String(error)}`
			);
			return {
				error: 'processing_failed',
				message:
					'Unable to process your conference question. Please try again.',
			};
		}
	},
});

export default agent;
