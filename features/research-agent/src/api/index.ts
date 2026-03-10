import { createRouter } from '@agentuity/runtime';
import agent from '@agent/researcher';

const api = createRouter();

api.post('/research', agent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await agent.run(data);
	return c.json(result);
});

export default api;
