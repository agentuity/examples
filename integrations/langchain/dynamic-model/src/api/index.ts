/**
 * API routes for the dynamic model agent.
 */

import { createRouter } from '@agentuity/runtime';
import dynamicModel from '../agent/dynamic-model';

const api = createRouter();

// Send a message to the dynamic model agent
api.post('/chat', dynamicModel.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await dynamicModel.run(data));
});

export default api;
