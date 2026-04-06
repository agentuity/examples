/**
 * API routes for the agent network.
 * Routes expose the network agent and individual agents for direct access.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';

import network from '../agent/network';
import research from '../agent/research';
import writing from '../agent/writing';

const router = new Hono<Env>()

// ============================================
// Network Agent Routes (Agent Network Pattern)
// ============================================

// Main network endpoint - routes to appropriate agents/tools/workflows
.post('/network', network.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await network.run(data));
})

// Get network conversation history
.get(
	'/network/history',
	validator({
		output: s.object({
			conversation: s.array(s.object({ role: s.string(), content: s.string() })),
			threadId: s.string(),
		}),
	}),
	async (c) => {
		const conversation =
			(await c.var.thread.state.get<Array<{ role: string; content: string }>>('conversation')) ?? [];
		return c.json({
			conversation,
			threadId: c.var.thread.id,
		});
	}
)

// Clear network conversation history
.delete(
	'/network/history',
	validator({
		output: s.object({
			conversation: s.array(s.any()),
			threadId: s.string(),
		}),
	}),
	async (c) => {
		await c.var.thread.state.delete('conversation');
		return c.json({
			conversation: [],
			threadId: c.var.thread.id,
		});
	}
)

// ============================================
// Individual Agent Routes (Direct Access)
// ============================================

// Research agent - get bullet-point insights
.post('/research', research.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await research.run(data));
})

// Writing agent - generate written content
.post('/writing', writing.validator(), async (c) => {
	const data = c.req.valid('json');
	return c.json(await writing.run(data));
});

export default router;
