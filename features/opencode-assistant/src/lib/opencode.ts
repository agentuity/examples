// OpenCode SDK client wrapper and HTTP helpers.
// Uses @opencode-ai/sdk/client (same as coder-web-project) instead of raw fetch.

import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/client';

export type { OpencodeClient };

export interface OpenCodeProbeResult {
	ok: boolean;
	status: number | null;
	body?: string;
	error?: string;
}

/** Build a Basic auth header for OpenCode health checks and SSE. */
export function authHeader(password: string): string {
	return `Basic ${btoa(`opencode:${password}`)}`;
}

/** Create an OpenCode SDK client for a sandbox. */
export function getOpencodeClient(baseUrl: string, password: string): OpencodeClient {
	return createOpencodeClient({
		baseUrl,
		headers: { Authorization: authHeader(password) },
	});
}

function summarizeBody(text: string): string {
	const normalized = text.trim().replace(/\s+/g, ' ');
	return normalized.length > 300 ? `${normalized.slice(0, 300)}...` : normalized;
}

/** GET /global/health — returns detailed health probe information. */
export async function probeHealth(
	serverUrl: string,
	password: string
): Promise<OpenCodeProbeResult> {
	try {
		const resp = await fetch(`${serverUrl}/global/health`, {
			headers: { Authorization: authHeader(password) },
			signal: AbortSignal.timeout(5000),
		});
		const body = resp.ok ? undefined : summarizeBody(await resp.text());
		return { ok: resp.ok, status: resp.status, body };
	} catch (error) {
		return {
			ok: false,
			status: null,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/** GET /global/health — returns true if the OpenCode server is reachable and healthy. */
export function checkHealth(serverUrl: string, password: string): Promise<boolean> {
	return probeHealth(serverUrl, password).then((r) => r.ok);
}

/** GET /file?path=. — returns detailed workspace listing information. */
export async function probeWorkspaceFiles(
	serverUrl: string,
	password: string
): Promise<OpenCodeProbeResult & { fileCount?: number }> {
	try {
		const resp = await fetch(`${serverUrl}/file?path=.`, {
			headers: { Authorization: authHeader(password) },
			signal: AbortSignal.timeout(5000),
		});
		if (!resp.ok) {
			return {
				ok: false,
				status: resp.status,
				body: summarizeBody(await resp.text()),
			};
		}

		const files = (await resp.json()) as unknown[];
		return {
			ok: Array.isArray(files) && files.length > 0,
			status: resp.status,
			fileCount: Array.isArray(files) ? files.length : 0,
		};
	} catch (error) {
		return {
			ok: false,
			status: null,
			error: error instanceof Error ? error.message : 'Failed to list workspace files',
		};
	}
}

/** GET /file?path=. — returns true if the workspace has cloned repo content. */
export function checkWorkspaceFiles(serverUrl: string, password: string): Promise<boolean> {
	return probeWorkspaceFiles(serverUrl, password).then((r) => r.ok);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an OpenCode session with retry and exponential backoff.
 * Matches coder-web-project pattern: 5 attempts, 1s → 2s → 4s → 8s backoff.
 */
export async function createSession(serverUrl: string, password: string): Promise<string> {
	const client = getOpencodeClient(serverUrl, password);
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= 5; attempt++) {
		try {
			const resp = await client.session.create({ body: {} });
			const sessionId =
				(resp as any)?.data?.id ??
				(resp as any)?.id ??
				null;
			if (sessionId) return sessionId;
			lastError = new Error('No session ID in response');
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
		}
		if (attempt < 5) await sleep(1000 * Math.pow(2, attempt - 1));
	}

	throw lastError ?? new Error('Failed to create session after 5 attempts');
}

/**
 * Send a prompt to an OpenCode session (fire-and-forget).
 * Uses SDK client instead of raw fetch.
 */
export async function sendPrompt(
	serverUrl: string,
	password: string,
	sessionId: string,
	question: string
): Promise<void> {
	const client = getOpencodeClient(serverUrl, password);
	await client.session.promptAsync({
		path: { id: sessionId },
		body: { parts: [{ type: 'text', text: question }] },
	});
}
