import { s } from '@agentuity/schema';

// KV state persisted across requests
export const AssistantState = s.object({
	sandboxId: s.string(),
	serverUrl: s.string(),
	password: s.string(),
	sessionId: s.string(),
	repoUrl: s.string(),
	startedAt: s.string(),
});

export const StartInput = s.object({
	repoUrl: s.string(),
});

export const StartResponse = s.object({
	ready: s.boolean(),
	repoUrl: s.string(),
	sessionId: s.string(),
	message: s.optional(s.string()),
});

export const StatusResponse = s.object({
	exists: s.boolean(),
	repoUrl: s.optional(s.string()),
	ready: s.optional(s.boolean()),
});

export const AskInput = s.object({
	question: s.string(),
});

export const AskResponse = s.object({
	accepted: s.boolean(),
});

export const StopResponse = s.object({
	stopped: s.boolean(),
});

// Part data forwarded from OpenCode's message.part.updated events
export type PartData = {
	id: string;
	type: 'text' | 'reasoning';
	text: string;
	time?: { start: number; end?: number };
};

// Flat SSE output schema for route registration (Valibot requires a single object).
// The frontend uses the discriminated union StreamEvent (below) for type-safe branching.
export const StreamEventOutput = s.object({
	type: s.string(),
	part: s.optional(
		s.object({
			id: s.string(),
			type: s.string(),
			text: s.string(),
			time: s.optional(
				s.object({
					start: s.number(),
					end: s.optional(s.number()),
				}),
			),
		}),
	),
	status: s.optional(s.string()),
	message: s.optional(s.string()),
	seq: s.number(),
});

export type AssistantState = s.infer<typeof AssistantState>;
export type StartInput = s.infer<typeof StartInput>;
export type StartResponse = s.infer<typeof StartResponse>;
export type StatusResponse = s.infer<typeof StatusResponse>;
export type AskInput = s.infer<typeof AskInput>;
export type AskResponse = s.infer<typeof AskResponse>;
export type StopResponse = s.infer<typeof StopResponse>;

// Discriminated union for frontend consumption
export type StreamEvent =
	| { type: 'part'; part: PartData; seq: number }
	| { type: 'status'; status: string; seq: number }
	| { type: 'error'; message: string; seq: number };
