import { createAgent } from '@agentuity/runtime';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { AgentInput, AgentOutput } from '@lib/types';

export default createAgent('code-runner', {
	description:
		'Takes a coding prompt, generates TypeScript and Python implementations, and executes both in parallel sandboxes',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		ctx.logger.info('Generating code for prompt', { prompt: input.prompt });

		const { object } = await generateObject({
			model: openai('gpt-5.2'),
			schema: z.object({
				typescript: z
					.string()
					.describe(
						'Complete TypeScript/Bun code that solves the prompt. Must be a standalone script that prints output to stdout.'
					),
				python: z
					.string()
					.describe(
						'Complete Python code that solves the prompt. Must be a standalone script that prints output to stdout.'
					),
			}),
			prompt: `Generate two standalone scripts that solve the following coding prompt. Each script must print its results to stdout.

Prompt: ${input.prompt}`,
		});

		const [tsResult, pyResult] = await Promise.all([
			ctx.sandbox.run({
				runtime: 'bun:1',
				command: {
					exec: ['bun', 'run', 'solution.ts'],
					files: [
						{ path: 'solution.ts', content: Buffer.from(object.typescript) },
					],
				},
			}),
			ctx.sandbox.run({
				runtime: 'python:3.14',
				command: {
					exec: ['python', 'solution.py'],
					files: [
						{ path: 'solution.py', content: Buffer.from(object.python) },
					],
				},
			}),
		]);

		return {
			prompt: input.prompt,
			typescript: {
				code: object.typescript,
				exitCode: tsResult.exitCode,
				durationMs: tsResult.durationMs,
				stdout: tsResult.stdout ?? '',
				stderr: tsResult.stderr ?? '',
			},
			python: {
				code: object.python,
				exitCode: pyResult.exitCode,
				durationMs: pyResult.durationMs,
				stdout: pyResult.stdout ?? '',
				stderr: pyResult.stderr ?? '',
			},
		};
	},
});
