import { createAgent } from '@agentuity/runtime';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { AgentInput, AgentOutput } from '@lib/types';

export default createAgent('code-runner', {
	description:
		'Takes a coding prompt, generates TypeScript and Python implementations, and executes both in parallel sandboxes',

	// Registering input/output schemas enables validation and workbench type hints
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},

	handler: async (ctx, input) => {
		ctx.logger.info('Generating code for prompt', { prompt: input.prompt });

		// Step 1: Ask the LLM to produce both implementations in a single call.
		// Output.object() with a Zod schema enforces structured JSON output,
		// so we get typed `typescript` and `python` fields directly.
		const { output } = await generateText({
			model: openai('gpt-5.2'),
			output: Output.object({
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
			}),
			prompt: `Generate two standalone scripts that solve the following coding prompt. Each script must print its results to stdout.

Prompt: ${input.prompt}`,
		});

		// Step 2: Execute both scripts in isolated sandboxes, in parallel.
		// ctx.sandbox.run() spins up a short-lived container with the chosen runtime,
		// writes the generated code as a file, and returns stdout/stderr/exitCode.
		const [tsResult, pyResult] = await Promise.all([
			ctx.sandbox.run({
				runtime: 'bun:1',
				stream: { timestamps: false },
				command: {
					exec: ['bun', 'run', 'solution.ts'],
					files: [
						{ path: 'solution.ts', content: Buffer.from(output.typescript) },
					],
				},
			}),
			ctx.sandbox.run({
				runtime: 'python:3.14',
				stream: { timestamps: false },
				command: {
					exec: ['python', 'solution.py'],
					files: [
						{ path: 'solution.py', content: Buffer.from(output.python) },
					],
				},
			}),
		]);

		// Step 3: Return structured results matching AgentOutput schema
		return {
			prompt: input.prompt,
			typescript: {
				code: output.typescript,
				exitCode: tsResult.exitCode,
				durationMs: tsResult.durationMs,
				stdout: tsResult.stdout ?? '',
				stderr: tsResult.stderr ?? '',
			},
			python: {
				code: output.python,
				exitCode: pyResult.exitCode,
				durationMs: pyResult.durationMs,
				stdout: pyResult.stdout ?? '',
				stderr: pyResult.stderr ?? '',
			},
		};
	},
});
