/**
 * API routes for agents with tools.
 * Demonstrates how to expose agents that use OpenAI function calling as APIs.
 */

import { createRouter } from '@agentuity/runtime';
import weather from '../agent/weather';
import activities from '../agent/activities';

const api = createRouter();

// Ask the weather agent a question
api.post('/weather', weather.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await weather.run(data));
});

// Ask the activities agent for suggestions
api.post('/activities', activities.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await activities.run(data));
});

// Health check endpoint
api.get('/health', async (c) => {
	return c.json({ status: 'ok', agents: ['weather', 'activities'] });
});

export default api;
