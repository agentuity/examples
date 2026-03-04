import { createApp } from '@agentuity/runtime';

const { server, logger } = await createApp({
	setup: async () => {},
	shutdown: async () => {},
});

logger.debug('Running %s', server.url);
