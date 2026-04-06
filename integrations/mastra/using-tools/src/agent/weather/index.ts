/**
 * Weather Agent: Demonstrates using Mastra tools inside an Agentuity agent.
 * This example shows how to use Mastra's createTool() and Agent class while
 * keeping the Agentuity createAgent wrapper for deployment and schema validation.
 *
 * The Mastra Agent handles:
 * 1. Understanding user requests about weather
 * 2. Calling the weatherTool (via Mastra's tool calling) to fetch real weather data
 * 3. Returning a natural language response
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { createTool } from '@mastra/core/tools';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import '../../lib/gateway';

// Geocoding to get coordinates from location name
async function getCoordinates(location: string): Promise<{ lat: number; lon: number; name: string } | null> {
	const response = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
	);
	if (!response.ok) return null;
	const data = await response.json();
	if (!data.results?.[0]) return null;
	return {
		lat: data.results[0].latitude,
		lon: data.results[0].longitude,
		name: data.results[0].name,
	};
}

// Mastra tool — fetches weather from Open-Meteo API (free, no key needed)
const weatherTool = createTool({
	id: 'get-weather',
	description: 'Fetches current weather for a location',
	inputSchema: z.object({
		location: z.string().describe('The city or location to get weather for (e.g., "London", "New York")'),
	}),
	execute: async ({ location }: { location: string }) => {
		try {
			// Geocode the location name to coordinates
			const coords = await getCoordinates(location);
			if (!coords) {
				return `Could not find location: ${location}`;
			}

			// Fetch current weather from Open-Meteo
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius`;
			const response = await fetch(weatherUrl);
			if (!response.ok) {
				return `Weather service error for ${location}`;
			}

			const data = await response.json();
			const current = data.current;

			// Convert WMO weather code to human-readable description
			const weatherDescriptions: Record<number, string> = {
				0: 'Clear sky',
				1: 'Mainly clear',
				2: 'Partly cloudy',
				3: 'Overcast',
				45: 'Foggy',
				48: 'Depositing rime fog',
				51: 'Light drizzle',
				53: 'Moderate drizzle',
				55: 'Dense drizzle',
				61: 'Slight rain',
				63: 'Moderate rain',
				65: 'Heavy rain',
				71: 'Slight snow',
				73: 'Moderate snow',
				75: 'Heavy snow',
				80: 'Slight rain showers',
				81: 'Moderate rain showers',
				82: 'Violent rain showers',
				95: 'Thunderstorm',
			};

			const description = weatherDescriptions[current.weather_code] ?? 'Unknown conditions';
			return `${coords.name}: ${description}, ${current.temperature_2m}°C, Wind: ${current.wind_speed_10m} km/h`;
		} catch {
			return `Unable to fetch weather for ${location}`;
		}
	},
});

// Mastra Agent that uses the weather tool
const weatherMastraAgent = new Agent({
	id: 'weather-agent',
	name: 'Weather Agent',
	instructions:
		'You are a helpful weather assistant. Use the get-weather tool to fetch current weather data when users ask about weather conditions. Always provide friendly, informative responses.',
	model: 'openai/gpt-5-nano',
	tools: { weatherTool },
});

// Input/Output schemas for the Agentuity wrapper
export const AgentInput = s.object({
	message: s.string().describe('User message asking about weather'),
});

export const AgentOutput = s.object({
	response: s.string().describe('Natural language response about the weather'),
	tokens: s.number().describe('Total tokens used'),
});

// Agentuity agent wrapper — keeps platform integration, schema validation, and deployment
const agent = createAgent('weather', {
	description: 'A weather assistant that uses Mastra tools to fetch real weather data',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { message }) => {
		ctx.logger.info('Weather Agent Request', { message });

		// Delegate to the Mastra Agent — it handles tool calling automatically
		const result = await weatherMastraAgent.generate(message);

		const response = result.text ?? 'Unable to process your request.';
		const tokens = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);

		ctx.logger.info('Weather Agent Response', {
			response: response.substring(0, 100),
			tokens,
		});

		return { response, tokens };
	},
});

export default agent;
