import { createRouter } from '@agentuity/runtime';
import conciergeAgent from '@agent/concierge';
import conferenceAgent from '@agent/conference';
import sanfranciscoAgent from '@agent/sanfrancisco';
import developerAgent from '@agent/developer';

const api = createRouter();

// Main concierge route (orchestrator)
api.post('/concierge', conciergeAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await conciergeAgent.run(data);
	return c.json(result);
});

// Direct access to specialized agents (for testing/debugging)

api.post('/conference', conferenceAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await conferenceAgent.run(data);
	return c.json(result);
});

api.post('/sanfrancisco', sanfranciscoAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await sanfranciscoAgent.run(data);
	return c.json(result);
});

api.post('/developer', developerAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await developerAgent.run(data);
	return c.json(result);
});

export default api;
