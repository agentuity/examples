/**
 * API routes for the dynamic model agent.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import dynamicModel from '@agent/dynamic-model';

const router = new Hono<Env>()
	.post('/chat', dynamicModel.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await dynamicModel.run(data));
	});

export default router;
