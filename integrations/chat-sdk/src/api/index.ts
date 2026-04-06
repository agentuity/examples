/**
 * API routes for the chat-sdk integration.
 * Exposes a /health endpoint and a /webhooks/:platform handler that
 * dispatches incoming platform webhooks (Slack, Discord) to the bot.
 */

import { Hono } from 'hono';
import type { Env } from '@agentuity/runtime';
import { bot } from '@lib/bot';

const router = new Hono<Env>()
	// Health check
	.get('/health', (c) => {
		return c.json({ status: 'ok', timestamp: new Date().toISOString() });
	})
	// Webhook handler for all platforms
	// Each platform sends webhooks to /api/webhooks/:platform
	.all('/webhooks/:platform', async (c) => {
		const platform = c.req.param('platform');
		const request = c.req.raw;

		const webhookHandler = bot.webhooks[platform as keyof typeof bot.webhooks];

		if (!webhookHandler) {
			return c.json({ error: `Unknown platform: ${platform}` }, 404);
		}

		return await webhookHandler(request, {
			waitUntil: (promise) => {
				c.waitUntil(async () => {
					await promise.catch((err) => {
						c.var.logger.error(`Webhook processing error (${platform})`, { error: err });
					});
				});
			},
		});
	});

export default router;
