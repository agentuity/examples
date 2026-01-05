import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';
import conferenceAgent from '../conference/agent';
import sanfranciscoAgent from '../sanfrancisco/agent';
import developerAgent from '../developer/agent';

const openai = new OpenAI();

function getWelcomeMessage(): string {
	return `Welcome to AI Engineer World Fair 2025 Concierge!

I can help with:
- Conference information (schedule, speakers, sessions)
- San Francisco recommendations (restaurants, attractions, weather)
- Agentuity platform development questions

Example prompts:
- "Where should I go for dinner in San Francisco?"
- "What sessions are happening on June 4th?"
- "How do I create an agent with Agentuity?"
- "What's the weather like in SF?"`;
}

const agent = createAgent('concierge', {
	description:
		'Main concierge orchestrator - classifies user intent and routes to specialized agents',
	schema: {
		input: s.object({
			prompt: s.string(),
			conversationId: s.optional(s.string()),
		}),
		output: s.union(
			s.object({
				response: s.string(),
				intent: s.string(),
				conversationId: s.string(),
				examplePrompts: s.optional(s.array(s.string())),
			}),
			s.object({ error: s.string(), message: s.string() })
		),
	},
	handler: async (ctx, { prompt, conversationId }) => {
		ctx.logger.info('Concierge agent processing request');

		try {
			// Generate conversation ID if not provided
			const convId =
				conversationId || crypto.randomUUID();

			// Load conversation history
			let conversationHistory: Array<{
				role: string;
				content: string;
				timestamp: number;
			}> = [];

			const historyResult = await ctx.kv.get('conversations', convId);
			if (historyResult.exists) {
				const historyData = historyResult.data as {
					messages: Array<{
						role: string;
						content: string;
						timestamp: number;
					}>;
				};
				conversationHistory = historyData.messages || [];
				ctx.logger.info(
					`Loaded conversation history: ${conversationHistory.length} messages`
				);
			}

			// Do NOT add current message yet - let specialized agents handle it
			// We'll add it after getting the response to maintain proper alternation

			// Classify intent using OpenAI
			let intent = 'other';
			try {
				const intentResponse = await openai.chat.completions.create({
					model: 'gpt-4o-mini',
					messages: [
						{
							role: 'system',
							content: `Classify the user's request into ONE of these categories:
- "sanfrancisco" - Questions about San Francisco (restaurants, attractions, weather, transportation, things to do)
- "conference" - Questions about AI Engineer World Fair 2025 (schedule, speakers, sessions, venue, tickets)
- "agentuity" - Questions about Agentuity platform (development, SDK, architecture, how to build)
- "other" - Greetings, unclear requests, or questions outside the above categories

Examples:
- "Where should I eat dinner?" → sanfrancisco
- "What's the weather like?" → sanfrancisco
- "Tell me about the conference schedule" → conference
- "Who is speaking at the event?" → conference
- "How do I create an agent?" → agentuity
- "What is the Agentuity SDK?" → agentuity
- "Hello!" → other

Respond with ONLY the category name in lowercase (sanfrancisco, conference, agentuity, or other).`,
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					temperature: 0,
				});

				const intentText =
					intentResponse.choices[0]?.message?.content?.trim().toLowerCase() ||
					'other';
				intent = ['sanfrancisco', 'conference', 'agentuity'].includes(intentText)
					? intentText
					: 'other';

				ctx.logger.info(`Classified intent: ${intent}`);
			} catch (error) {
				ctx.logger.warn(
					`Intent classification failed: ${error instanceof Error ? error.message : String(error)}`
				);
				// Default to 'other' - will show welcome message
			}

			// Route to appropriate agent
			let responseText: string;

			if (intent === 'conference') {
				ctx.logger.info('Routing to conference agent');
				const result = await conferenceAgent.run({
					prompt,
					conversationHistory: conversationHistory.slice(-10),
				});
				responseText = typeof result === 'string' ? result : result.error || 'Error processing request';
			} else if (intent === 'sanfrancisco') {
				ctx.logger.info('Routing to San Francisco agent');
				const result = await sanfranciscoAgent.run({
					prompt,
					conversationHistory: conversationHistory.slice(-10),
				});
				if (typeof result === 'object' && 'response' in result) {
					responseText = result.response;
					// Append sources if available
					if (result.sources && result.sources.length > 0) {
						responseText += '\n\nSources:\n';
						result.sources.forEach((source:string, idx:number ) => {
							responseText += `[${idx + 1}] ${source}\n`;
						});
					}
					// Append weather if available
					if (result.weather) {
						responseText += `\n\nCurrent Weather in ${result.weather.location}: ${result.weather.temperature}°F, ${result.weather.forecast}`;
					}
				} else if (typeof result === 'object' && 'error' in result) {
					responseText = result.error || 'Error processing request';
				} else {
					responseText = 'Error processing request';
				}
			} else if (intent === 'agentuity') {
				ctx.logger.info('Routing to developer agent');
				const result = await developerAgent.run({
					prompt,
					conversationHistory: conversationHistory.slice(-10),
				});
				responseText = typeof result === 'string' ? result : result.error || 'Error processing request';
			} else {
				// No clear intent - show welcome message
				ctx.logger.info('No clear intent - showing welcome message');
				responseText = getWelcomeMessage();
			}

			// Add current user message and response to history
			// (Adding user message here ensures proper alternation with assistant response)
			conversationHistory.push({
				role: 'user',
				content: prompt,
				timestamp: Date.now(),
			});

			conversationHistory.push({
				role: 'assistant',
				content: responseText,
				timestamp: Date.now(),
			});

			// Keep only last 10 messages (5 turns)
			if (conversationHistory.length > 10) {
				conversationHistory = conversationHistory.slice(-10);
			}

			// Save conversation history
			await ctx.kv.set(
				'conversations',
				convId,
				{
					messages: conversationHistory,
					lastIntent: intent,
					updatedAt: Date.now(),
				},
				{ ttl: 86400 } // 24 hours
			);

			ctx.logger.info('Concierge agent completed', {
				intent,
				conversationId: convId,
			});

			// Include example prompts only for 'other' intent
			const examplePrompts =
				intent === 'other'
					? [
							'Where should I go for dinner in San Francisco?',
							'What sessions are happening on June 4th?',
							'How do I create an agent with Agentuity?',
							'What\'s the weather like in SF?',
						]
					: undefined;

			return {
				response: responseText,
				intent,
				conversationId: convId,
				examplePrompts,
			};
		} catch (error) {
			ctx.logger.error(
				`Concierge agent error: ${error instanceof Error ? error.message : String(error)}`
			);
			return {
				error: 'processing_failed',
				message: 'Unable to process your request. Please try again.',
			};
		}
	},
});

export default agent;
