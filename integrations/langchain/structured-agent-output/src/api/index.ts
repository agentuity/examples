/**
 * API routes for the structured output agent.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import structuredOutput from '@agent/structured-output';

const router = new Hono<Env>()
	.post('/chat', structuredOutput.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await structuredOutput.run(data));
	});

export default router;
