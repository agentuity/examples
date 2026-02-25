import { s } from '@agentuity/schema';

const RuntimeResult = s.object({
	code: s.string(),
	exitCode: s.number(),
	durationMs: s.number(),
	stdout: s.string(),
	stderr: s.string(),
});

export const AgentInput = s.object({
	prompt: s.string(),
});

export const AgentOutput = s.object({
	prompt: s.string(),
	typescript: RuntimeResult,
	python: RuntimeResult,
});

export type AgentInput = s.infer<typeof AgentInput>;
export type AgentOutput = s.infer<typeof AgentOutput>;
