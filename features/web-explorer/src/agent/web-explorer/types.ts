import { s } from '@agentuity/schema';

// --- Core Exploration Types ---

const ExplorationStep = s.object({
	stepNumber: s.number(),
	screenshotUrl: s.string(),
	action: s.string(),
	observation: s.string(),
	pageUrl: s.optional(s.string()),
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
	actionsTaken: s.optional(s.array(s.string())),
});

export type VisitRecord = s.infer<typeof VisitRecord>;

// --- Memory Visit (sent to frontend for display) ---

export interface MemoryVisit {
	url: string;
	title: string;
	observation: string;
	screenshotUrl?: string;
	actionsTaken: string[];
}

// --- SSE Stream Events (tool-calling architecture) ---

export interface ToolCallStartEvent {
	type: 'tool_call_start';
	toolCallId: string;
	toolName: string;
	action?: string;
	reason?: string;
}

export interface ToolCallFinishEvent {
	type: 'tool_call_finish';
	toolCallId: string;
	toolName: string;
	output: string;
	screenshotUrl?: string;
	observation?: string;
	durationMs: number;
}

export interface ThinkingEvent {
	type: 'thinking';
	text: string;
	stepNumber: number;
}

export interface MemoryEvent {
	type: 'memory';
	visits: MemoryVisit[];
}

export interface SummaryEvent {
	type: 'summary';
	summary: string;
	title: string;
	url: string;
}

export interface ErrorEvent {
	type: 'error';
	message: string;
}

export interface SessionEvent {
	type: 'session';
	sessionId: string;
}

export interface PausedEvent {
	type: 'paused';
	sessionId: string;
}

export type StreamEvent =
	| ToolCallStartEvent
	| ToolCallFinishEvent
	| ThinkingEvent
	| MemoryEvent
	| SummaryEvent
	| ErrorEvent
	| SessionEvent
	| PausedEvent;

// SSE output schema (flat for stream.writeSSE compatibility)
export const StreamEventOutput = s.object({
	data: s.string(),
});
