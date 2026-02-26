/**
 * API routes for the streaming agent.
 */

import { createRouter } from '@agentuity/runtime';
import streaming from '../agent/streaming';

const api = createRouter();

api.post('/chat', streaming.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await streaming.run(data));
});

export default api;
