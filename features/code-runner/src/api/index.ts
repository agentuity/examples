import { createRouter } from '@agentuity/runtime';
import codeRunner from '@agent/code-runner';

const api = createRouter();

api.post('/run', codeRunner.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await codeRunner.run(data);
	return c.json(result);
});

export default api;
