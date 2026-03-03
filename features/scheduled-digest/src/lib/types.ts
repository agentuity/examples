import { s } from '@agentuity/schema';

export const SourceItemSchema = s.object({
	title: s.string(),
	url: s.string().optional(),
	description: s.string().optional(),
});

export const SourceDataSchema = s.object({
	name: s.string(),
	items: s.array(SourceItemSchema),
});

export const AgentInput = s.object({
	sources: s.array(SourceDataSchema),
	date: s.string(),
});

export const AgentOutput = s.object({
	title: s.string().describe('Digest title like "Tech Digest — Feb 19, 2026"'),
	htmlContent: s.string().describe('Complete HTML document with inline dark-theme styles'),
	summary: s.string().describe('2-3 sentence plain text summary of the digest'),
	itemCount: s.number().describe('Total number of items summarized'),
});

export type SourceItem = s.infer<typeof SourceItemSchema>;
export type SourceData = s.infer<typeof SourceDataSchema>;
export type AgentInput = s.infer<typeof AgentInput>;
export type AgentOutput = s.infer<typeof AgentOutput>;

// KV entry shape for stored digests
export interface DigestEntry {
	title: string;
	summary: string;
	streamUrl: string;
	streamId: string;
	date: string;
	itemCount: number;
}
