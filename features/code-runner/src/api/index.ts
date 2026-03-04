import { createRouter } from '@agentuity/runtime';
import codeRunner from '@agent/code-runner';

// Custom API routes are mounted at /api/* by the Agentuity runtime.
// This lets the frontend call the agent via a standard REST endpoint.
const api = createRouter();

// POST /api/run — invoke the code-runner agent.
// codeRunner.validator() auto-validates the request body against AgentInput.
// codeRunner.run() executes the agent handler and returns typed AgentOutput.
api.post('/run', codeRunner.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await codeRunner.run(data);
	return c.json(result);
});

export default api;
