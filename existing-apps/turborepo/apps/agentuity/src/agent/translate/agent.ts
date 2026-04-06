/**
 * Translation Agent: translates text using AI models via the Agentuity AI Gateway.
 * Stores translation history in thread state for persistence across requests.
 * Uses shared schemas from @tanstack-turborepo/shared for type safety across the monorepo.
 */
import { createAgent } from '@agentuity/runtime';
import OpenAI from 'openai';
import {
	TranslateInputSchema,
	TranslateOutputSchema,
	type HistoryEntry,
} from '@tanstack-turborepo/shared';

const agent = createAgent('translate', {
	description: 'Translates text to different languages',
	schema: {
		input: TranslateInputSchema,
		output: TranslateOutputSchema,
	},
	handler: async (ctx, { text, toLanguage = 'Spanish', model = 'gpt-5-nano' }) => {
		ctx.logger.info('Translation request received', { toLanguage, model, textLength: text.length });

		const completion = await new OpenAI().chat.completions.create({
			model,
			messages: [{ role: 'user', content: `Translate to ${toLanguage}:\n\n${text}` }],
		});

		const translation = completion.choices[0]?.message?.content ?? '';
		const tokens = completion.usage?.total_tokens ?? 0;

		const truncate = (str: string, len: number) =>
			str.length > len ? `${str.slice(0, len)}...` : str;

		const newEntry: HistoryEntry = {
			model,
			sessionId: ctx.sessionId,
			text: truncate(text, 50),
			timestamp: new Date().toISOString(),
			tokens,
			toLanguage,
			translation: truncate(translation, 50),
		};

		await ctx.thread.state.push('history', newEntry, 5);

		const history = (await ctx.thread.state.get<HistoryEntry[]>('history')) ?? [];

		ctx.logger.info('Translation complete', {
			tokens,
			historyCount: history.length,
		});

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

export default agent;
