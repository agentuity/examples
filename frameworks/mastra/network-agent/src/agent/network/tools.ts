/**
 * Tools for the network agent.
 * These are standalone utility functions that the routing agent can call.
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Weather Tool: retrieves current weather information using the wttr.in API.
 * Accepts a city or location name as input and returns a weather summary.
 */
export const weatherTool = createTool({
	id: 'get-weather',
	description:
		'Retrieves current weather information for a specific location using the wttr.in API. Use this tool whenever up-to-date weather data is requested for a specific location.',
	inputSchema: z.object({
		location: z.string().describe('The city or location to get weather for'),
	}),
	outputSchema: z.object({
		location: z.string(),
		weather: z.string(),
	}),
	execute: async ({ location }) => {
		const url = `https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%h+%w`;
		const response = await fetch(url);
		const weather = await response.text();
		return { location, weather: weather.trim() };
	},
});
