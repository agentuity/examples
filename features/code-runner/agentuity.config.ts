import type { AgentuityConfig } from '@agentuity/cli';
import tailwindcss from '@tailwindcss/vite';

export default {
	workbench: {
		route: '/workbench',
		headers: {},
	},
	plugins: [tailwindcss()],
} satisfies AgentuityConfig;
