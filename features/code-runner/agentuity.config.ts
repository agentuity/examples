import type { AgentuityConfig } from '@agentuity/cli';
import tailwindcss from '@tailwindcss/vite';

export default {
	/** Development UI for testing agents. Omit to disable. */
	workbench: {
		route: '/workbench',
		headers: {},
	},
	/** Vite plugins for the client build (src/web/). */
	plugins: [tailwindcss()],
} satisfies AgentuityConfig;
