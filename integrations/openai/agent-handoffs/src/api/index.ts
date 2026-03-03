/**
 * API routes for the handoffs agent.
 * The triage agent routes to specialists; routes just forward requests.
 */

import { createRouter } from '@agentuity/runtime';
import handoffs from '../agent/handoffs';

const api = createRouter();

// Send a message to the triage agent
api.post('/chat', handoffs.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await handoffs.run(data));
});

export default api;
