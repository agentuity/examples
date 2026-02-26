import { createApp, createTrustedCorsOrigin } from '@agentuity/runtime';

const allowedOrigins = process.env.AGENTUITY_CORS_ALLOWED_ORIGINS?.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

const app = await createApp({
	cors: {
		origin: createTrustedCorsOrigin({
			allowedOrigins,
		}),
		sameOrigin: true,
		allowedOrigins: allowedOrigins?.length ? allowedOrigins : undefined,
	},
});

app.logger.info(`[TanStackStart-Agentuity] Server started: ${app.server.url}`);

export default app;
