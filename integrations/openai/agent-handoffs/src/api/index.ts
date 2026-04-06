import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import handoffs from '@agent/handoffs';

const router = new Hono<Env>()
	.post('/chat', handoffs.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await handoffs.run(data));
	});

export default router;
