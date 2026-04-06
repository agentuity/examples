/**
 * API routes for the dynamic tools agent.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import dynamicTools from '@agent/dynamic-tools';

const router = new Hono<Env>()
	.post('/chat', dynamicTools.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await dynamicTools.run(data));
	});

export default router;
