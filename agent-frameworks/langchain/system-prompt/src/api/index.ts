/**
 * API routes for the system prompt agent.
 */

import { createRouter } from '@agentuity/runtime';
import systemPrompt from '../agent/system-prompt';

const api = createRouter();

api.post('/chat', systemPrompt.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await systemPrompt.run(data));
});

export default api;
