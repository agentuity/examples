/**
 * API routes for the day planner agent.
 * Routes handle state operations (get/clear history); the agent handles planning.
 */

import { createRouter, validator } from '@agentuity/runtime';
import dayPlanner, { AgentOutput, type HistoryEntry } from '../agent/day-planner';

const api = createRouter();

// State subset for history endpoints (derived from AgentOutput)
export const StateSchema = AgentOutput.pick(['history', 'threadId']);

// Call the agent to create a plan
api.post('/plan', dayPlanner.validator(), async (c) => {
	const data = c.req.valid('json');

	return c.json(await dayPlanner.run(data));
});

// Retrieve planning history
api.get('/plan/history', validator({ output: StateSchema }), async (c) => {
	const history = (await c.var.thread.state.get<HistoryEntry[]>('history')) ?? [];

	return c.json({
		history,
		threadId: c.var.thread.id,
	});
});

// Clear planning history
api.delete('/plan/history', validator({ output: StateSchema }), async (c) => {
	await c.var.thread.state.delete('history');

	return c.json({
		history: [],
		threadId: c.var.thread.id,
	});
});

export default api;
