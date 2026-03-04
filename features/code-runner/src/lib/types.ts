import { s } from '@agentuity/schema';

// Shared schema for a single sandbox execution result.
// Each language runtime returns its generated code, exit status, and captured output.
const RuntimeResult = s.object({
	code: s.string(),
	exitCode: s.number(),
	durationMs: s.number(),
	stdout: s.string(),
	stderr: s.string(),
});

// Agent input: the coding prompt to solve
export const AgentInput = s.object({
	prompt: s.string(),
});

// Agent output: the original prompt plus results from both runtimes.
// Registering schemas via `schema: { input, output }` in createAgent()
// enables validation, workbench type hints, and auto-generated API docs.
export const AgentOutput = s.object({
	prompt: s.string(),
	typescript: RuntimeResult,
	python: RuntimeResult,
});

export type AgentInput = s.infer<typeof AgentInput>;
export type AgentOutput = s.infer<typeof AgentOutput>;
