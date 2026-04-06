/**
 * API routes for the system prompt agent.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import systemPrompt from '@agent/system-prompt';

const router = new Hono<Env>()
	.post('/chat', systemPrompt.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await systemPrompt.run(data));
	});

export default router;
