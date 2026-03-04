import { s } from '@agentuity/schema';

// --- Core Exploration Types ---

const ExplorationStep = s.object({
	stepNumber: s.number(),
	screenshotUrl: s.string(),
	action: s.string(),
	observation: s.string(),
	pageUrl: s.optional(s.string()),
	cached: s.optional(s.boolean()),
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

// --- Visit Record (KV storage) ---

export const VisitRecord = s.object({
	url: s.string(),
	title: s.string(),
	visitedAt: s.string(),
	screenshotKey: s.string(),
	observation: s.string(),
});

export type VisitRecord = s.infer<typeof VisitRecord>;

// --- SSE Stream Events ---

const StepEvent = s.object({
	type: s.literal('step'),
	step: ExplorationStep,
});

const SummaryEvent = s.object({
	type: s.literal('summary'),
	summary: s.string(),
	title: s.string(),
	url: s.string(),
});

const ErrorEvent = s.object({
	type: s.literal('error'),
	message: s.string(),
});

const PreviewEvent = s.object({
	type: s.literal('preview'),
	stepNumber: s.number(),
	screenshotUrl: s.string(),
	action: s.string(),
	pageUrl: s.optional(s.string()),
	cached: s.optional(s.boolean()),
	elementRef: s.optional(s.string()),
});

const DoneEvent = s.object({
	type: s.literal('done'),
});

export const StreamEvent = s.union(StepEvent, PreviewEvent, SummaryEvent, ErrorEvent, DoneEvent);
export type StreamEvent = s.infer<typeof StreamEvent>;

// SSE output schema (flat for stream.writeSSE compatibility)
export const StreamEventOutput = s.object({
	data: s.string(),
});
