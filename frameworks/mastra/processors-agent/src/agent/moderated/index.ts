/**
 * Moderated Agent: Uses Mastra's built-in processors inside an Agentuity handler.
 *
 * Processors run at specific points in the agent's execution pipeline:
 * - Input processors: Run before messages reach the LLM
 * - Output processors: Run after the LLM generates a response
 *
 * This agent uses:
 * - UnicodeNormalizer: Strips control chars and collapses whitespace
 * - PromptInjectionDetector: Detects and rewrites injection/jailbreak attempts
 * - PIIDetector: Detects and redacts PII (email, phone, credit-card)
 * - ModerationProcessor: Blocks harmful content categories
 * - TokenLimiterProcessor: Truncates output to token budget
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { Agent } from '@mastra/core/agent';

import '../../lib/gateway';

import {
	ModerationProcessor,
	PIIDetector,
	PromptInjectionDetector,
	TokenLimiterProcessor,
	UnicodeNormalizer,
} from '@mastra/core/processors';

// ============================================================================
// Mastra Agent with processors
// ============================================================================

const moderatedMastraAgent = new Agent({
	id: 'moderated-agent',
	name: 'Moderated Agent',
	instructions: 'You are a helpful assistant. Respond to user requests clearly and concisely.',
	model: 'openai/gpt-4o-mini',
	inputProcessors: [
		new UnicodeNormalizer({
			stripControlChars: true,
			collapseWhitespace: true,
		}),
		new PromptInjectionDetector({
			model: 'openai/gpt-4o-mini',
			threshold: 0.8,
			strategy: 'rewrite',
			detectionTypes: ['injection', 'jailbreak', 'system-override'],
		}),
		new PIIDetector({
			model: 'openai/gpt-4o-mini',
			strategy: 'redact',
			detectionTypes: ['email', 'phone', 'credit-card'],
		}),
		new ModerationProcessor({
			model: 'openai/gpt-4o-mini',
			categories: ['hate', 'harassment', 'violence', 'self-harm'],
			threshold: 0.7,
			strategy: 'block',
		}),
	],
	outputProcessors: [
		new TokenLimiterProcessor({
			limit: 1000,
			strategy: 'truncate',
		}),
		new ModerationProcessor({
			model: 'openai/gpt-4o-mini',
			categories: ['hate', 'harassment', 'violence'],
			threshold: 0.7,
			strategy: 'block',
		}),
	],
});

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
	model: s.string().optional().describe('AI model to use (unused — Mastra agent uses its configured model)'),
	config: ProcessorConfigSchema.optional().describe('Processor configuration (informational)'),
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
	description: 'Processes text with Mastra input/output processors (moderation, PII, prompt injection, token limiting)',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		const { text } = input;

		ctx.logger.info('──── Moderated Agent ────');
		ctx.logger.info('Processing input via Mastra agent', {
			textLength: text.length,
		});

		// Delegate to the Mastra agent — processors run automatically
		const result = await moderatedMastraAgent.generate(text);

		const response = result.text ?? 'Unable to process your request.';
		const tokens = result.usage?.totalTokens ?? 0;

		// Check if any processor blocked the request via tripwire
		const blocked = !!result.tripwire;
		const blockedReason = result.tripwire?.reason;

		if (blocked) {
			ctx.logger.warn('Request blocked by processor tripwire', {
				reason: blockedReason,
				processorId: result.tripwire?.processorId,
			});

			return {
				response: blockedReason ?? 'Request blocked by safety filters.',
				success: false,
				threadId: ctx.thread.id,
				sessionId: ctx.sessionId,
				tokens,
				processingMetadata: {
					inputProcessors: ['unicode-normalizer', 'prompt-injection-detector', 'pii-detector', 'moderation-input'],
					outputProcessors: [],
					blocked: true,
					blockedReason,
					retryCount: 0,
					processedAt: new Date().toISOString(),
				},
			};
		}

		ctx.logger.info('Processing complete', {
			tokens,
			responseLength: response.length,
		});

		// Store processing stats in thread state
		await ctx.thread.state.push(
			'processingHistory',
			{
				timestamp: new Date().toISOString(),
				sessionId: ctx.sessionId,
				inputLength: text.length,
				outputLength: response.length,
				tokens,
				retryCount: 0,
				blocked: false,
			},
			10
		);

		return {
			response,
			success: true,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			tokens,
			processingMetadata: {
				inputProcessors: ['unicode-normalizer', 'prompt-injection-detector', 'pii-detector', 'moderation-input'],
				outputProcessors: ['token-limiter', 'moderation-output'],
				blocked: false,
				retryCount: 0,
				processedAt: new Date().toISOString(),
			},
		};
	},
});

export default agent;
