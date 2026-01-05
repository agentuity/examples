import { createRouter } from '@agentuity/runtime';
import weather from '@agent/weather';

const api = createRouter();

api.post('/weather', weather.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await weather.run(data);
	return c.json(result);
});

export default api;
