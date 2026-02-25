import type { AgentuityConfig } from '@agentuity/cli';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default {
	workbench: {
		route: '/workbench',
		headers: {},
	},
	plugins: [react(), tailwindcss()],
} satisfies AgentuityConfig;
