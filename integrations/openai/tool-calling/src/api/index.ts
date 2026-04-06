import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import toolCalling from '@agent/tool-calling';

const router = new Hono<Env>()
	.post('/chat', toolCalling.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await toolCalling.run(data));
	});

export default router;
