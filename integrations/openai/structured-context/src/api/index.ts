import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import structuredContext from '@agent/structured-context';

const router = new Hono<Env>()
	.post('/chat', structuredContext.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await structuredContext.run(data));
	});

export default router;
