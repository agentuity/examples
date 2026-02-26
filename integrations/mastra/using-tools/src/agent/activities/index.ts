/**
 * Activities Agent: Demonstrates using multiple tools with OpenAI function calling.
 * This agent uses both weather and activities tools to suggest activities based on weather.
 *
 * Similar to Mastra's example of using multiple tools in one agent.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const client = new OpenAI();

// Tool definitions for OpenAI function calling
const tools: ChatCompletionTool[] = [
	{
		type: 'function',
		function: {
			name: 'get_weather',
			description: 'Fetches current weather for a location',
			parameters: {
				type: 'object',
				properties: {
					location: {
						type: 'string',
						description: 'The city or location to get weather for',
					},
				},
				required: ['location'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'get_activities',
			description: 'Suggests activities based on weather conditions',
			parameters: {
				type: 'object',
				properties: {
					weather: {
						type: 'string',
						description: 'Current weather description (e.g., "sunny", "rainy", "cloudy")',
					},
					location: {
						type: 'string',
						description: 'The location to suggest activities for',
					},
				},
				required: ['weather', 'location'],
			},
		},
	},
];

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

// Tool implementation - fetches weather from Open-Meteo API (free, reliable)
async function getWeather(location: string): Promise<string> {
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
	} catch (error) {
		return `Unable to fetch weather for ${location}`;
	}
}

function getActivities(weather: string, location: string): string {
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
}

// Input/Output schemas
export const AgentInput = s.object({
	message: s.string().describe('User message asking for activity suggestions'),
});

export const AgentOutput = s.object({
	response: s.string().describe('Natural language response with activity suggestions'),
	toolCalls: s
		.array(
			s.object({
				tool: s.string().describe('Name of the tool that was called'),
				input: s.string().describe('Input passed to the tool'),
				output: s.string().describe('Output from the tool'),
			})
		)
		.describe('List of tool calls made during processing'),
	tokens: s.number().describe('Total tokens used'),
});

const agent = createAgent('activities', {
	description: 'An assistant that suggests activities based on weather conditions',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { message }) => {
		ctx.logger.info('Activities Agent Request', { message });

		const messages: ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `You are a helpful activity planner assistant. When users ask for activity suggestions:
1. First use the get_weather tool to check current weather conditions
2. Then use the get_activities tool to get activity suggestions based on the weather
3. Provide a friendly response with personalized activity recommendations

Always check the weather first before suggesting activities, as outdoor activities depend on weather conditions.`,
			},
			{
				role: 'user',
				content: message,
			},
		];

		const toolCalls: { tool: string; input: string; output: string }[] = [];
		let totalTokens = 0;

		// Initial completion with tools
		let completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages,
			tools,
			tool_choice: 'auto',
		});

		totalTokens += completion.usage?.total_tokens ?? 0;
		let assistantMessage = completion.choices[0]?.message;

		// Process tool calls if any (may require multiple rounds)
		while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
			ctx.logger.info('Processing tool calls', {
				count: assistantMessage.tool_calls.length,
			});

			// Add assistant message with tool calls to conversation
			messages.push(assistantMessage);

			// Execute each tool call
			for (const toolCall of assistantMessage.tool_calls) {
				// Only handle function tool calls
				if (toolCall.type !== 'function') continue;

				const functionName = toolCall.function.name;
				const functionArgs = JSON.parse(toolCall.function.arguments);

				ctx.logger.info('Executing tool', { tool: functionName, args: functionArgs });

				let result: string;
				if (functionName === 'get_weather') {
					result = await getWeather(functionArgs.location);
				} else if (functionName === 'get_activities') {
					result = getActivities(functionArgs.weather, functionArgs.location);
				} else {
					result = `Unknown tool: ${functionName}`;
				}

				toolCalls.push({
					tool: functionName,
					input: JSON.stringify(functionArgs),
					output: result,
				});

				// Add tool result to conversation
				messages.push({
					role: 'tool',
					tool_call_id: toolCall.id,
					content: result,
				});
			}

			// Get next completion after tool results
			completion = await client.chat.completions.create({
				model: 'gpt-4o-mini',
				messages,
				tools,
				tool_choice: 'auto',
			});

			totalTokens += completion.usage?.total_tokens ?? 0;
			assistantMessage = completion.choices[0]?.message;
		}

		const response = assistantMessage?.content ?? 'Unable to process your request.';

		ctx.logger.info('Activities Agent Response', {
			response: response.substring(0, 100),
			toolCallCount: toolCalls.length,
			totalTokens,
		});

		return {
			response,
			toolCalls,
			tokens: totalTokens,
		};
	},
});

export default agent;
