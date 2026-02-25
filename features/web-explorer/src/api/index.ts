import { createRouter } from '@agentuity/runtime';
import webExplorer from '@agent/web-explorer';

const api = createRouter();

api.post('/explore', webExplorer.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await webExplorer.run(data);
	return c.json(result);
});

export default api;
