import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

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

export const AgentInput = s.object({
	model: s.enum(MODELS).optional().describe('AI model to use for translation'),
	text: s.string().describe('The text to translate'),
	toLanguage: s.enum(LANGUAGES).optional().describe('Target language for translation'),
});

export const AgentOutput = s.object({
	history: s.array(HistoryEntrySchema).describe('Recent translation history'),
	sessionId: s.string().describe('Current session identifier'),
	threadId: s.string().describe('Thread ID for conversation continuity'),
	tokens: s.number().describe('Tokens used for this translation'),
	translation: s.string().describe('The translated text'),
	translationCount: s.number().describe('Total translations in this thread'),
});

const translateAgent = createAgent('translate', {
	description: 'Translates text to different languages',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { text, toLanguage = 'Spanish', model = 'gpt-5-nano' }) => {
		ctx.logger.info('Translation request received', { toLanguage, model, textLength: text.length });

		const completion = await new OpenAI().chat.completions.create({
			model,
			messages: [{ role: 'user', content: `Translate to ${toLanguage}:\n\n${text}` }],
		});

		const translation = completion.choices[0]?.message?.content ?? '';
		const tokens = completion.usage?.total_tokens ?? 0;

		const truncate = (value: string, maxLength: number) =>
			value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

		const historyEntry: HistoryEntry = {
			model,
			sessionId: ctx.sessionId,
			text: truncate(text, 50),
			timestamp: new Date().toISOString(),
			tokens,
			toLanguage,
			translation: truncate(translation, 50),
		};

		await ctx.thread.state.push('history', historyEntry, 5);
		const history = (await ctx.thread.state.get<HistoryEntry[]>('history')) ?? [];

		return {
			history,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
			tokens,
			translation,
			translationCount: history.length,
		};
	},
});

export default translateAgent;
