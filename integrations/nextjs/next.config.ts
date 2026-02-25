import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	outputFileTracingRoot: resolve(currentDir, '../..'),
	async rewrites() {
		// Local mode: keep Next.js on :3001 and proxy API calls to Agentuity on :3501.
		// For cross-origin mode, skip this rewrite and pass NEXT_PUBLIC_AGENTUITY_BASE_URL to AgentuityProvider.
		return [
			{
				source: '/api/:path*',
				destination: 'http://localhost:3501/api/:path*',
			},
		];
	},
};

export default nextConfig;
