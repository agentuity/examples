// OpenCode HTTP client helpers.
// Isolates all fetch() calls to the OpenCode server so api/index.ts
// can focus on Agentuity platform interactions (KV, sandbox, SSE).

/** Build a Basic auth header for the OpenCode server. */
export function authHeader(password: string): string {
	return `Basic ${btoa(`opencode:${password}`)}`;
}

/** GET /global/health — returns true if the OpenCode server is reachable and healthy. */
export async function checkHealth(serverUrl: string, password: string): Promise<boolean> {
	try {
		const resp = await fetch(`${serverUrl}/global/health`, {
			headers: { Authorization: authHeader(password) },
			signal: AbortSignal.timeout(5000),
		});
		return resp.ok;
	} catch {
		return false;
	}
}

/** POST /session — create a new OpenCode session, returns the session ID. */
export async function createSession(serverUrl: string, password: string): Promise<string> {
	const resp = await fetch(`${serverUrl}/session`, {
		method: 'POST',
		headers: {
			Authorization: authHeader(password),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({}),
		signal: AbortSignal.timeout(10000),
	});

	if (!resp.ok) {
		throw new Error(`Failed to create session: ${resp.status}`);
	}

	const data = (await resp.json()) as { id: string };
	return data.id;
}

/** GET /file?path=. — returns true if the workspace has cloned repo content. */
export async function checkWorkspaceFiles(serverUrl: string, password: string): Promise<boolean> {
	try {
		const resp = await fetch(`${serverUrl}/file?path=.`, {
			headers: { Authorization: authHeader(password) },
			signal: AbortSignal.timeout(5000),
		});
		if (!resp.ok) return false;
		const files = (await resp.json()) as unknown[];
		return Array.isArray(files) && files.length > 0;
	} catch {
		return false;
	}
}

/** POST /session/{id}/prompt_async — send a prompt to an existing session. */
export async function sendPrompt(
	serverUrl: string,
	password: string,
	sessionId: string,
	question: string
): Promise<void> {
	const resp = await fetch(`${serverUrl}/session/${sessionId}/prompt_async`, {
		method: 'POST',
		headers: {
			Authorization: authHeader(password),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			parts: [{ type: 'text', text: question }],
		}),
		signal: AbortSignal.timeout(10000),
	});

	if (!resp.ok) {
		throw new Error(`Failed to send prompt: ${resp.status}`);
	}
}
