import { createAgent } from '@agentuity/runtime';
import { generateObject, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { AgentInput, AgentOutput, type ExplorationStep } from '@lib/types';
import type { Execution, Sandbox } from '@agentuity/core';

// Read stdout text from an execution's stream URL
async function getStdout(execution: Execution): Promise<string> {
	if (!execution.stdoutStreamUrl) return '';
	const response = await fetch(execution.stdoutStreamUrl);
	if (!response.ok) return '';
	return response.text();
}

// Read a file from the sandbox and return base64-encoded content
async function readFileAsBase64(sandbox: Sandbox, path: string): Promise<string> {
	const stream = await sandbox.readFile(path);
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	return Buffer.concat(chunks).toString('base64');
}

// Execute a command in the sandbox and return the execution result
async function exec(sandbox: Sandbox, command: string[]): Promise<Execution> {
	return sandbox.execute({ command });
}

export default createAgent('web-explorer', {
	description:
		'Opens a URL in a headless browser sandbox, takes screenshots, and autonomously explores the page using AI-guided actions',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		const maxSteps = input.maxSteps ?? 4;
		const steps: ExplorationStep[] = [];

		ctx.logger.info('Starting web exploration', { url: input.url, maxSteps });

		const sandbox = await ctx.sandbox.create({
			runtime: 'agent-browser:latest',
			network: { enabled: true },
			resources: { memory: '1Gi', cpu: '1000m' },
			timeout: { idle: '10m', execution: '30s' },
		});

		try {
			// Step 1: Open URL and capture initial state
			ctx.logger.info('Opening URL', { url: input.url });
			await exec(sandbox, ['agent-browser', 'open', input.url]);

			// Brief wait for page to settle
			await exec(sandbox, ['sleep', '2']);

			// Take initial screenshot
			const screenshotPath = 'step-1.png';
			await exec(sandbox, ['agent-browser', 'screenshot', screenshotPath]);
			const screenshot = await readFileAsBase64(sandbox, screenshotPath);

			// Get accessibility tree for the initial page
			const snapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
			const accessibilityTree = await getStdout(snapshotExec);

			// Get page title
			const titleExec = await exec(sandbox, ['agent-browser', 'get', 'title']);
			const pageTitle = (await getStdout(titleExec)).trim();

			// Ask LLM to observe the initial page
			const { text: initialObservation } = await generateText({
				model: anthropic('claude-sonnet-4-6'),
				prompt: `You are observing a web page. Describe what you see on this page in 1-2 sentences.

Page URL: ${input.url}
Page title: ${pageTitle}

Accessibility tree:
${accessibilityTree.slice(0, 4000)}`,
			});

			steps.push({
				stepNumber: 1,
				screenshot,
				action: `Opened ${input.url}`,
				observation: initialObservation,
			});

			ctx.logger.info('Initial page captured', { title: pageTitle, step: 1 });

			// Loop for remaining steps: LLM picks an action, we execute it
			for (let i = 2; i <= maxSteps; i++) {
				ctx.logger.info('Starting exploration step', { step: i });

				// Get current accessibility tree
				const currentSnapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
				const currentTree = await getStdout(currentSnapshotExec);

				// Ask LLM to pick the next action
				const { object: nextAction } = await generateObject({
					model: anthropic('claude-sonnet-4-6'),
					schema: z.object({
						ref: z.string().describe('The element reference to interact with, e.g. @e5'),
						action: z
							.enum(['click', 'hover', 'scroll'])
							.describe('The action to take on the element'),
						reason: z
							.string()
							.describe('Brief explanation of why this action is interesting to explore'),
					}),
					prompt: `You are an AI exploring a web page. Based on the accessibility tree below, choose ONE interesting element to interact with. Pick something that would reveal more content or navigate to something interesting.

Previous steps taken:
${steps.map((s) => `- Step ${s.stepNumber}: ${s.action} => ${s.observation}`).join('\n')}

Current accessibility tree:
${currentTree.slice(0, 4000)}

Choose an element to interact with. Prefer links, buttons, or interactive elements that would show new content.`,
				});

				ctx.logger.info('LLM chose action', {
					step: i,
					ref: nextAction.ref,
					action: nextAction.action,
					reason: nextAction.reason,
				});

				// Execute the chosen action
				let actionDescription: string;
				if (nextAction.action === 'scroll') {
					await exec(sandbox, ['agent-browser', 'scroll', 'down']);
					actionDescription = `Scrolled down (reason: ${nextAction.reason})`;
				} else {
					await exec(sandbox, ['agent-browser', nextAction.action, nextAction.ref]);
					actionDescription = `${nextAction.action === 'click' ? 'Clicked' : 'Hovered'} ${nextAction.ref} (${nextAction.reason})`;
				}

				// Wait for any transitions/loads
				await exec(sandbox, ['sleep', '2']);

				// Take screenshot of new state
				const stepScreenshotPath = `step-${i}.png`;
				await exec(sandbox, ['agent-browser', 'screenshot', stepScreenshotPath]);
				const stepScreenshot = await readFileAsBase64(sandbox, stepScreenshotPath);

				// Get new accessibility tree
				const newSnapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
				const newTree = await getStdout(newSnapshotExec);

				// Ask LLM to observe the result
				const { text: observation } = await generateText({
					model: anthropic('claude-sonnet-4-6'),
					prompt: `You are observing a web page after performing an action. Describe what changed or what you now see in 1-2 sentences.

Action taken: ${actionDescription}

New accessibility tree:
${newTree.slice(0, 4000)}`,
				});

				steps.push({
					stepNumber: i,
					screenshot: stepScreenshot,
					action: actionDescription,
					observation,
					elementRef: nextAction.ref,
				});

				ctx.logger.info('Step completed', { step: i, observation });
			}

			// Generate final summary
			const { text: summary } = await generateText({
				model: anthropic('claude-sonnet-4-6'),
				prompt: `Summarize what was discovered during this web exploration in 2-3 sentences.

URL: ${input.url}
Steps taken:
${steps.map((s) => `${s.stepNumber}. ${s.action} => ${s.observation}`).join('\n')}`,
			});

			ctx.logger.info('Exploration complete', {
				url: input.url,
				totalSteps: steps.length,
			});

			return {
				url: input.url,
				title: pageTitle,
				steps,
				summary,
			};
		} catch (error) {
			ctx.logger.error('Exploration error, returning partial results', {
				error: String(error),
				stepsCompleted: steps.length,
			});

			// Return partial results on error
			return {
				url: input.url,
				title: steps.length > 0 ? 'Partial exploration' : 'Failed to explore',
				steps,
				summary: `Exploration encountered an error after ${steps.length} step(s): ${String(error)}`,
			};
		} finally {
			await sandbox.destroy();
			ctx.logger.info('Sandbox destroyed');
		}
	},
});
