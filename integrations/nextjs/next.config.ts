import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const currentDir = dirname(fileURLToPath(import.meta.url));
const agentuityProxyTarget = process.env.AGENTUITY_PROXY_TARGET
	?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3501' : undefined);

const nextConfig: NextConfig = {
	outputFileTracingRoot: resolve(currentDir, '../..'),
	async rewrites() {
		if (!agentuityProxyTarget) {
			return [];
		}

		return [
			{
				source: '/api/:path*',
				destination: `${agentuityProxyTarget}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
