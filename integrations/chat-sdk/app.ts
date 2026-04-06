import { createApp, registerShutdownHook } from '@agentuity/runtime';
import { bot } from '@lib/bot';
import agents from './src/agent';
import router from './src/api';

const app = await createApp({
	agents,
	router,
});

// Discord Gateway: receives messages over WebSocket and forwards them to the
// local webhook endpoint. Agentuity's persistent runtime keeps the connection
// alive without needing a cron job to restart it.
if (
	process.env.DISCORD_BOT_TOKEN &&
	process.env.DISCORD_PUBLIC_KEY &&
	process.env.DISCORD_APPLICATION_ID
) {
	registerShutdownHook(async () => { await bot.shutdown(); });
	await bot.initialize();
	const discord = bot.getAdapter('discord');

	if (discord) {
		const webhookUrl = `${app.server.url}/api/webhooks/discord`;
		const abortController = new AbortController();
		const DURATION = 24 * 60 * 60 * 1000; // 24 hours

		const startListener = () => {
			app.logger.info('Starting Discord Gateway listener', { webhookUrl });
			discord.startGatewayListener(
				{
					waitUntil: (promise) => {
						promise
							.then(() => {
								if (!abortController.signal.aborted) {
									app.logger.info('Gateway listener expired, restarting');
									startListener();
								}
							})
							.catch((err) => {
								app.logger.error('Gateway listener error', { error: String(err) });
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

export default app;
