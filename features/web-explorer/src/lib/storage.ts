import { S3Client } from 'bun';

let _s3: S3Client | null = null;
let _s3Checked = false;

/** Lazy-initialized S3 client. Returns null if env vars are missing. */
export function getS3(): S3Client | null {
	if (_s3Checked) return _s3;
	_s3Checked = true;

	const required = ['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET', 'S3_ENDPOINT'] as const;
	const missing = required.filter((k) => !process.env[k]);
	if (missing.length) {
		console.warn(`[storage] Missing S3 env vars: ${missing.join(', ')} — screenshots will use base64 fallback`);
		return null;
	}

	_s3 = new S3Client({
		accessKeyId: process.env.S3_ACCESS_KEY_ID!,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
		bucket: process.env.S3_BUCKET!,
		endpoint: process.env.S3_ENDPOINT!,
	});
	return _s3;
}

/** Build a full S3 URL for a screenshot key. */
export function s3ScreenshotUrl(key: string): string {
	const endpoint = process.env.S3_ENDPOINT ?? '';
	const bucket = process.env.S3_BUCKET ?? '';
	// Agentuity storage uses virtual-hosted-style URLs
	return `${endpoint}/${bucket}/${key}`;
}

export const SCREENSHOTS_PREFIX = 'web-explorer';
export const KV_NAMESPACE = 'web-explorer';
export const VECTOR_COLLECTION = 'web-explorations';
