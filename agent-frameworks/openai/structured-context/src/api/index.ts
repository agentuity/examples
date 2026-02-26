/**
 * API routes for the structured-context agent.
 * The agent handles contact lookup with typed context; routes just forward requests.
 */

import { createRouter } from '@agentuity/runtime';
import structuredContext from '../agent/structured-context';

const api = createRouter();

// Send a message to the structured-context agent
api.post('/chat', structuredContext.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await structuredContext.run(data));
});

export default api;
