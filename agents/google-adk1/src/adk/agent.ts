import { FunctionTool, LlmAgent } from '../../node_modules/@google/adk/dist/esm/common.js';
import { z } from 'zod';

const CITY_TIMEZONES: Record<string, string> = {
	berlin: 'Europe/Berlin',
	boston: 'America/New_York',
	chennai: 'Asia/Kolkata',
	chicago: 'America/Chicago',
	delhi: 'Asia/Kolkata',
	dubai: 'Asia/Dubai',
	frankfurt: 'Europe/Berlin',
	jacksonville: 'America/New_York',
	kolkata: 'Asia/Kolkata',
	london: 'Europe/London',
	'los angeles': 'America/Los_Angeles',
	madrid: 'Europe/Madrid',
	miami: 'America/New_York',
	'new york': 'America/New_York',
	paris: 'Europe/Paris',
	'san francisco': 'America/Los_Angeles',
	singapore: 'Asia/Singapore',
	tokyo: 'Asia/Tokyo',
};

const formatTimeForCity = (city: string): string => {
	const timezone = CITY_TIMEZONES[city.toLowerCase()] ?? 'UTC';

	return new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: timezone,
		timeZoneName: 'short',
	}).format(new Date());
};

const getCurrentTime = new FunctionTool({
	name: 'get_current_time',
	description: 'Returns the current time in a specified city.',
	parameters: z.object({
		city: z.string().describe('The name of the city for which to retrieve the current time.'),
	}),
	execute: ({ city }) => ({
		status: 'success',
		report: `The current time in ${city} is ${formatTimeForCity(city)}.`,
	}),
});

export const rootAgent = new LlmAgent({
	name: 'hello_time_agent',
	model: 'gemini-2.5-flash',
	description: 'Tells the current time in a specified city.',
	instruction: `You are a helpful assistant that tells the current time in a city.
Use the 'get_current_time' tool for this purpose.`,
	tools: [getCurrentTime],
});
