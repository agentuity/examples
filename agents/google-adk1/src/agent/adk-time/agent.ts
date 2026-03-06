import { InMemoryRunner, stringifyContent, type Event } from '../../../node_modules/@google/adk/dist/esm/common.js';
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { rootAgent } from '../../adk/agent';

const adkRunner = new InMemoryRunner({
	agent: rootAgent,
	appName: 'agentuity-adk-time-bridge',
});

export const AgentInput = s.object({
	city: s.string().describe('City to ask the ADK agent about current time'),
});

export const AgentOutput = s.object({
	city: s.string().describe('Requested city name'),
	eventCount: s.number().describe('Number of ADK events produced during the run'),
	response: s.string().describe('Final text response returned by the ADK agent'),
});

const getAdkResponse = async (city: string, userId: string): Promise<{ response: string; eventCount: number }> => {
	const prompt = `What time is it right now in ${city}? Use tools if needed and answer in one sentence.`;

	let lastEvent: Event | undefined;
	let eventCount = 0;

	for await (const event of adkRunner.runEphemeral({
		userId,
		newMessage: {
			role: 'user',
			parts: [{ text: prompt }],
		},
	})) {
		eventCount += 1;
		lastEvent = event;
	}

	const response = lastEvent ? stringifyContent(lastEvent).trim() : '';

	return {
		response,
		eventCount,
	};
};

const agent = createAgent('adk-time', {
	description: 'Runs Google ADK rootAgent inside Agentuity and returns current time for a city',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { city }) => {
		ctx.logger.info('Running ADK bridge agent', { city });

		try {
			const result = await getAdkResponse(city, ctx.sessionId);

			return {
				city,
				eventCount: result.eventCount,
				response: result.response || 'No text response returned by ADK.',
			};
		} catch (error) {
			ctx.logger.error('ADK bridge failed', {
				error: error instanceof Error ? error.message : String(error),
			});

			throw new Error(
				'Google ADK call failed. Make sure GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY) is set before running this Agentuity app.'
			);
		}
	},
});

export default agent;
