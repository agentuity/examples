import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import codeRunner from '@agent/code-runner';

const router = new Hono<Env>()
	.post('/run', codeRunner.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await codeRunner.run(data);
		return c.json(result);
	});

export default router;
