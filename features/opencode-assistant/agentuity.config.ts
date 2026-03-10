import type { AgentuityConfig } from '@agentuity/cli';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default {
	/** Development UI for testing agents. Omit to disable. */
	workbench: {
		route: '/workbench',
		headers: {},
	},
	/** Vite plugins for the client build (src/web/). */
	plugins: [react(), tailwindcss()],
} satisfies AgentuityConfig;
