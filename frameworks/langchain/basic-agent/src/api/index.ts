/**
 * API routes for the basic agent.
 * The agent handles tool execution and the ReAct loop; routes just forward requests.
 */

import { createRouter } from '@agentuity/runtime';
import basic from '../agent/basic';

const api = createRouter();

// Send a message to the LangChain agent
api.post('/chat', basic.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await basic.run(data));
});

export default api;
