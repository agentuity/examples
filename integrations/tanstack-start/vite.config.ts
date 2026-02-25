import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		devtools(),
		tsconfigPaths({ projects: ['./tsconfig.json'] }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3500',
				changeOrigin: true,
			},
		},
	},
	ssr: {
		noExternal: [/^@agentuity\//],
	},
	test: {
		environment: 'jsdom',
	},
});
