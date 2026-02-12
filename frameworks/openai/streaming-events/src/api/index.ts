/**
 * API routes for the streaming agent.
 * The agent handles streaming and event capture; routes just forward requests.
 */

import { createRouter } from '@agentuity/runtime';
import streaming from '../agent/streaming';

const api = createRouter();

// Send a message to the streaming agent
api.post('/chat', streaming.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await streaming.run(data));
});

export default api;
