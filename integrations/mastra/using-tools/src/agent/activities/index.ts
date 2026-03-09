/**
 * Activities Agent: Demonstrates using multiple Mastra tools inside an Agentuity agent.
 * This agent uses both a weather tool and an activities tool to suggest activities
 * based on current weather conditions.
 *
 * The Mastra Agent handles:
 * 1. Fetching weather via the get-weather tool
 * 2. Getting activity suggestions via the get-activities tool
 * 3. Returning a friendly, combined natural language response
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { createTool } from '@mastra/core/tools';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

// Bridge Agentuity AI Gateway → Mastra's model resolution
if (!process.env.OPENAI_API_KEY && process.env.AGENTUITY_SDK_KEY) {
	const gw = process.env.AGENTUITY_AIGATEWAY_URL || process.env.AGENTUITY_TRANSPORT_URL || 'https://agentuity.ai';
	process.env.OPENAI_API_KEY = process.env.AGENTUITY_SDK_KEY;
	process.env.OPENAI_BASE_URL = `${gw}/gateway/openai`;
}

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
		location: z.string().describe('The city or location to get weather for'),
	}),
	execute: async ({ location }: { location: string }) => {
		try {
			const coords = await getCoordinates(location);
			if (!coords) {
				return `Could not find location: ${location}`;
			}

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

// Mastra tool — suggests activities based on weather conditions and location
const activitiesTool = createTool({
	id: 'get-activities',
	description: 'Suggests activities based on weather conditions',
	inputSchema: z.object({
		weather: z.string().describe('Current weather description (e.g., "sunny", "rainy", "cloudy")'),
		location: z.string().describe('The location to suggest activities for'),
	}),
	execute: async ({ weather, location }: { weather: string; location: string }) => {
		const weatherLower = weather.toLowerCase();

		let activities: string[];

		if (weatherLower.includes('rain') || weatherLower.includes('shower')) {
			activities = [
				'Visit a local museum or art gallery',
				'Catch a movie at the cinema',
				'Explore indoor shopping centers',
				'Try a new restaurant or cafe',
				'Visit a local library or bookstore',
			];
		} else if (weatherLower.includes('sun') || weatherLower.includes('clear')) {
			activities = [
				'Go for a hike or nature walk',
				'Have a picnic in the park',
				'Visit outdoor markets',
				'Try outdoor photography',
				'Go cycling or running',
			];
		} else if (weatherLower.includes('cloud') || weatherLower.includes('overcast')) {
			activities = [
				'Take a scenic drive',
				'Visit botanical gardens',
				'Go for a leisurely walk',
				'Try outdoor cafes',
				'Explore local neighborhoods',
			];
		} else if (weatherLower.includes('snow')) {
			activities = [
				'Go skiing or snowboarding',
				'Build a snowman',
				'Have a cozy day indoors with hot cocoa',
				'Visit a winter market',
				'Try ice skating',
			];
		} else {
			activities = [
				'Explore local attractions',
				'Try a new restaurant',
				'Visit a museum',
				'Go for a walk',
				'Check out local events',
			];
		}

		return JSON.stringify({
			location,
			weatherCondition: weather,
			suggestedActivities: activities,
		});
	},
});

// Mastra Agent that uses both tools
const activitiesMastraAgent = new Agent({
	id: 'activities-agent',
	name: 'Activities Agent',
	instructions: `You are a helpful activity planner assistant. When users ask for activity suggestions:
1. First use the get-weather tool to check current weather conditions
2. Then use the get-activities tool to get activity suggestions based on the weather
3. Provide a friendly response with personalized activity recommendations

Always check the weather first before suggesting activities, as outdoor activities depend on weather conditions.`,
	model: 'openai/gpt-4o-mini',
	tools: { weatherTool, activitiesTool },
});

// Input/Output schemas for the Agentuity wrapper
export const AgentInput = s.object({
	message: s.string().describe('User message asking for activity suggestions'),
});

export const AgentOutput = s.object({
	response: s.string().describe('Natural language response with activity suggestions'),
	tokens: s.number().describe('Total tokens used'),
});

// Agentuity agent wrapper — keeps platform integration, schema validation, and deployment
const agent = createAgent('activities', {
	description: 'An assistant that suggests activities based on weather conditions using Mastra tools',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { message }) => {
		ctx.logger.info('Activities Agent Request', { message });

		// Delegate to the Mastra Agent — it handles multi-tool calling automatically
		const result = await activitiesMastraAgent.generate(message);

		const response = result.text ?? 'Unable to process your request.';
		const tokens = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);

		ctx.logger.info('Activities Agent Response', {
			response: response.substring(0, 100),
			tokens,
		});

		return { response, tokens };
	},
});

export default agent;
