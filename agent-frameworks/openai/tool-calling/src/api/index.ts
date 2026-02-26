/**
 * API routes for the tool-calling agent.
 * The agent handles tool execution and the ReAct loop; routes just forward requests.
 */

import { createRouter } from '@agentuity/runtime';
import toolCalling from '../agent/tool-calling';

const api = createRouter();

// Send a message to the OpenAI Agents SDK agent
api.post('/chat', toolCalling.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await toolCalling.run(data));
});

export default api;
