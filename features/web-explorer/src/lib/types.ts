import { s } from '@agentuity/schema';

const ExplorationStep = s.object({
	stepNumber: s.number(),
	screenshot: s.string(),
	action: s.string(),
	observation: s.string(),
	elementRef: s.optional(s.string()),
});

export const AgentInput = s.object({
	url: s.string(),
	maxSteps: s.optional(s.number()),
});

export const AgentOutput = s.object({
	url: s.string(),
	title: s.string(),
	steps: s.array(ExplorationStep),
	summary: s.string(),
});

export type AgentInput = s.infer<typeof AgentInput>;
export type AgentOutput = s.infer<typeof AgentOutput>;
export type ExplorationStep = s.infer<typeof ExplorationStep>;
