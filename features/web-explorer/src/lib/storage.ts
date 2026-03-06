import { s3 } from 'bun';

export async function uploadScreenshot(key: string, buffer: Buffer): Promise<string> {
	try {
		const file = s3.file(key);
		await file.write(buffer, { type: 'image/png' });
		return file.presign({ expiresIn: 86400 });
	} catch {
		return `data:image/png;base64,${buffer.toString('base64')}`;
	}
}

export function screenshotPresignedUrl(key: string): string {
	try {
		return s3.file(key).presign({ expiresIn: 86400 });
	} catch {
		return '';
	}
}

export const SCREENSHOTS_PREFIX = 'web-explorer';
export const KV_NAMESPACE = 'web-explorer';
