import { createApp, registerShutdownHook } from '@agentuity/runtime';
import { bot } from '@lib/bot';

const { server, logger } = await createApp({
	setup: async () => {
		// anything you return from this will be automatically
		// available in the ctx.app. this allows you to initialize
		// global resources and make them available to routes and
		// agents in a typesafe way
	},
	shutdown: async (_state) => {
		await bot.shutdown();
	},
});

logger.debug('Running %s', server.url);

// Discord Gateway: receives messages over WebSocket and forwards them to the
// local webhook endpoint. Agentuity's persistent runtime keeps the connection
// alive without needing a cron job to restart it.
if (
	process.env.DISCORD_BOT_TOKEN &&
	process.env.DISCORD_PUBLIC_KEY &&
	process.env.DISCORD_APPLICATION_ID
) {
	await bot.initialize();
	const discord = bot.getAdapter('discord');

	if (discord) {
		const webhookUrl = `http://127.0.0.1:${process.env.PORT || '3500'}/api/webhooks/discord`;
		const abortController = new AbortController();
		const DURATION = 24 * 60 * 60 * 1000; // 24 hours

		const startListener = () => {
			logger.info('Starting Discord Gateway listener', { webhookUrl });
			discord.startGatewayListener(
				{
					waitUntil: (promise) => {
						promise
							.then(() => {
								if (!abortController.signal.aborted) {
									logger.info('Gateway listener expired, restarting');
									startListener();
								}
							})
							.catch((err) => {
								logger.error('Gateway listener error', { error: String(err) });
								if (!abortController.signal.aborted) startListener();
							});
					},
				},
				DURATION,
				abortController.signal,
				webhookUrl,
			);
		};

		startListener();
		registerShutdownHook(() => abortController.abort());
	}
}
