import { createApp } from '@agentuity/runtime';

// sameOrigin: true automatically trusts platform-set origins (AGENTUITY_CLOUD_DOMAINS),
// the deployment base URL, and same-origin requests. For additional custom domains,
// set AUTH_TRUSTED_DOMAINS in your environment. To allow all origins instead (useful
// during development), omit the cors option entirely.
const { server, logger } = await createApp({
	cors: { sameOrigin: true },
});

logger.debug('Running %s', server.url);
