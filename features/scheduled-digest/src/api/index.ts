import { createRouter, cron, validator } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import digestGenerator from '@agent/digest-generator';
import { fetchAllSources } from '@lib/sources';
import type { DigestEntry } from '@lib/types';

const api = createRouter();

// Schema for digest responses
export const DigestResponseSchema = s.object({
	exists: s.boolean(),
	digest: s
		.object({
			title: s.string(),
			summary: s.string(),
			streamUrl: s.string(),
			streamId: s.string(),
			date: s.string(),
			itemCount: s.number(),
		})
		.optional(),
});

export const HistoryResponseSchema = s.object({
	digests: s.array(
		s.object({
			title: s.string(),
			summary: s.string(),
			streamUrl: s.string(),
			streamId: s.string(),
			date: s.string(),
			itemCount: s.number(),
		}),
	),
});

export const TriggerResponseSchema = s.object({
	status: s.string(),
	digest: s
		.object({
			title: s.string(),
			summary: s.string(),
			streamUrl: s.string(),
			streamId: s.string(),
			date: s.string(),
			itemCount: s.number(),
		})
		.optional(),
	error: s.string().optional(),
});

// Helper: run the full digest pipeline
async function generateDigest(c: { var: { logger: any; kv: any; stream: any } }) {
	const { logger, kv, stream } = c.var;

	logger.info('Fetching content from sources');
	const sourceData = await fetchAllSources();

	logger.info('Calling digest-generator agent', {
		sources: sourceData.map((src) => src.name),
	});
	const digest = await digestGenerator.run({
		sources: sourceData,
		date: new Date().toISOString(),
	});

	// Publish to a durable stream (permanent URL)
	logger.info('Publishing to durable stream');
	const durableStream = await stream.create('digest', {
		contentType: 'text/html',
		compress: true,
		metadata: {
			date: new Date().toISOString(),
			itemCount: String(digest.itemCount),
		},
		ttl: null, // Permanent
	});
	await durableStream.write(digest.htmlContent);
	await durableStream.close();

	// Build entry for KV storage
	const entry: DigestEntry = {
		title: digest.title,
		summary: digest.summary,
		streamUrl: durableStream.url,
		streamId: durableStream.id,
		date: new Date().toISOString(),
		itemCount: digest.itemCount,
	};

	// Store as "latest" and as date-keyed entry
	// 30-day TTL; history is rebuilt from date-keyed entries
	await kv.set('digests', 'latest', entry, { ttl: 86400 * 30 });
	await kv.set('digests', `digest-${Date.now()}`, entry, { ttl: 86400 * 30 });

	// Update the history index
	const keys = await kv.getKeys('digests');
	const historyKeys = keys
		.filter((k: string) => k.startsWith('digest-'))
		.sort()
		.reverse()
		.slice(0, 20);
	await kv.set('digests', 'history', historyKeys, { ttl: 86400 * 30 });

	logger.info('Digest published', { url: durableStream.url, items: digest.itemCount });

	return entry;
}

// Cron: runs every hour in deployed environments
api.post(
	'/digest',
	cron('0 * * * *', { auth: true }, async (c) => {
		c.var.logger.info('Cron triggered: generating digest');

		await generateDigest(c);

		return c.text('OK');
	}),
);

// Manual trigger (for testing / demo "run now" button)
api.post('/digest/now', validator({ output: TriggerResponseSchema }), async (c) => {
	c.var.logger.info('Manual trigger: generating digest');

	try {
		const entry = await generateDigest(c);
		return c.json({ status: 'ok', digest: entry });
	} catch (err) {
		c.var.logger.error('Failed to generate digest', { error: err });
		return c.json({ status: 'error', error: String(err) });
	}
});

// GET: Frontend fetches the latest digest
api.get('/digests/latest', validator({ output: DigestResponseSchema }), async (c) => {
	const result = await c.var.kv.get<DigestEntry>('digests', 'latest');
	if (!result.exists) {
		return c.json({ exists: false });
	}
	return c.json({ exists: true, digest: result.data });
});

// GET: Frontend fetches digest history
api.get('/digests/history', validator({ output: HistoryResponseSchema }), async (c) => {
	const historyResult = await c.var.kv.get<string[]>('digests', 'history');
	if (!historyResult.exists) {
		return c.json({ digests: [] });
	}

	const digests = await Promise.all(
		historyResult.data.map(async (key) => {
			const result = await c.var.kv.get<DigestEntry>('digests', key);
			return result.exists ? result.data : null;
		}),
	);

	return c.json({ digests: digests.filter((d): d is DigestEntry => d !== null) });
});

export default api;
