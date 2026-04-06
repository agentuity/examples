/**
 * API routes for the day planner agent.
 * Routes handle state operations (get/clear history); the agent handles planning.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import dayPlanner, { type HistoryEntry } from '@agent/day-planner';

const router = new Hono<Env>()
	.post('/plan', dayPlanner.validator(), async (c) => {
		const data = c.req.valid('json');
		return c.json(await dayPlanner.run(data));
	})
	.get('/plan/history', async (c) => {
		const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];
		return c.json({
			history,
			threadId: c.var.thread.id,
		});
	})
	.delete('/plan/history', async (c) => {
		await c.var.thread.state.delete('history');
		return c.json({
			history: [],
			threadId: c.var.thread.id,
		});
	});

export default router;
