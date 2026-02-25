const HEALTH_URL = 'http://127.0.0.1:3501/api/health';
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 30000;
const REQUEST_TIMEOUT_MS = 2000;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const checkHealth = async () => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(HEALTH_URL, {
			method: 'GET',
			signal: controller.signal,
		});

		if (response.ok) {
			return { healthy: true };
		}

		return { healthy: false, reason: `HTTP ${response.status}` };
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return { healthy: false, reason: 'request timed out' };
		}

		return {
			healthy: false,
			reason: error instanceof Error ? error.message : String(error),
		};
	} finally {
		clearTimeout(timeoutId);
	}
};

const startTime = Date.now();
let lastFailureReason = 'no response';

while (Date.now() - startTime < MAX_WAIT_MS) {
	const result = await checkHealth();

	if (result.healthy) {
		process.exit(0);
	}

	lastFailureReason = result.reason ?? lastFailureReason;
	await wait(POLL_INTERVAL_MS);
}

console.error(
	`[wait:agent] Timed out after ${MAX_WAIT_MS}ms waiting for Agentuity health at ${HEALTH_URL}. Last failure: ${lastFailureReason}.`,
);
process.exit(1);
