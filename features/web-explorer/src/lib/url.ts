/** Normalize a URL: lowercase hostname, strip trailing slashes, remove hash fragments, keep query params. */
export function normalizeUrl(raw: string): string {
	const url = new URL(raw);
	url.hash = '';
	// Lowercase hostname (URL constructor already does this, but be explicit)
	let normalized = `${url.protocol}//${url.hostname}`;
	if (url.port) normalized += `:${url.port}`;
	// Remove trailing slash from pathname unless it's the root
	const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
	normalized += pathname;
	if (url.search) normalized += url.search;
	return normalized;
}

/** Generate an S3-safe key for a screenshot. */
export function screenshotKey(url: string, timestamp?: number): string {
	const parsed = new URL(url);
	const domain = parsed.hostname;
	// Convert pathname to slug: /docs/getting-started → docs-getting-started
	const pathSlug =
		parsed.pathname
			.replace(/^\/+|\/+$/g, '')
			.replace(/\//g, '-')
			.replace(/[^a-zA-Z0-9-]/g, '') || 'root';
	const ts = timestamp ?? Date.now();
	return `web-explorer/${domain}/${pathSlug}-${ts}.png`;
}
