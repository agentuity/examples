import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { Execution, Sandbox } from '@agentuity/core';
import type { AgentOutput, ExplorationStep, StreamEvent, VisitRecord } from '@lib/types';
import { normalizeUrl, screenshotKey } from '@lib/url';
import { getS3, s3ScreenshotUrl, KV_NAMESPACE, VECTOR_COLLECTION } from '@lib/storage';

// --- Public API ---

interface Logger {
	info(msg: string, meta?: Record<string, unknown>): void;
	warn(msg: string, meta?: Record<string, unknown>): void;
	error(msg: string, meta?: Record<string, unknown>): void;
	debug(msg: string, meta?: Record<string, unknown>): void;
}

interface KVService {
	get<T = unknown>(namespace: string, key: string): Promise<{ exists: boolean; data: T }>;
	set(namespace: string, key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
}

interface VectorService {
	search(
		collection: string,
		options: { query: string; limit: number; similarity: number },
	): Promise<Array<{ metadata?: Record<string, unknown>; document?: string }>>;
	upsert(
		collection: string,
		params: { key: string; document: string; metadata: Record<string, unknown> },
	): Promise<Array<{ id: string }>>;
}

interface SandboxService {
	create(config: {
		runtime: string;
		network?: { enabled: boolean };
		resources?: { memory: string; cpu: string };
		timeout?: { idle: string; execution: string };
	}): Promise<Sandbox>;
}

export interface ExplorerContext {
	logger: Logger;
	kv: KVService;
	vector: VectorService;
	sandbox: SandboxService;
}

export interface ExploreOptions {
	url: string;
	maxSteps?: number;
	onStep?: (event: StreamEvent) => Promise<void>;
}

const ACTION_SCHEMA = z.object({
	command: z
		.array(z.string())
		.describe('Agent-browser command, e.g. ["click", "@e5"] or ["open", "https://example.com/about"]'),
	reason: z.string().describe('Why this action is interesting'),
});

const COMMAND_REFERENCE = `Available commands:
- click <ref>      Click an element, e.g. ["click", "@e5"]
- hover <ref>      Hover over an element
- scroll down|up   Scroll the page
- type <ref> <text> Type text into an input, e.g. ["type", "@e3", "search query"]
- open <url>       Navigate to a URL directly
- back             Go back in browser history
- forward          Go forward in browser history
- wait <ms>        Wait for a duration in milliseconds
- get title        Get the current page title
- get url          Get the current page URL`;

export async function explore(ctx: ExplorerContext, options: ExploreOptions): Promise<AgentOutput> {
	const maxSteps = options.maxSteps ?? 4;
	const steps: ExplorationStep[] = [];
	let pageTitle = '';

	ctx.logger.info('Starting web exploration', { url: options.url, maxSteps });

	const sandbox: Sandbox = await ctx.sandbox.create({
		runtime: 'agent-browser:latest',
		network: { enabled: true },
		resources: { memory: '1Gi', cpu: '1000m' },
		timeout: { idle: '10m', execution: '30s' },
	});

	try {
		// Load past visit context from vector store for diversity
		const pastContext = await loadPastVisits(ctx, options.url);

		// Step 1: Open URL and capture initial state
		ctx.logger.info('Opening URL', { url: options.url });
		await exec(sandbox, ['agent-browser', 'open', options.url]);
		await exec(sandbox, ['agent-browser', 'wait', '--load', 'networkidle']);

		const titleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
		pageTitle = (await getStdout(titleExec)).trim() || options.url;

		// Take and upload initial screenshot
		const initialScreenshot = await captureAndUpload(ctx, sandbox, options.url, 'step-1.png');

		// Get accessibility tree for initial observation
		const snapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
		const accessibilityTree = await getStdout(snapshotExec);

		// Emit preview immediately so the user sees the screenshot while the LLM thinks
		await emitPreview(options, {
			stepNumber: 1,
			screenshotUrl: initialScreenshot.screenshotUrl,
			action: `Opened ${options.url}`,
			pageUrl: options.url,
			cached: initialScreenshot.cached,
		});

		const { text: initialObservation } = await generateText({
			model: openai('gpt-5-nano'),
			prompt: `You are observing the Agentuity SDK Explorer page. Describe the interactive demos and sections you see in 1-2 sentences.\n\nPage URL: ${options.url}\nPage title: ${pageTitle}\n\nAccessibility tree:\n${accessibilityTree.slice(0, 4000)}`,
		});

		const firstStep: ExplorationStep = {
			stepNumber: 1,
			screenshotUrl: initialScreenshot.screenshotUrl,
			action: `Opened ${options.url}`,
			observation: initialObservation,
			pageUrl: options.url,
			cached: initialScreenshot.cached,
		};
		steps.push(firstStep);
		await storeVisit(ctx, options.url, pageTitle, initialScreenshot.key, initialObservation);
		await emitStep(options, firstStep);

		ctx.logger.info('Initial page captured', { title: pageTitle, step: 1 });

		// Exploration loop: LLM picks actions, we execute them
		for (let i = 2; i <= maxSteps; i++) {
			try {
				ctx.logger.info('Starting exploration step', { step: i });

				const currentSnapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
				const currentTree = await getStdout(currentSnapshotExec);

				const { output: nextAction } = await generateText({
					model: openai('gpt-5-nano'),
					output: Output.object({ schema: ACTION_SCHEMA }),
					prompt: `You are exploring the Agentuity SDK Explorer at agentuity.dev. This page has interactive demos and runnable code examples.

${COMMAND_REFERENCE}

Focus on:
- Scrolling to discover demo cards on the main page before navigating away
- Clicking "Run" buttons to try sandbox demos
- Exploring different sections (Basics, Services, I/O Patterns) on the main page

Avoid navigating to deep documentation pages. Stay on interactive content.

${pastContext ? `You've visited these pages before. Try to explore different areas:\n${pastContext}\n` : ''}
Previous steps taken:
${steps.map((s) => `- Step ${s.stepNumber}: ${s.action} => ${s.observation}`).join('\n')}

Current accessibility tree:
${currentTree.slice(0, 4000)}

Choose ONE action to take next.`,
				});

				ctx.logger.info('LLM chose action', { step: i, command: nextAction.command, reason: nextAction.reason });

				// Execute the chosen command
				const actionDescription = await executeCommand(sandbox, nextAction.command, nextAction.reason);

				// Wait for page transitions
				await exec(sandbox, ['agent-browser', 'wait', '--load', 'networkidle']);

				// Resolve the current page URL after action
				const urlExec = await exec(sandbox, ['agent-browser', 'get', 'url']);
				const currentUrl = (await getStdout(urlExec)).trim() || options.url;
				const normalizedCurrentUrl = normalizeUrl(currentUrl);

				// Always re-capture the starting page to show current state; use cache for other pages
				const isStartingUrl = normalizedCurrentUrl === normalizeUrl(options.url);
				const cached = !isStartingUrl ? await checkKvCache(ctx, normalizedCurrentUrl) : null;

				let screenshotResult: ScreenshotResult;
				if (cached) {
					ctx.logger.debug('Using cached screenshot', { url: currentUrl });
					screenshotResult = { screenshotUrl: cached.screenshotUrl, key: cached.key, cached: true };
				} else {
					screenshotResult = await captureAndUpload(ctx, sandbox, currentUrl, `step-${i}.png`);
				}

				// Emit preview immediately so the user sees the screenshot while the LLM thinks
				await emitPreview(options, {
					stepNumber: i,
					screenshotUrl: screenshotResult.screenshotUrl,
					action: actionDescription,
					pageUrl: currentUrl,
					cached: screenshotResult.cached,
					elementRef: nextAction.command[1],
				});

				// Observe the new state
				const newSnapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
				const newTree = await getStdout(newSnapshotExec);

				const { text: observation } = await generateText({
					model: openai('gpt-5-nano'),
					prompt: `You are observing a web page after performing an action. Describe what changed or what you now see in 1-2 sentences.\n\nAction taken: ${actionDescription}\n\nNew accessibility tree:\n${newTree.slice(0, 4000)}`,
				});

				const step: ExplorationStep = {
					stepNumber: i,
					screenshotUrl: screenshotResult.screenshotUrl,
					action: actionDescription,
					observation,
					pageUrl: currentUrl,
					cached: screenshotResult.cached,
					elementRef: nextAction.command[1],
				};
				steps.push(step);

				// Get title for storage
				const stepTitleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
				const stepTitle = (await getStdout(stepTitleExec)).trim() || currentUrl;
				await storeVisit(ctx, normalizedCurrentUrl, stepTitle, screenshotResult.key, observation);
				await emitStep(options, step);

				ctx.logger.info('Step completed', { step: i, observation });
			} catch (stepError) {
				ctx.logger.warn('Step failed, continuing', { step: i, error: String(stepError) });
			}
		}

		// Generate final summary
		const { text: summary } = await generateText({
			model: openai('gpt-5-nano'),
			prompt: `Summarize what was discovered during this web exploration in 2-3 sentences.\n\nURL: ${options.url}\nSteps taken:\n${steps.map((s) => `${s.stepNumber}. ${s.action} => ${s.observation}`).join('\n')}`,
		});

		ctx.logger.info('Exploration complete', { url: options.url, totalSteps: steps.length });

		// Emit summary and done events
		if (options.onStep) {
			await options.onStep({ type: 'summary', summary, title: pageTitle, url: options.url });
			await options.onStep({ type: 'done' });
		}

		return { url: options.url, title: pageTitle, steps, summary };
	} catch (error) {
		ctx.logger.error('Exploration error, returning partial results', { error: String(error), stepsCompleted: steps.length });
		if (options.onStep) {
			await options.onStep({ type: 'error', message: String(error) });
		}
		return {
			url: options.url,
			title: pageTitle || 'Failed to explore',
			steps,
			summary: `Exploration encountered an error after ${steps.length} step(s): ${String(error)}`,
		};
	} finally {
		await sandbox.destroy();
		ctx.logger.info('Sandbox destroyed');
	}
}

// --- Internal Helpers ---

interface ScreenshotResult {
	screenshotUrl: string;
	key: string;
	cached?: boolean;
}

async function exec(sandbox: Sandbox, command: string[]): Promise<Execution> {
	return sandbox.execute({ command });
}

async function getStdout(execution: Execution): Promise<string> {
	if (!execution.stdoutStreamUrl) return '';
	const response = await fetch(execution.stdoutStreamUrl);
	if (!response.ok) return '';
	return response.text();
}

async function getStderr(execution: Execution): Promise<string> {
	if (!execution.stderrStreamUrl) return '';
	const response = await fetch(execution.stderrStreamUrl);
	if (!response.ok) return '';
	return response.text();
}

/** Take a screenshot, read it via stdout (bypasses /fs/ endpoint), upload to S3 or fall back to base64. */
async function captureAndUpload(
	ctx: ExplorerContext,
	sandbox: Sandbox,
	pageUrl: string,
	filename: string,
): Promise<ScreenshotResult> {
	const screenshotExec = await exec(sandbox, ['agent-browser', 'screenshot', filename]);
	ctx.logger.debug('Screenshot execution result', {
		filename,
		exitCode: screenshotExec.exitCode,
		status: screenshotExec.status,
		executionId: screenshotExec.executionId,
	});
	if (screenshotExec.exitCode != null && screenshotExec.exitCode !== 0) {
		const stderr = await getStderr(screenshotExec);
		ctx.logger.error('Screenshot command failed', { filename, exitCode: screenshotExec.exitCode, stderr });
		throw new Error(`Screenshot failed (exit ${screenshotExec.exitCode}): ${stderr}`);
	}

	// Read the screenshot via base64-encoded stdout instead of sandbox.readFile (avoids /fs/ endpoint)
	const b64Exec = await exec(sandbox, ['base64', filename]);
	ctx.logger.debug('Base64 read result', {
		filename,
		exitCode: b64Exec.exitCode,
		status: b64Exec.status,
	});
	if (b64Exec.exitCode != null && b64Exec.exitCode !== 0) {
		const stderr = await getStderr(b64Exec);
		ctx.logger.error('Failed to read screenshot', { filename, exitCode: b64Exec.exitCode, stderr });
		throw new Error(`Failed to read screenshot (exit ${b64Exec.exitCode}): ${stderr}`);
	}

	const base64 = (await getStdout(b64Exec)).trim();
	const buffer = Buffer.from(base64, 'base64');
	const key = screenshotKey(pageUrl);

	const s3 = getS3();
	if (s3) {
		try {
			await s3.file(key).write(buffer);
			return { screenshotUrl: s3ScreenshotUrl(key), key };
		} catch (err) {
			ctx.logger.warn('S3 upload failed, falling back to data URI', { error: String(err) });
		}
	}
	return { screenshotUrl: `data:image/png;base64,${base64}`, key: '' };
}

/** Execute an agent-browser command from the LLM's structured output. */
async function executeCommand(sandbox: Sandbox, command: string[], reason: string): Promise<string> {
	const [verb, ...args] = command;
	const label = command.join(' ');

	switch (verb) {
		case 'click':
		case 'hover':
			await exec(sandbox, ['agent-browser', verb, args[0]!]);
			return `${verb === 'click' ? 'Clicked' : 'Hovered'} ${args[0]} (${reason})`;

		case 'scroll':
			await exec(sandbox, ['agent-browser', 'scroll', args[0] ?? 'down']);
			return `Scrolled ${args[0] ?? 'down'} (${reason})`;

		case 'type':
			await exec(sandbox, ['agent-browser', 'type', args[0]!, args.slice(1).join(' ')]);
			return `Typed "${args.slice(1).join(' ')}" into ${args[0]} (${reason})`;

		case 'open':
			await exec(sandbox, ['agent-browser', 'open', args[0]!]);
			return `Navigated to ${args[0]} (${reason})`;

		case 'back':
			await exec(sandbox, ['agent-browser', 'back']);
			return `Went back (${reason})`;

		case 'forward':
			await exec(sandbox, ['agent-browser', 'forward']);
			return `Went forward (${reason})`;

		case 'wait':
			await exec(sandbox, ['sleep', String(Math.min(Number(args[0]) / 1000, 5))]);
			return `Waited ${args[0]}ms (${reason})`;

		default:
			await exec(sandbox, ['agent-browser', ...command]);
			return `Executed ${label} (${reason})`;
	}
}

/** Load past visit summaries from vector store for exploration diversity. */
async function loadPastVisits(ctx: ExplorerContext, url: string): Promise<string | null> {
	try {
		const domain = new URL(url).hostname;
		const results = await ctx.vector.search(VECTOR_COLLECTION, { query: domain, limit: 5, similarity: 0.3 });
		if (!results?.length) return null;
		return results.map((r: any) => `- ${r.metadata?.url ?? 'unknown'}: ${r.document?.slice(0, 120)}`).join('\n');
	} catch (err) {
		ctx.logger.warn('Vector search failed', { error: String(err) });
		return null;
	}
}

/** Check KV cache for a recently visited page (within 24h). */
async function checkKvCache(
	ctx: ExplorerContext,
	normalizedUrl: string,
): Promise<{ screenshotUrl: string; key: string } | null> {
	try {
		const result = await ctx.kv.get(KV_NAMESPACE, `visit:${normalizedUrl}`);
		if (!result.exists) return null;
		const record = result.data as VisitRecord;
		return { screenshotUrl: s3ScreenshotUrl(record.screenshotKey), key: record.screenshotKey };
	} catch {
		return null;
	}
}

/** Persist visit data to KV (24h TTL) and vector store. */
async function storeVisit(
	ctx: ExplorerContext,
	url: string,
	title: string,
	screenshotKey: string,
	observation: string,
): Promise<void> {
	const normalizedUrl = normalizeUrl(url);
	const kvKey = `visit:${normalizedUrl}`;
	const record: VisitRecord = { url, title, visitedAt: new Date().toISOString(), screenshotKey, observation };

	if (screenshotKey) {
		try {
			await ctx.kv.set(KV_NAMESPACE, kvKey, record, { ttl: 86400 });
		} catch (err) {
			ctx.logger.warn('KV write failed', { error: String(err) });
		}
	}

	try {
		await ctx.vector.upsert(VECTOR_COLLECTION, {
			key: kvKey,
			document: observation,
			metadata: { url, title, visitedAt: record.visitedAt, ...(screenshotKey ? { screenshotKey } : {}) },
		});
	} catch (err) {
		ctx.logger.warn('Vector upsert failed', { error: String(err) });
	}
}

/** Emit a preview event (screenshot ready, observation pending). */
async function emitPreview(
	options: ExploreOptions,
	preview: {
		stepNumber: number;
		screenshotUrl: string;
		action: string;
		pageUrl?: string;
		cached?: boolean;
		elementRef?: string;
	},
): Promise<void> {
	if (options.onStep) {
		await options.onStep({ type: 'preview', ...preview });
	}
}

/** Emit a step event to the streaming callback. */
async function emitStep(options: ExploreOptions, step: ExplorationStep): Promise<void> {
	if (options.onStep) {
		await options.onStep({ type: 'step', step });
	}
}
