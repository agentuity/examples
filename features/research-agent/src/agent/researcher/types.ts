import { s } from '@agentuity/schema';

export const ResearchInput = s.object({
	topic: s.string(),
});

export const ResearchOutput = s.object({
	summary: s.string(),
	sourcesUsed: s.number(),
});

export type ResearchInput = s.infer<typeof ResearchInput>;
export type ResearchOutput = s.infer<typeof ResearchOutput>;
