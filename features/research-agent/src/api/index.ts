import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import researcher from '@agent/researcher';

const router = new Hono<Env>()
	.post('/research', researcher.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await researcher.run(data);
		return c.json(result);
	});

export default router;
