/**
 * Tools for the network agent.
 * These are standalone utility functions that the routing agent can call.
 */

/**
 * Weather Tool: retrieves current weather information using the wttr.in API.
 * Accepts a city or location name as input and returns a weather summary.
 */
export async function getWeather(location: string): Promise<{ location: string; weather: string }> {
	const url = `https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%h+%w`;

	const response = await fetch(url);
	const weather = await response.text();

	return {
		location,
		weather: weather.trim(),
	};
}

/**
 * Tool definitions for OpenAI function calling.
 * The routing agent uses these to determine which tool to call.
 */
export const toolDefinitions = [
	{
		type: 'function' as const,
		function: {
			name: 'get_weather',
			description:
				'Retrieves current weather information. Use this tool whenever up-to-date weather data is requested for a specific location.',
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
		type: 'function' as const,
		function: {
			name: 'research_topic',
			description:
				'Gathers concise research insights about a topic in bullet-point form. Use this when you need to extract key facts about any subject.',
			parameters: {
				type: 'object',
				properties: {
					topic: {
						type: 'string',
						description: 'The topic to research',
					},
				},
				required: ['topic'],
			},
		},
	},
	{
		type: 'function' as const,
		function: {
			name: 'write_content',
			description:
				'Turns research insights into well-structured written content. Use this after gathering research to produce full paragraphs suitable for articles or blog posts.',
			parameters: {
				type: 'object',
				properties: {
					topic: {
						type: 'string',
						description: 'The topic being written about',
					},
					insights: {
						type: 'array',
						items: { type: 'string' },
						description: 'Research insights to incorporate into the writing',
					},
					style: {
						type: 'string',
						enum: ['blog', 'article', 'summary', 'report'],
						description: 'The writing style to use',
					},
				},
				required: ['topic', 'insights'],
			},
		},
	},
	{
		type: 'function' as const,
		function: {
			name: 'city_research',
			description:
				'Handles city-specific research tasks. First gathers factual information about the city, then synthesizes that research into a full written report. Use this when the user wants comprehensive information about a specific city.',
			parameters: {
				type: 'object',
				properties: {
					city: {
						type: 'string',
						description: 'The name of the city to research',
					},
				},
				required: ['city'],
			},
		},
	},
];
