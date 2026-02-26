import { s } from '@agentuity/schema';

export const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;
export const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

export type Language = (typeof LANGUAGES)[number];
export type Model = (typeof MODELS)[number];

export const HistoryEntrySchema = s.object({
	model: s.string().describe('AI model used for the translation'),
	sessionId: s.string().describe('Session ID when the translation was made'),
	text: s.string().describe('Original text that was translated (truncated)'),
	timestamp: s.string().describe('ISO timestamp when the translation occurred'),
	tokens: s.number().describe('Number of tokens used for this translation'),
	toLanguage: s.string().describe('Target language for the translation'),
	translation: s.string().describe('Translated text result (truncated)'),
});

export type HistoryEntry = s.infer<typeof HistoryEntrySchema>;

export const TranslateInputSchema = s.object({
	model: s.enum(MODELS).optional().describe('AI model to use for translation'),
	text: s.string().describe('The text to translate'),
	toLanguage: s.enum(LANGUAGES).optional().describe('Target language for translation'),
});

export type TranslateInput = s.infer<typeof TranslateInputSchema>;

export const TranslateOutputSchema = s.object({
	history: s.array(HistoryEntrySchema).describe('Recent translation history'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	tokens: s.number().describe('Tokens used for this translation'),
	translation: s.string().describe('The translated text'),
	translationCount: s.number().describe('Total translations in this thread'),
});

export type TranslateOutput = s.infer<typeof TranslateOutputSchema>;
