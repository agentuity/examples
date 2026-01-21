import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { perplexity } from '@ai-sdk/perplexity';
import { getWeather } from '../../lib/weather';

const agent = createAgent('sanfrancisco', {
	description:
		'San Francisco local guide - provides restaurant recommendations, attractions, weather, and transportation info',
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
			s.object({
				response: s.string(),
				sources: s.optional(s.array(s.string())),
				weather: s.optional(
					s.object({
						location: s.string(),
						temperature: s.number(),
						forecast: s.string(),
					})
				),
			}),
			s.object({ error: s.string(), message: s.string() })
		),
	},
	handler: async (ctx, { prompt, conversationHistory }) => {
		ctx.logger.info('San Francisco agent processing request');

		try {
			// Check if weather-related query
			const weatherKeywords = [
				'weather',
				'temperature',
				'forecast',
				'rain',
				'sunny',
				'cold',
				'hot',
				'climate',
			];
			const isWeatherQuery = weatherKeywords.some((keyword) =>
				prompt.toLowerCase().includes(keyword)
			);

			let weatherData = null;
			if (isWeatherQuery) {
				try {
					ctx.logger.info('Fetching weather data for query');
					const weather = await getWeather('San Francisco', ctx);
					weatherData = {
						location: weather.location,
						temperature: weather.temperature,
						forecast: weather.forecast,
					};
				} catch (error) {
					ctx.logger.warn(
						`Weather fetch failed: ${error instanceof Error ? error.message : String(error)}`
					);
					// Continue without weather data
				}
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

			// Enhance prompt with weather data if available
			let enhancedPrompt = prompt;
			if (weatherData) {
				enhancedPrompt = `${prompt}\n\nCurrent SF weather: ${weatherData.temperature}°F, ${weatherData.forecast}`;
			}

			messages.push({ role: 'user', content: enhancedPrompt });

			// Generate response using Perplexity
			const result = await generateText({
				model: perplexity('sonar-pro'),
				system: `You are a knowledgeable San Francisco local guide helping visitors and residents.

Provide helpful, current information about:
- Restaurant recommendations (all cuisines and price ranges)
- Attractions and things to do
- Transportation options (BART, Muni, cable cars, rideshare)
- Neighborhoods and cultural context
- Events and entertainment
- Shopping and services

Be conversational, specific, and helpful. Include practical details like:
- Addresses and locations
- Price ranges
- Hours of operation (if known)
- Transportation access
- Tips and insider knowledge

If you reference specific places or information, provide sources when available.`,
				messages,
			});

			const responseText = result.text;

			// Extract sources from response (Perplexity may include citations)
			// Simple extraction: look for URLs in the response
			const urlRegex = /(https?:\/\/[^\s]+)/g;
			const urls = responseText.match(urlRegex);
			const sources = urls ? [...new Set(urls)] : undefined;

			ctx.logger.info('San Francisco agent generated response', {
				hasSources: !!sources,
				hasWeather: !!weatherData,
			});

			return {
				response: responseText,
				sources,
				weather: weatherData || undefined,
			};
		} catch (error) {
			ctx.logger.error(
				`San Francisco agent error: ${error instanceof Error ? error.message : String(error)}`
			);
			return {
				error: 'processing_failed',
				message:
					'Unable to process your San Francisco question. Please try again.',
			};
		}
	},
});

export default agent;
