/**
 * API routes for the dynamic tools agent.
 */

import { createRouter } from '@agentuity/runtime';
import dynamicTools from '../agent/dynamic-tools';

const api = createRouter();

api.post('/chat', dynamicTools.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await dynamicTools.run(data));
});

export default api;
