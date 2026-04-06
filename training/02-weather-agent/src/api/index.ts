import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import weather from '@agent/weather';

const router = new Hono<Env>()
	.post('/weather', weather.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await weather.run(data);
		return c.json(result);
	});

export default router;
