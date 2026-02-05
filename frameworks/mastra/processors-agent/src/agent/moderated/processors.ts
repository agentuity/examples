/**
 * Processors: Transform, validate, or control messages in the agent pipeline.
 * Implements Mastra-style processor patterns in Agentuity.
 *
 * Input processors run before the LLM call.
 * Output processors run after the LLM generates a response.
 */

import { s } from '@agentuity/schema';
import type OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

export interface ProcessorContext {
	logger: {
		info: (message: string, data?: Record<string, unknown>) => void;
		warn: (message: string, data?: Record<string, unknown>) => void;
		error: (message: string, data?: Record<string, unknown>) => void;
	};
	threadId: string;
	sessionId: string;
}

export interface InputProcessorResult {
	/** Transformed/validated text */
	text: string;
	/** Whether processing should continue */
	continue: boolean;
	/** Reason if processing was blocked */
	blockedReason?: string;
	/** Metadata from processing */
	metadata?: Record<string, unknown>;
}

export interface OutputProcessorResult {
	/** Transformed response text */
	text: string;
	/** Whether to retry with feedback */
	retry?: boolean;
	/** Feedback for retry */
	retryFeedback?: string;
	/** Metadata from processing */
	metadata?: Record<string, unknown>;
}

export interface ModerationResult {
	flagged: boolean;
	categories: string[];
	scores: Record<string, number>;
}

// ============================================================================
// Input Processors
// ============================================================================

/**
 * Normalizes unicode text to prevent homoglyph attacks and ensure consistent processing.
 */
export function unicodeNormalizer(text: string): string {
	// NFC normalization: canonical decomposition followed by canonical composition
	return text.normalize('NFC');
}

/**
 * Validates input length and basic structure.
 */
export function lengthValidator(
	text: string,
	options: { minLength?: number; maxLength?: number } = {}
): InputProcessorResult {
	const { minLength = 1, maxLength = 10000 } = options;

	if (text.length < minLength) {
		return {
			text,
			continue: false,
			blockedReason: `Input too short. Minimum length: ${minLength} characters.`,
		};
	}

	if (text.length > maxLength) {
		return {
			text,
			continue: false,
			blockedReason: `Input too long. Maximum length: ${maxLength} characters.`,
		};
	}

	return { text, continue: true };
}

/**
 * Detects common prompt injection patterns.
 * Returns blocked if injection attempt is detected.
 */
export function promptInjectionDetector(text: string): InputProcessorResult {
	// Common injection patterns
	const injectionPatterns = [
		/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
		/disregard\s+(all\s+)?(previous|above|prior)/i,
		/forget\s+(everything|all|your)\s+(you|instructions?)/i,
		/you\s+are\s+now\s+(a|an)\s+/i,
		/new\s+instructions?:/i,
		/system\s*:\s*/i,
		/\[system\]/i,
		/<\s*system\s*>/i,
		/pretend\s+(you\s+are|to\s+be)/i,
		/act\s+as\s+(if|though)/i,
		/roleplay\s+as/i,
		/jailbreak/i,
		/bypass\s+(safety|security|filter)/i,
	];

	for (const pattern of injectionPatterns) {
		if (pattern.test(text)) {
			return {
				text,
				continue: false,
				blockedReason: 'Potential prompt injection detected. Request blocked for safety.',
				metadata: { detectedPattern: pattern.source },
			};
		}
	}

	return { text, continue: true };
}

/**
 * Detects and optionally redacts PII (Personally Identifiable Information).
 * Supports email, phone, SSN, and credit card patterns.
 */
export function piiDetector(
	text: string,
	options: { strategy: 'detect' | 'redact' | 'block' } = { strategy: 'detect' }
): InputProcessorResult {
	const { strategy } = options;

	const piiPatterns: { name: string; pattern: RegExp; replacement: string }[] = [
		{
			name: 'email',
			pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
			replacement: '[EMAIL_REDACTED]',
		},
		{
			name: 'phone',
			pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
			replacement: '[PHONE_REDACTED]',
		},
		{
			name: 'ssn',
			pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
			replacement: '[SSN_REDACTED]',
		},
		{
			name: 'creditCard',
			pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
			replacement: '[CC_REDACTED]',
		},
	];

	const detectedPii: string[] = [];
	let processedText = text;

	for (const { name, pattern, replacement } of piiPatterns) {
		const matches = text.match(pattern);
		if (matches) {
			detectedPii.push(name);
			if (strategy === 'redact') {
				processedText = processedText.replace(pattern, replacement);
			}
		}
	}

	if (detectedPii.length > 0) {
		if (strategy === 'block') {
			return {
				text,
				continue: false,
				blockedReason: `PII detected: ${detectedPii.join(', ')}. Request blocked for privacy.`,
				metadata: { detectedPii },
			};
		}

		return {
			text: processedText,
			continue: true,
			metadata: {
				detectedPii,
				piiRedacted: strategy === 'redact',
			},
		};
	}

	return { text, continue: true };
}

/**
 * Content moderation using OpenAI's moderation API.
 * Checks for harmful content categories.
 */
export async function moderationProcessor(
	client: OpenAI,
	text: string,
	options: {
		categories?: string[];
		threshold?: number;
		strategy: 'block' | 'flag';
	} = { strategy: 'block' }
): Promise<InputProcessorResult> {
	const { categories, threshold = 0.7, strategy } = options;

	try {
		const moderation = await client.moderations.create({
			input: text,
		});

		const result = moderation.results[0];
		if (!result) {
			return { text, continue: true };
		}

		const flaggedCategories: string[] = [];
		const scores: Record<string, number> = {};

		// Check each category
		for (const [category, score] of Object.entries(result.category_scores)) {
			scores[category] = score;

			// If specific categories are configured, only check those
			if (categories && !categories.includes(category)) {
				continue;
			}

			if (score >= threshold) {
				flaggedCategories.push(category);
			}
		}

		if (flaggedCategories.length > 0) {
			if (strategy === 'block') {
				return {
					text,
					continue: false,
					blockedReason: `Content flagged for: ${flaggedCategories.join(', ')}`,
					metadata: { flaggedCategories, scores },
				};
			}

			// Flag strategy: continue but include metadata
			return {
				text,
				continue: true,
				metadata: {
					moderation: {
						flagged: true,
						categories: flaggedCategories,
						scores,
					},
				},
			};
		}

		return {
			text,
			continue: true,
			metadata: { moderation: { flagged: false, scores } },
		};
	} catch (error) {
		// If moderation fails, log and continue (fail-open)
		return {
			text,
			continue: true,
			metadata: { moderationError: String(error) },
		};
	}
}

// ============================================================================
// Output Processors
// ============================================================================

/**
 * Checks response quality and optionally requests a retry.
 */
export async function qualityChecker(
	client: OpenAI,
	response: string,
	options: {
		minLength?: number;
		maxRetries?: number;
		currentRetry?: number;
		qualityPrompt?: string;
	} = {}
): Promise<OutputProcessorResult> {
	const {
		minLength = 10,
		maxRetries = 3,
		currentRetry = 0,
		qualityPrompt = 'Rate the quality and completeness of this response on a scale of 0-1.',
	} = options;

	// Basic length check
	if (response.trim().length < minLength) {
		if (currentRetry < maxRetries) {
			return {
				text: response,
				retry: true,
				retryFeedback: 'Response too short. Please provide a more detailed answer.',
				metadata: { qualityIssue: 'too_short', retryCount: currentRetry },
			};
		}
	}

	// AI-based quality check (optional, for more sophisticated checking)
	try {
		const QualitySchema = s.object({
			score: s.number().describe('Quality score from 0 to 1'),
			issues: s.array(s.string()).describe('List of quality issues found'),
			suggestion: s.string().describe('Suggestion for improvement'),
		});

		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'quality_check',
					schema: s.toJSONSchema(QualitySchema, { strict: true }) as Record<string, unknown>,
					strict: true,
				},
			},
			messages: [
				{
					role: 'user',
					content: `${qualityPrompt}\n\nResponse to evaluate:\n"${response}"`,
				},
			],
		});

		const content = completion.choices[0]?.message?.content;
		if (content) {
			const result = JSON.parse(content) as { score: number; issues: string[]; suggestion: string };

			if (result.score < 0.7 && currentRetry < maxRetries) {
				return {
					text: response,
					retry: true,
					retryFeedback: result.suggestion || 'Please improve the response quality.',
					metadata: {
						qualityScore: result.score,
						issues: result.issues,
						retryCount: currentRetry,
					},
				};
			}

			return {
				text: response,
				metadata: { qualityScore: result.score, issues: result.issues },
			};
		}
	} catch {
		// If quality check fails, continue with original response
	}

	return { text: response };
}

/**
 * Adds metadata to the response (timestamps, processing info, etc.)
 */
export function metadataEnricher(
	response: string,
	additionalMetadata: Record<string, unknown> = {}
): OutputProcessorResult {
	return {
		text: response,
		metadata: {
			processedAt: new Date().toISOString(),
			responseLength: response.length,
			...additionalMetadata,
		},
	};
}

/**
 * Filters or transforms the response text.
 */
export function responseFilter(
	response: string,
	options: {
		maxLength?: number;
		removePii?: boolean;
	} = {}
): OutputProcessorResult {
	const { maxLength, removePii = false } = options;

	let text = response;

	// Truncate if too long
	if (maxLength && text.length > maxLength) {
		text = text.slice(0, maxLength) + '... [truncated]';
	}

	// Remove PII from response
	if (removePii) {
		const piiResult = piiDetector(text, { strategy: 'redact' });
		text = piiResult.text;
	}

	return { text };
}

// ============================================================================
// Token Limiter
// ============================================================================

/**
 * Estimates token count using a simple heuristic (4 chars ≈ 1 token).
 * For production, use tiktoken or similar library.
 */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Limits input to stay within token budget.
 */
export function tokenLimiter(
	text: string,
	options: { limit: number; strategy: 'truncate' | 'block' } = { limit: 4000, strategy: 'truncate' }
): InputProcessorResult {
	const { limit, strategy } = options;
	const tokens = estimateTokens(text);

	if (tokens > limit) {
		if (strategy === 'block') {
			return {
				text,
				continue: false,
				blockedReason: `Input exceeds token limit (${tokens} > ${limit})`,
				metadata: { estimatedTokens: tokens, limit },
			};
		}

		// Truncate to fit within limit
		const charLimit = limit * 4;
		const truncated = text.slice(0, charLimit);

		return {
			text: truncated,
			continue: true,
			metadata: {
				truncated: true,
				originalTokens: tokens,
				truncatedTokens: estimateTokens(truncated),
			},
		};
	}

	return {
		text,
		continue: true,
		metadata: { estimatedTokens: tokens },
	};
}

// ============================================================================
// Pipeline Runner
// ============================================================================

export interface ProcessorPipelineOptions {
	inputProcessors: Array<(text: string, ctx: ProcessorContext) => InputProcessorResult | Promise<InputProcessorResult>>;
	outputProcessors: Array<
		(text: string, ctx: ProcessorContext, retryCount: number) => OutputProcessorResult | Promise<OutputProcessorResult>
	>;
}

/**
 * Runs a pipeline of input processors in sequence.
 * Stops if any processor returns continue: false.
 */
export async function runInputPipeline(
	text: string,
	processors: Array<(text: string) => InputProcessorResult | Promise<InputProcessorResult>>,
	ctx: ProcessorContext
): Promise<InputProcessorResult> {
	let currentText = text;
	const allMetadata: Record<string, unknown> = {};

	for (const processor of processors) {
		const result = await processor(currentText);

		// Merge metadata
		if (result.metadata) {
			Object.assign(allMetadata, result.metadata);
		}

		if (!result.continue) {
			ctx.logger.warn('Input processor blocked request', {
				reason: result.blockedReason,
				metadata: result.metadata,
			});

			return {
				...result,
				metadata: allMetadata,
			};
		}

		currentText = result.text;
	}

	return {
		text: currentText,
		continue: true,
		metadata: allMetadata,
	};
}

/**
 * Runs a pipeline of output processors in sequence.
 * Handles retry logic if any processor requests it.
 */
export async function runOutputPipeline(
	text: string,
	processors: Array<(text: string, retryCount: number) => OutputProcessorResult | Promise<OutputProcessorResult>>,
	ctx: ProcessorContext,
	retryCount: number = 0
): Promise<OutputProcessorResult> {
	let currentText = text;
	const allMetadata: Record<string, unknown> = {};

	for (const processor of processors) {
		const result = await processor(currentText, retryCount);

		// Merge metadata
		if (result.metadata) {
			Object.assign(allMetadata, result.metadata);
		}

		if (result.retry) {
			ctx.logger.info('Output processor requested retry', {
				feedback: result.retryFeedback,
				retryCount,
			});

			return {
				...result,
				metadata: allMetadata,
			};
		}

		currentText = result.text;
	}

	return {
		text: currentText,
		metadata: allMetadata,
	};
}
