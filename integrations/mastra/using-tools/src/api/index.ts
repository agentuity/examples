/**
 * API routes for agents with tools.
 * Demonstrates how to expose agents that use Mastra tool calling as APIs.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import weather from '@agent/weather';
import activities from '@agent/activities';

const router = new Hono<Env>()
	.post('/weather', weather.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await weather.run(data));
	})
	.post('/activities', activities.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await activities.run(data));
	})
	.get('/health', async (c) => {
		return c.json({ status: 'ok', agents: ['weather', 'activities'] });
	});

export default router;
