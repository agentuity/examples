import { createApp } from '@agentuity/runtime';

// sameOrigin: true automatically trusts platform-set origins (AGENTUITY_CLOUD_DOMAINS),
// the deployment base URL, and same-origin requests. For additional custom domains,
// set AUTH_TRUSTED_DOMAINS in your environment. To allow all origins instead (useful
// during development), omit the cors option entirely.
const app = await createApp({
	cors: { sameOrigin: true },
});

app.logger.info(`[TanStackStart-Agentuity] Server started: ${app.server.url}`);

export default app;
