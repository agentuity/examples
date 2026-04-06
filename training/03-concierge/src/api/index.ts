import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import conciergeAgent from '@agent/concierge';
import conferenceAgent from '@agent/conference';
import sanfranciscoAgent from '@agent/sanfrancisco';
import developerAgent from '@agent/developer';

const router = new Hono<Env>()
	.post('/concierge', conciergeAgent.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await conciergeAgent.run(data);
		return c.json(result);
	})
	.post('/conference', conferenceAgent.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await conferenceAgent.run(data);
		return c.json(result);
	})
	.post('/sanfrancisco', sanfranciscoAgent.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await sanfranciscoAgent.run(data);
		return c.json(result);
	})
	.post('/developer', developerAgent.validator(), async (c) => {
		const data = c.req.valid('json');
		const result = await developerAgent.run(data);
		return c.json(result);
	});

export default router;
