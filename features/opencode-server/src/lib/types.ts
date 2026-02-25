import { s } from '@agentuity/schema';

export const ServerState = s.object({
	sandboxId: s.string(),
	serverUrl: s.string(),
	password: s.string(),
	startedAt: s.string(),
});

export const StartResponse = s.object({
	sandboxId: s.string(),
	serverUrl: s.string(),
	password: s.string(),
	ready: s.boolean(),
});

export const StatusResponse = s.object({
	exists: s.boolean(),
	sandbox: s.optional(
		s.object({
			sandboxId: s.string(),
			serverUrl: s.string(),
			password: s.string(),
			startedAt: s.string(),
		})
	),
	ready: s.optional(s.boolean()),
});

export const StopResponse = s.object({
	stopped: s.boolean(),
});

export type ServerState = s.infer<typeof ServerState>;
export type StartResponse = s.infer<typeof StartResponse>;
export type StatusResponse = s.infer<typeof StatusResponse>;
export type StopResponse = s.infer<typeof StopResponse>;
