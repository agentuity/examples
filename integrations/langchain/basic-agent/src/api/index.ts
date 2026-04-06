/**
 * API routes for the basic agent.
 * The agent handles tool execution and the ReAct loop; routes just forward requests.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import basic from '@agent/basic';

const router = new Hono<Env>()
	.post('/chat', basic.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await basic.run(data));
	});

export default router;
