import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import streaming from '@agent/streaming';

const router = new Hono<Env>()
	.post('/chat', streaming.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await streaming.run(data));
	});

export default router;
