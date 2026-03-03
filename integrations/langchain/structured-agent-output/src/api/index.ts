/**
 * API routes for the structured output agent.
 */

import { createRouter } from '@agentuity/runtime';
import structuredOutput from '../agent/structured-output';

const api = createRouter();

api.post('/chat', structuredOutput.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await structuredOutput.run(data));
});

export default api;
