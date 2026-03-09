import { generateText, tool, stepCountIs, hasToolCall } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { Execution, Sandbox } from '@agentuity/core';
import type {
	AgentOutput,
	ExplorationStep,
	MemoryVisit,
	StreamEvent,
	VisitRecord,
} from '@agent/web-explorer/types';
import { normalizeUrl, screenshotKey } from '@lib/url';
import { uploadScreenshot, screenshotPresignedUrl, KV_NAMESPACE } from '@lib/storage';
import { TARGETS } from '@lib/targets';

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
	sandbox: SandboxService;
}

export interface ExploreOptions {
	url: string;
	maxSteps?: number;
	onStep?: (event: StreamEvent) => Promise<void>;
	abortSignal?: AbortSignal;
}

const VISIT_TTL = 86400;
const DOMAIN_INDEX_TTL = 86400 * 7;
const MAX_ACTIONS_STORED = 8;

// --- System Prompt ---

function buildSystemPrompt(url: string, hints?: string): string {
	let prompt = `You are an autonomous web explorer. Your goal is to understand what a site offers and how its key features work by actually using them.

Start URL: ${url}

## Exploration Cycle
Repeat this cycle for each area of the site:
1. Take a screenshot to see the page and get element refs
2. Interact with the page: click Run on code snippets, fill forms, click buttons, try toggles
3. Take another screenshot to see what changed
4. Once you understand what this feature does, call store_finding to capture it
5. Navigate to a different section of the site and repeat

After storing a finding for each section you explored, call finish_exploration to deliver your summary.

## Browser Actions
- screenshot: Capture page and get interactive element refs (@e1, @e2, etc.)
- click: Click an element (ref required, e.g. @e5)
- fill: Clear and type into an input (ref + value required)
- scroll: Scroll up or down (direction required)
- navigate: Go to a URL (value = URL)
- back: Go back in browser history
- press: Press a key (value = key name: Enter, Tab, Escape, Control+a, etc.)
- hover: Hover over an element (ref required)
- eval: Run JavaScript on the page (value = JS code)
- wait: Wait for page to finish loading

## Rules
- Take a screenshot when you need to see new element refs or verify that something changed. You do not need one after every action — batch related interactions (fill then press Enter, click then click) before screenshotting.
- Once you have seen what a feature does, move on. Do not repeat the same interaction.
- Prefer clicking element refs (@e5) over scrolling or navigating.
- Use fill for search boxes and form inputs. Press Enter after filling to submit.
- Never fill "Editor content" or "Reference Code" panels — they are read-only code displays.
- NEVER guess or construct URLs. Only navigate to URLs visible in the accessibility tree.
- Do not exhaust your action budget. Wrap up when you have enough understanding to summarize the site.
- Element refs (@e1) are only valid until the page changes. Take a new screenshot after navigation.`;

	if (hints) {
		prompt += `\n\n## Site-Specific Hints\n${hints}`;
	}

	return prompt;
}

// --- Tool Definitions ---

function createExplorationTools(sandbox: Sandbox, ctx: ExplorerContext, state: ExplorationState, abortSignal?: AbortSignal) {
	return {
		browser: tool({
			description: 'Control the sandbox browser. Use screenshot action to see the page and get element refs.',
			inputSchema: z.object({
				action: z.enum([
					'screenshot',
					'click',
					'fill',
					'scroll',
					'navigate',
					'back',
					'press',
					'hover',
					'eval',
					'wait',
				]),
				ref: z.string().nullable()
					.describe('Element ref like @e5. Required for: click, fill, hover'),
				value: z.string().nullable()
					.describe('Text for fill, key for press, URL for navigate, JS for eval'),
				direction: z.enum(['up', 'down']).nullable()
					.describe('Scroll direction. Required for: scroll'),
				reason: z.string()
					.describe('Why this action — shown to the user'),
			}),
			strict: true,
			execute: async ({ action, ref, value, direction, reason }, { toolCallId }) => {
				// Screenshot is special: captures image, uploads to S3, generates observation
				if (action === 'screenshot') {
					return handleScreenshot(sandbox, ctx, state, toolCallId, abortSignal);
				}

				// Dispatch table for all other actions
				const handler = BROWSER_DISPATCH[action];
				if (!handler) return `Unknown action: ${action}`;

				const validationError = handler.validate?.(ref, value, direction);
				if (validationError) return validationError;

				const result = await handler.run(sandbox, ref, value, direction);
				if (typeof result === 'string' && (result.startsWith('Error:') || result.startsWith('Command failed:'))) return result;

				const description = handler.describe(ref, value, direction, reason);
				recordAction(state, state.currentUrl, description);
				return description;
			},
		}),

		store_finding: tool({
			description: 'Checkpoint: capture what you learned about the current feature, then move on to a new section. Each finding should describe what the feature does based on your interaction, not just what you saw.',
			inputSchema: z.object({
				title: z.string().describe('Short title for this finding'),
				observation: z.string().describe('What you discovered'),
			}),
			strict: true,
			execute: async ({ title, observation }) => {
				// Resolve the screenshot key for the current page, not the last screenshot taken
				const page = await getCurrentPageInfo(sandbox, state.url);
				state.currentUrl = page.url;
				const normalizedCurrent = normalizeUrl(page.url);
				const matchingToolCallId = [...state.urlHistory.entries()]
					.reverse()
					.find(([, u]) => {
						try { return normalizeUrl(u) === normalizedCurrent; } catch { return false; }
					})?.[0];
				const resolvedKey = matchingToolCallId
					? (state.screenshotKeyHistory.get(matchingToolCallId) ?? '')
					: '';

				await storeVisit(ctx, {
					url: page.url,
					title: page.title,
					screenshotKey: resolvedKey,
					observation,
					action: `Stored finding: ${title}`,
				});
				// Nudge the model toward the next cycle step via tool output
			return `Stored: ${title}. Navigate to a new section or call finish_exploration if you have covered enough.`;
			},
		}),

		finish_exploration: tool({
			description: 'End the exploration and deliver your summary to the user. Call this after you have stored a finding for each major section you interacted with. Do not call this if you have not stored any findings yet.',
			inputSchema: z.object({
				summary: z.string().describe('2-3 sentence summary of your exploration'),
			}),
			strict: true,
			// No execute — stops loop via hasToolCall('finish_exploration')
		}),
	};
}

// --- Browser Action Dispatch ---

interface BrowserAction {
	validate?: (ref: string | null, value: string | null, direction: string | null) => string | null;
	run: (sandbox: Sandbox, ref: string | null, value: string | null, direction: string | null) => Promise<string>;
	describe: (ref: string | null, value: string | null, direction: string | null, reason: string) => string;
}

const BROWSER_DISPATCH: Record<string, BrowserAction> = {
	click: {
		validate: (ref) => ref ? null : 'Error: ref is required for click',
		run: async (sandbox, ref) => await runBrowserCmd(sandbox, ['click', ref!]) ?? `Clicked ${ref}`,
		describe: (ref, _v, _d, reason) => `Clicked ${ref} (${reason})`,
	},
	fill: {
		validate: (ref, value) => (!ref || !value) ? 'Error: ref and value are required for fill' : null,
		run: async (sandbox, ref, value) => {
			const err = await runBrowserCmd(sandbox, ['fill', ref!, value!]);
			if (err) return err;
			// Read back the value to detect read-only fields
			const readBack = await exec(sandbox, ['agent-browser', 'get', 'value', ref!]);
			const actual = (await getStdout(readBack)).trim();
			if (actual !== value) return `Fill had no effect on ${ref} — this field may be read-only. Do not retry.`;
			return `Filled ${ref} with "${value}"`;
		},
		describe: (ref, value, _d, reason) => `Filled ${ref} with "${value}" (${reason})`,
	},
	scroll: {
		validate: (_r, _v, direction) => direction ? null : 'Error: direction is required for scroll',
		run: async (sandbox, _r, _v, direction) => await runBrowserCmd(sandbox, ['scroll', direction!]) ?? `Scrolled ${direction}`,
		describe: (_r, _v, direction, reason) => `Scrolled ${direction} (${reason})`,
	},
	navigate: {
		validate: (_r, value) => value ? null : 'Error: value (URL) is required for navigate',
		run: async (sandbox, _r, value) => {
			const navErr = await runBrowserCmd(sandbox, ['open', value!]);
			if (navErr) return navErr;
			const waitErr = await runBrowserCmd(sandbox, ['wait', '--load', 'networkidle']);
			return waitErr ? `Navigated to ${value} (page still loading)` : `Navigated to ${value}`;
		},
		describe: (_r, value, _d, reason) => `Navigated to ${value} (${reason})`,
	},
	back: {
		run: async (sandbox) => await runBrowserCmd(sandbox, ['back']) ?? 'Went back',
		describe: () => 'Went back',
	},
	press: {
		validate: (_r, value) => value ? null : 'Error: value (key name) is required for press',
		run: async (sandbox, _r, value) => await runBrowserCmd(sandbox, ['press', value!]) ?? `Pressed ${value}`,
		describe: (_r, value, _d, reason) => `Pressed ${value} (${reason})`,
	},
	hover: {
		validate: (ref) => ref ? null : 'Error: ref is required for hover',
		run: async (sandbox, ref) => await runBrowserCmd(sandbox, ['hover', ref!]) ?? `Hovered ${ref}`,
		describe: (ref, _v, _d, reason) => `Hovered ${ref} (${reason})`,
	},
	eval: {
		validate: (_r, value) => value ? null : 'Error: value (JS code) is required for eval',
		run: async (sandbox, _r, value) => {
			const evalExec = await exec(sandbox, ['agent-browser', 'eval', value!]);
			if (evalExec.exitCode != null && evalExec.exitCode !== 0) {
				const stderr = await getStderr(evalExec);
				return `Eval failed: ${stderr}`;
			}
			const evalResult = await getStdout(evalExec);
			return `Eval result: ${evalResult.slice(0, 1000)}`;
		},
		describe: (_r, _v, _d, reason) => `Ran eval (${reason})`,
	},
	wait: {
		run: async (sandbox) => await runBrowserCmd(sandbox, ['wait', '--load', 'networkidle']) ?? 'Waited for page to load',
		describe: () => 'Waited for page to load',
	},
};

// --- Screenshot Handler ---

async function handleScreenshot(
	sandbox: Sandbox,
	ctx: ExplorerContext,
	state: ExplorationState,
	toolCallId: string,
	abortSignal?: AbortSignal,
): Promise<string> {
	const filename = `step-${Date.now()}.png`;
	const screenshotExec = await exec(sandbox, ['agent-browser', 'screenshot', filename]);
	if (screenshotExec.exitCode != null && screenshotExec.exitCode !== 0) {
		const stderr = await getStderr(screenshotExec);
		return `Screenshot failed: ${stderr}`;
	}

	const b64Exec = await exec(sandbox, ['base64', filename]);
	if (b64Exec.exitCode != null && b64Exec.exitCode !== 0) {
		return 'Failed to read screenshot';
	}

	const base64 = (await getStdout(b64Exec)).trim();
	const buffer = Buffer.from(base64, 'base64');

	// Get current URL
	const urlExec = await exec(sandbox, ['agent-browser', 'get', 'url']);
	const currentUrl = (await getStdout(urlExec)).trim() || state.url;
	state.currentUrl = currentUrl;

	const key = screenshotKey(currentUrl);
	const screenshotUrl = await uploadScreenshot(key, buffer);
	state.lastScreenshotKey = key;
	state.lastScreenshotUrl = screenshotUrl;
	state.screenshotHistory.set(toolCallId, screenshotUrl);
	state.screenshotKeyHistory.set(toolCallId, key);
	state.urlHistory.set(toolCallId, currentUrl);

	// Get accessibility tree for element refs
	const snapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
	const elements = (snapshotExec.exitCode != null && snapshotExec.exitCode !== 0)
		? '(snapshot unavailable)'
		: await getStdout(snapshotExec);

	// Generate observation — this becomes the KV record's observation field,
	// so it should describe what the page does, not just what it looks like
	try {
		let normalizedCurrent: string | null = null;
		try { normalizedCurrent = normalizeUrl(currentUrl); } catch {}

		const recentActions = normalizedCurrent ? (state.actionsByUrl.get(normalizedCurrent) ?? []).slice(-3) : [];
		const prevObservation = normalizedCurrent ? state.lastObservationByUrl.get(normalizedCurrent) : undefined;

		let observationPrompt = `Describe what this page does and what interactive features are available in 1-2 sentences. Do not address the reader.\n\nPage URL: ${currentUrl}`;
		if (recentActions.length > 0) {
			observationPrompt += `\n\nRecent actions:\n${recentActions.map((a) => `- ${a}`).join('\n')}`;
		}
		if (prevObservation) {
			observationPrompt += `\n\nPrevious observation: ${prevObservation}`;
			observationPrompt += '\n\nFocus on what changed or what is new compared to the previous observation.';
		}
		observationPrompt += `\n\nAccessibility tree:\n${elements.slice(0, 4000)}`;

		const { text: obs } = await generateText({
			model: openai('gpt-5-nano'),
			prompt: observationPrompt,
			abortSignal,
		});
		if (obs) {
			state.observations.set(toolCallId, obs);
			if (normalizedCurrent) state.lastObservationByUrl.set(normalizedCurrent, obs);
			// Auto-persist visit to KV
			const titleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
			const pageTitle = (titleExec.exitCode === 0 ? (await getStdout(titleExec)).trim() : '') || currentUrl;
			storeVisit(ctx, {
				url: currentUrl,
				title: pageTitle,
				screenshotKey: key,
				observation: obs,
			}).catch(() => {});
		}
	} catch {
		// Observation generation is non-critical
	}

	return `Screenshot captured. URL: ${currentUrl}\n\nInteractive elements:\n${elements.slice(0, 4000)}`;
}

// --- Exploration State ---

interface ExplorationState {
	url: string;
	currentUrl: string;
	lastScreenshotKey: string;
	lastScreenshotUrl: string;
	screenshotHistory: Map<string, string>; // toolCallId → presigned URL
	screenshotKeyHistory: Map<string, string>; // toolCallId → S3 key
	urlHistory: Map<string, string>; // toolCallId → page URL at time of screenshot
	observations: Map<string, string>; // toolCallId → observation text
	actionsByUrl: Map<string, string[]>; // normalizedUrl → action descriptions
	lastObservationByUrl: Map<string, string>; // normalizedUrl → most recent observation
}

function recordAction(state: ExplorationState, rawUrl: string, description: string): void {
	try {
		const key = normalizeUrl(rawUrl);
		const actions = state.actionsByUrl.get(key) ?? [];
		actions.push(description);
		state.actionsByUrl.set(key, actions.slice(-MAX_ACTIONS_STORED));
	} catch {
		// normalizeUrl can throw on malformed URLs
	}
}

// --- Main Exploration Function ---

export async function explore(ctx: ExplorerContext, options: ExploreOptions): Promise<AgentOutput> {
	const maxSteps = options.maxSteps ?? 8;
	let pageTitle = '';

	ctx.logger.info('Starting web exploration', { url: options.url, maxSteps });

	const sandbox: Sandbox = await ctx.sandbox.create({
		runtime: 'agent-browser:latest',
		network: { enabled: true },
		resources: { memory: '1Gi', cpu: '1000m' },
		timeout: { idle: '10m', execution: '30s' },
	});

	try {
		const result = await exploreWithSandbox(ctx, sandbox, options, maxSteps);
		pageTitle = result.title;
		return result;
	} catch (error) {
		ctx.logger.error('Exploration error', { error: String(error) });
		if (options.onStep) {
			await options.onStep({ type: 'error', message: String(error) });
		}
		return {
			url: options.url,
			title: pageTitle || 'Failed to explore',
			steps: [],
			summary: `Exploration encountered an error: ${String(error)}`,
		};
	} finally {
		await sandbox.destroy();
		ctx.logger.info('Sandbox destroyed');
	}
}

export async function exploreWithSandbox(
	ctx: ExplorerContext,
	sandbox: Sandbox,
	options: ExploreOptions & { skipNavigation?: boolean },
	maxSteps?: number,
): Promise<AgentOutput> {
	const steps = maxSteps ?? options.maxSteps ?? 8;

	const state: ExplorationState = {
		url: options.url,
		currentUrl: options.url,
		lastScreenshotKey: '',
		lastScreenshotUrl: '',
		screenshotHistory: new Map(),
		screenshotKeyHistory: new Map(),
		urlHistory: new Map(),
		observations: new Map(),
		actionsByUrl: new Map(),
		lastObservationByUrl: new Map(),
	};

	// Load past visits from KV
	const pastVisits = await loadPastVisits(ctx, options.url);

	// Initial navigation (skip for continuations)
	if (!options.skipNavigation) {
		const openErr = await runBrowserCmd(sandbox, ['open', options.url]);
		if (openErr) {
			ctx.logger.warn('Initial navigation failed', { error: openErr });
		}
		await runBrowserCmd(sandbox, ['wait', '--load', 'networkidle']);
	}

	// Get page title
	const titleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
	const pageTitle = (titleExec.exitCode === 0 ? (await getStdout(titleExec)).trim() : '') || options.url;

	// Emit memory event if past visits exist
	if (pastVisits.length > 0 && options.onStep) {
		await options.onStep({ type: 'memory', visits: pastVisits });
	}

	// Find site-specific hints
	const target = TARGETS.find((t) => options.url.includes(new URL(t.url).hostname));
	const hints = target?.hints;

	const tools = createExplorationTools(sandbox, ctx, state, options.abortSignal);

	// Build memory context for the model
	const memoryContext = pastVisits.length > 0
		? pastVisits.map((v) => {
			const lines = [`- ${v.url}: ${v.observation}`];
			if (v.actionsTaken.length > 0) {
				lines.push(`  Already tried: ${v.actionsTaken.join(', ')}`);
			}
			return lines.join('\n');
		}).join('\n')
		: '';

	const result = await generateText({
		model: openai('gpt-5-nano'),
		system: buildSystemPrompt(options.url, hints),
		prompt: memoryContext
			? `Begin exploring ${options.url}.\n\nPages already explored (DO NOT revisit these URLs unless you have a specific new interaction to try):\n${memoryContext}\n\nFocus on new areas. Follow the Exploration Cycle: interact with a feature, store_finding when you understand it, then move on.`
			: `Begin exploring ${options.url}. Take a screenshot first, then follow the Exploration Cycle: interact with a feature, store_finding when you understand it, then move on.`,
		tools,
		stopWhen: [stepCountIs(steps), hasToolCall('finish_exploration')],
		abortSignal: options.abortSignal,
		onStepFinish: async (step) => {
			if (step.text && options.onStep) {
				await options.onStep({
					type: 'thinking',
					text: step.text,
					stepNumber: step.stepNumber ?? 0,
				});
			}
		},
		experimental_onToolCallStart: async (event) => {
			if (!options.onStep) return;
			const tc = event.toolCall;
			const args = tc.input as Record<string, unknown>;
			await options.onStep({
				type: 'tool_call_start',
				toolCallId: tc.toolCallId,
				toolName: tc.toolName,
				action: tc.toolName === 'browser' ? (args.action as string) : undefined,
				reason: (args.reason as string) ?? (args.title as string) ?? (args.summary as string),
			});
		},
		experimental_onToolCallFinish: async (event) => {
			if (!options.onStep) return;
			const tc = event.toolCall;
			const args = tc.input as Record<string, unknown>;
			const isScreenshot = tc.toolName === 'browser' && args.action === 'screenshot';
			await options.onStep({
				type: 'tool_call_finish',
				toolCallId: tc.toolCallId,
				toolName: tc.toolName,
				output: event.success ? String(event.output ?? '') : String(event.error),
				screenshotUrl: isScreenshot && event.success ? state.screenshotHistory.get(tc.toolCallId) : undefined,
				observation: isScreenshot && event.success ? state.observations.get(tc.toolCallId) : undefined,
				durationMs: event.durationMs,
			});
		},
	});

	// Extract summary
	let summary = result.text || '';
	for (const step of result.steps) {
		for (const tc of step.toolCalls) {
			if (tc.toolName === 'finish_exploration') {
				summary = (tc.input as { summary: string }).summary;
			}
		}
	}

	// Build ExplorationStep[] from result.steps
	const explorationSteps: ExplorationStep[] = [];
	let stepNumber = 0;
	for (const step of result.steps) {
		stepNumber++;
		const browserCalls = step.toolCalls.filter((tc) => tc.toolName === 'browser');
		const actions = browserCalls.map((tc) => {
			const args = tc.input as Record<string, unknown>;
			return `${args.action}${args.ref ? ` ${args.ref}` : ''}${args.value ? ` "${args.value}"` : ''} (${args.reason})`;
		});

		let screenshotUrl = '';
		let pageUrl = state.currentUrl;
		for (const tc of browserCalls) {
			const args = tc.input as Record<string, unknown>;
			if (args.action === 'screenshot') {
				screenshotUrl = state.screenshotHistory.get(tc.toolCallId) ?? '';
				pageUrl = state.urlHistory.get(tc.toolCallId) ?? state.currentUrl;
			}
		}

		if (actions.length > 0) {
			explorationSteps.push({
				stepNumber,
				screenshotUrl,
				action: actions.join('; '),
				observation: step.text || '',
				pageUrl,
			});
		}
	}

	// Fallback summary
	if (!summary && explorationSteps.length > 0) {
		try {
			const { text: fallbackSummary } = await generateText({
				model: openai('gpt-5-nano'),
				prompt: `Summarize this web exploration in 2-3 sentences.\n\nURL: ${options.url}\nActions taken:\n${explorationSteps.map((s) => `- ${s.action}`).join('\n')}`,
				abortSignal: options.abortSignal,
			});
			summary = fallbackSummary || 'Exploration completed.';
		} catch {
			summary = 'Exploration completed.';
		}
	}

	ctx.logger.info('Exploration complete', { url: options.url, totalSteps: explorationSteps.length });

	if (options.onStep) {
		await options.onStep({ type: 'summary', summary, title: pageTitle, url: options.url });
	}

	return { url: options.url, title: pageTitle, steps: explorationSteps, summary };
}

// --- Internal Helpers ---

async function exec(sandbox: Sandbox, command: string[]): Promise<Execution> {
	return sandbox.execute({ command });
}

async function runBrowserCmd(sandbox: Sandbox, args: string[]): Promise<string | null> {
	const result = await exec(sandbox, ['agent-browser', ...args]);
	if (result.exitCode != null && result.exitCode !== 0) {
		const stderr = await getStderr(result);
		return `Command failed: agent-browser ${args[0]} — ${stderr}`;
	}
	return null;
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

async function getCurrentPageInfo(sandbox: Sandbox, fallbackUrl: string): Promise<{ url: string; title: string }> {
	const urlExec = await exec(sandbox, ['agent-browser', 'get', 'url']);
	const currentUrl = (await getStdout(urlExec)).trim() || fallbackUrl;
	const titleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
	const title = (titleExec.exitCode === 0 ? (await getStdout(titleExec)).trim() : '') || currentUrl;
	return { url: currentUrl, title };
}

// --- KV Memory (no vector storage) ---

async function loadPastVisits(ctx: ExplorerContext, url: string): Promise<MemoryVisit[]> {
	try {
		const domain = new URL(url).hostname;
		const indexResult = await ctx.kv.get<string[]>(KV_NAMESPACE, `domain:${domain}`);
		if (!indexResult.exists || !indexResult.data?.length) return [];

		const visits: MemoryVisit[] = [];
		for (const normalizedUrl of indexResult.data) {
			const kvResult = await ctx.kv.get<VisitRecord>(KV_NAMESPACE, `visit:${normalizedUrl}`);
			if (!kvResult.exists || !kvResult.data) continue;
			const record = kvResult.data;
			if (!record.observation) continue;

			// Check freshness (24h)
			const timestamp = Date.parse(record.visitedAt);
			if (!Number.isFinite(timestamp) || Date.now() - timestamp > VISIT_TTL * 1000) continue;

			// Generate presigned URL for stored screenshot
			const ssUrl = record.screenshotKey ? screenshotPresignedUrl(record.screenshotKey) : '';

			visits.push({
				url: record.url,
				title: record.title,
				observation: record.observation,
				screenshotUrl: ssUrl || undefined,
				actionsTaken: record.actionsTaken ?? [],
			});
		}

		return visits.slice(0, 5);
	} catch (err) {
		ctx.logger.warn('Failed to load past visits', { error: String(err) });
		return [];
	}
}

async function storeVisit(
	ctx: ExplorerContext,
	params: {
		url: string;
		title: string;
		screenshotKey: string;
		observation: string;
		action?: string;
	},
): Promise<void> {
	// Guard: don't persist without a real screenshot
	if (!params.screenshotKey) return;

	let normalizedUrlStr: string;
	try {
		normalizedUrlStr = normalizeUrl(params.url);
	} catch {
		return;
	}
	const kvKey = `visit:${normalizedUrlStr}`;

	// Merge with existing record
	let existingActions: string[] = [];
	try {
		const existing = await ctx.kv.get<VisitRecord>(KV_NAMESPACE, kvKey);
		if (existing.exists && existing.data) {
			existingActions = existing.data.actionsTaken ?? [];
		}
	} catch {
		// KV read failure is non-critical
	}

	const allActions = [...existingActions];
	if (params.action) allActions.push(params.action);
	// Dedupe and cap
	const uniqueActions = [...new Set(allActions)].slice(-MAX_ACTIONS_STORED);

	const record: VisitRecord = {
		url: params.url,
		title: params.title,
		visitedAt: new Date().toISOString(),
		screenshotKey: params.screenshotKey,
		observation: params.observation,
		actionsTaken: uniqueActions,
	};

	try {
		await ctx.kv.set(KV_NAMESPACE, kvKey, record, { ttl: VISIT_TTL });
	} catch (err) {
		ctx.logger.warn('KV write failed', { error: String(err) });
	}

	// Update domain index
	try {
		const domain = new URL(params.url).hostname;
		const indexKey = `domain:${domain}`;
		const existing = await ctx.kv.get<string[]>(KV_NAMESPACE, indexKey);
		const urls = existing.exists && existing.data ? existing.data : [];
		if (!urls.includes(normalizedUrlStr)) {
			urls.push(normalizedUrlStr);
		}
		await ctx.kv.set(KV_NAMESPACE, indexKey, urls.slice(-20), { ttl: DOMAIN_INDEX_TTL });
	} catch (err) {
		ctx.logger.warn('Domain index update failed', { error: String(err) });
	}
}
