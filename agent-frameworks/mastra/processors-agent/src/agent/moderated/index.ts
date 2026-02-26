/**
 * Moderated Agent: Demonstrates Mastra-style processors in Agentuity.
 *
 * Processors run at specific points in the agent's execution pipeline:
 * - Input processors: Run before messages reach the LLM
 * - Output processors: Run after the LLM generates a response
 *
 * This agent implements:
 * - Unicode normalization
 * - Length validation
 * - Prompt injection detection
 * - PII detection/redaction
 * - Content moderation
 * - Token limiting
 * - Quality checking with retry
 * - Response metadata enrichment
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

import {
	lengthValidator,
	metadataEnricher,
	moderationProcessor,
	piiDetector,
	promptInjectionDetector,
	qualityChecker,
	responseFilter,
	runInputPipeline,
	runOutputPipeline,
	tokenLimiter,
	unicodeNormalizer,
	type InputProcessorResult,
	type OutputProcessorResult,
	type ProcessorContext,
} from './processors';

const client = new OpenAI();

// ============================================================================
// Configuration
// ============================================================================

const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const DEFAULT_CONFIG = {
	// Input processor settings
	maxInputLength: 10000,
	minInputLength: 1,
	tokenLimit: 4000,
	piiStrategy: 'redact' as const,
	moderationThreshold: 0.7,
	moderationCategories: ['hate', 'harassment', 'violence', 'self-harm'],

	// Output processor settings
	maxRetries: 3,
	minResponseLength: 10,
	maxResponseLength: 8000,
};

// ============================================================================
// Schemas
// ============================================================================

export const ProcessorConfigSchema = s.object({
	// Input processors
	enableModeration: s.boolean().optional().describe('Enable content moderation'),
	enablePiiDetection: s.boolean().optional().describe('Enable PII detection/redaction'),
	enableInjectionDetection: s.boolean().optional().describe('Enable prompt injection detection'),
	piiStrategy: s.enum(['detect', 'redact', 'block']).optional().describe('How to handle detected PII'),
	maxInputLength: s.number().optional().describe('Maximum input length in characters'),
	tokenLimit: s.number().optional().describe('Maximum token limit for input'),

	// Output processors
	enableQualityCheck: s.boolean().optional().describe('Enable AI-based quality checking'),
	enableResponseFilter: s.boolean().optional().describe('Enable response filtering'),
	maxResponseLength: s.number().optional().describe('Maximum response length'),
});

export type ProcessorConfig = s.infer<typeof ProcessorConfigSchema>;

export const ProcessingMetadataSchema = s.object({
	inputProcessors: s.array(s.string()).describe('Input processors that ran'),
	outputProcessors: s.array(s.string()).describe('Output processors that ran'),
	blocked: s.boolean().describe('Whether request was blocked'),
	blockedReason: s.string().optional().describe('Reason for blocking'),
	retryCount: s.number().describe('Number of LLM retries'),
	piiDetected: s.array(s.string()).optional().describe('PII types detected'),
	piiRedacted: s.boolean().optional().describe('Whether PII was redacted'),
	moderationResult: s
		.object({
			flagged: s.boolean(),
			categories: s.array(s.string()).optional(),
		})
		.optional()
		.describe('Content moderation result'),
	qualityScore: s.number().optional().describe('AI quality score (0-1)'),
	estimatedTokens: s.number().optional().describe('Estimated input tokens'),
	processedAt: s.string().optional().describe('Processing timestamp'),
});

export type ProcessingMetadata = s.infer<typeof ProcessingMetadataSchema>;

export const AgentInput = s.object({
	text: s.string().describe('The text to process'),
	systemPrompt: s.string().optional().describe('Optional system prompt for the LLM'),
	model: s.enum(MODELS).optional().describe('AI model to use'),
	config: ProcessorConfigSchema.optional().describe('Processor configuration'),
});

export type AgentInputType = s.infer<typeof AgentInput>;

export const AgentOutput = s.object({
	response: s.string().describe('The LLM response (may be error message if blocked)'),
	success: s.boolean().describe('Whether processing completed successfully'),
	threadId: s.string().describe('Thread ID'),
	sessionId: s.string().describe('Session ID'),
	tokens: s.number().describe('Tokens used'),
	processingMetadata: ProcessingMetadataSchema.describe('Detailed processing metadata'),
});

export type AgentOutputType = s.infer<typeof AgentOutput>;

// ============================================================================
// Agent Implementation
// ============================================================================

const agent = createAgent('moderated', {
	description: 'Processes text with input/output processors (moderation, PII, quality checks)',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		const { text, systemPrompt, model = 'gpt-5-nano', config = {} } = input;

		// Build processor context
		const processorCtx: ProcessorContext = {
			logger: ctx.logger,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
		};

		// Merge config with defaults
		const {
			enableModeration = true,
			enablePiiDetection = true,
			enableInjectionDetection = true,
			piiStrategy = DEFAULT_CONFIG.piiStrategy,
			maxInputLength = DEFAULT_CONFIG.maxInputLength,
			tokenLimit = DEFAULT_CONFIG.tokenLimit,
			enableQualityCheck = false, // Disabled by default (adds latency)
			enableResponseFilter = true,
			maxResponseLength = DEFAULT_CONFIG.maxResponseLength,
		} = config;

		ctx.logger.info('──── Moderated Agent ────');
		ctx.logger.info('Processing input', {
			textLength: text.length,
			model,
			config: {
				enableModeration,
				enablePiiDetection,
				enableInjectionDetection,
				enableQualityCheck,
			},
		});

		// Track which processors ran
		const inputProcessorsRan: string[] = [];
		const outputProcessorsRan: string[] = [];

		// ====================================================================
		// INPUT PROCESSING PIPELINE
		// ====================================================================

		// Build input processor pipeline based on config
		const inputProcessors: Array<(text: string) => InputProcessorResult | Promise<InputProcessorResult>> = [];

		// 1. Unicode normalization (always enabled)
		inputProcessors.push((t) => {
			inputProcessorsRan.push('unicodeNormalizer');
			return { text: unicodeNormalizer(t), continue: true };
		});

		// 2. Length validation
		inputProcessors.push((t) => {
			inputProcessorsRan.push('lengthValidator');
			return lengthValidator(t, { maxLength: maxInputLength });
		});

		// 3. Prompt injection detection
		if (enableInjectionDetection) {
			inputProcessors.push((t) => {
				inputProcessorsRan.push('promptInjectionDetector');
				return promptInjectionDetector(t);
			});
		}

		// 4. PII detection/redaction
		if (enablePiiDetection) {
			inputProcessors.push((t) => {
				inputProcessorsRan.push('piiDetector');
				return piiDetector(t, { strategy: piiStrategy });
			});
		}

		// 5. Content moderation
		if (enableModeration) {
			inputProcessors.push(async (t) => {
				inputProcessorsRan.push('moderationProcessor');
				return moderationProcessor(client, t, {
					categories: DEFAULT_CONFIG.moderationCategories,
					threshold: DEFAULT_CONFIG.moderationThreshold,
					strategy: 'block',
				});
			});
		}

		// 6. Token limiter (always last input processor)
		inputProcessors.push((t) => {
			inputProcessorsRan.push('tokenLimiter');
			return tokenLimiter(t, { limit: tokenLimit, strategy: 'truncate' });
		});

		// Run input pipeline
		const inputResult = await runInputPipeline(text, inputProcessors, processorCtx);

		// If blocked by input processor, return early
		if (!inputResult.continue) {
			ctx.logger.warn('Request blocked by input processor', {
				reason: inputResult.blockedReason,
			});

			return {
				response: inputResult.blockedReason || 'Request blocked by safety filters.',
				success: false,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens: 0,
				processingMetadata: {
					inputProcessors: inputProcessorsRan,
					outputProcessors: [],
					blocked: true,
					blockedReason: inputResult.blockedReason,
					retryCount: 0,
					piiDetected: inputResult.metadata?.detectedPii as string[] | undefined,
					piiRedacted: inputResult.metadata?.piiRedacted as boolean | undefined,
					moderationResult: inputResult.metadata?.moderation as { flagged: boolean; categories?: string[] } | undefined,
					estimatedTokens: inputResult.metadata?.estimatedTokens as number | undefined,
				},
			};
		}

		const processedInput = inputResult.text;

		ctx.logger.info('Input processing complete', {
			processorsRan: inputProcessorsRan,
			piiDetected: inputResult.metadata?.detectedPii,
			estimatedTokens: inputResult.metadata?.estimatedTokens,
		});

		// ====================================================================
		// LLM CALL (with retry support)
		// ====================================================================

		let retryCount = 0;
		let response = '';
		let totalTokens = 0;
		let outputResult: OutputProcessorResult = { text: '' };

		const maxRetries = enableQualityCheck ? DEFAULT_CONFIG.maxRetries : 0;

		while (retryCount <= maxRetries) {
			// Build messages
			const messages: OpenAI.ChatCompletionMessageParam[] = [];

			if (systemPrompt) {
				messages.push({ role: 'system', content: systemPrompt });
			}

			// Add retry feedback if this is a retry
			if (retryCount > 0 && outputResult.retryFeedback) {
				messages.push({
					role: 'system',
					content: `Previous response was inadequate. Feedback: ${outputResult.retryFeedback}`,
				});
			}

			messages.push({ role: 'user', content: processedInput });

			ctx.logger.info('Calling LLM', { model, retryCount, messageCount: messages.length });

			const completion = await client.chat.completions.create({
				model,
				messages,
			});

			response = completion.choices[0]?.message?.content ?? '';
			totalTokens += completion.usage?.total_tokens ?? 0;

			// ====================================================================
			// OUTPUT PROCESSING PIPELINE
			// ====================================================================

			// Reset for each attempt
			outputProcessorsRan.length = 0;

			// Build output processor pipeline
			const outputProcessors: Array<(t: string, retry: number) => OutputProcessorResult | Promise<OutputProcessorResult>> =
				[];

			// 1. Quality checker (if enabled)
			if (enableQualityCheck) {
				outputProcessors.push(async (t, retry) => {
					outputProcessorsRan.push('qualityChecker');
					return qualityChecker(client, t, {
						minLength: DEFAULT_CONFIG.minResponseLength,
						maxRetries,
						currentRetry: retry,
					});
				});
			}

			// 2. Response filter
			if (enableResponseFilter) {
				outputProcessors.push((t) => {
					outputProcessorsRan.push('responseFilter');
					return responseFilter(t, { maxLength: maxResponseLength, removePii: enablePiiDetection });
				});
			}

			// 3. Metadata enricher (always last)
			outputProcessors.push((t) => {
				outputProcessorsRan.push('metadataEnricher');
				return metadataEnricher(t, {
					model,
					retryCount,
					inputTokens: inputResult.metadata?.estimatedTokens,
				});
			});

			// Run output pipeline
			outputResult = await runOutputPipeline(response, outputProcessors, processorCtx, retryCount);

			// Check if retry requested
			if (outputResult.retry && retryCount < maxRetries) {
				ctx.logger.info('Output processor requested retry', {
					retryCount,
					feedback: outputResult.retryFeedback,
				});
				retryCount++;
				continue;
			}

			// No retry needed or max retries reached
			break;
		}

		ctx.logger.info('Processing complete', {
			inputProcessors: inputProcessorsRan,
			outputProcessors: outputProcessorsRan,
			retryCount,
			totalTokens,
			responseLength: outputResult.text.length,
		});

		// Store processing stats in thread state
		await ctx.thread.state.push(
			'processingHistory',
			{
				timestamp: new Date().toISOString(),
				sessionId: ctx.sessionId,
				inputLength: text.length,
				outputLength: outputResult.text.length,
				tokens: totalTokens,
				retryCount,
				blocked: false,
			},
			10
		);

		return {
			response: outputResult.text,
			success: true,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			tokens: totalTokens,
			processingMetadata: {
				inputProcessors: inputProcessorsRan,
				outputProcessors: outputProcessorsRan,
				blocked: false,
				retryCount,
				piiDetected: inputResult.metadata?.detectedPii as string[] | undefined,
				piiRedacted: inputResult.metadata?.piiRedacted as boolean | undefined,
				moderationResult: inputResult.metadata?.moderation as { flagged: boolean; categories?: string[] } | undefined,
				qualityScore: outputResult.metadata?.qualityScore as number | undefined,
				estimatedTokens: inputResult.metadata?.estimatedTokens as number | undefined,
				processedAt: outputResult.metadata?.processedAt as string | undefined,
			},
		};
	},
});

export default agent;
