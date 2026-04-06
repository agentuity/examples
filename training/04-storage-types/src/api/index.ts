import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import storageTypes from '@agent/storage-types';

const router = new Hono<Env>()
	.post('/storage-types', storageTypes.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await storageTypes.run(data);
		return c.json(result);
	});

export default router;
