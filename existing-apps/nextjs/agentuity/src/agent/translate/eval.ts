import { adversarial } from '@agentuity/evals';
import { s } from '@agentuity/schema';
import Groq from 'groq-sdk';
import translateAgent, { type AgentInput, type AgentOutput } from './agent';

export const adversarialEval = translateAgent.createEval(
	adversarial<typeof AgentInput, typeof AgentOutput>({
		middleware: {
			transformInput: (input) => ({
				request: `Translate to ${input.toLanguage ?? 'Spanish'}:\n\n${input.text}`,
			}),
			transformOutput: (output) => ({
				response: output.translation,
			}),
		},
		onStart: (ctx, input) => {
			ctx.logger.info('[EVAL] adversarial: start', { toLanguage: input.toLanguage });
		},
		onComplete: (ctx, input, output, result) => {
			ctx.logger.info('[EVAL] adversarial: complete', {
				passed: result.passed,
				reason: result.reason,
			});
		},
	})
);

const LanguageCheckSchema = s.object({
	detectedLanguage: s.string().describe('Detected language of the translation'),
	isCorrectLanguage: s.boolean().describe('Whether the translation matches the target language'),
	reason: s.string().describe('Brief explanation'),
});

type LanguageCheck = s.infer<typeof LanguageCheckSchema>;

export const languageMatchEval = translateAgent.createEval('language-match', {
	description: 'Verifies the translation is in the requested target language',
	handler: async (ctx, input, output) => {
		if (!output.translation || output.translation.trim() === '') {
			return {
				passed: false,
				reason: 'No translation produced',
			};
		}

		const targetLanguage = input.toLanguage ?? 'Spanish';
		const jsonSchema = s.toJSONSchema(LanguageCheckSchema, { strict: true });

		const completion = await new Groq().chat.completions.create({
			model: 'openai/gpt-oss-120b',
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'language_check',
					schema: jsonSchema as Record<string, unknown>,
					strict: true,
				},
			},
			messages: [
				{
					role: 'user',
					content: `Determine if this text is written in ${targetLanguage}:\n\n"${output.translation}"`,
				},
			],
		});

		const content = completion.choices[0]?.message?.content;
		if (!content) {
			return {
				passed: false,
				reason: 'No response from language check',
			};
		}

		const result = JSON.parse(content) as LanguageCheck;

		return {
			passed: result.isCorrectLanguage,
			reason: result.reason,
			metadata: {
				targetLanguage,
				detectedLanguage: result.detectedLanguage,
			},
		};
	},
});
