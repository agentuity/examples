/**
 * Tool definitions for the network agent.
 *
 * Demonstrates Mastra's network approval patterns with tools organized by sub-agent:
 * - Research sub-agent: search_web, lookup_info (no approval, execute immediately)
 * - Operations sub-agent: delete_records, send_notification (require approval)
 * - Confirmation sub-agent: request_confirmation (suspend/resume pattern)
 *
 * Research tools use the AI Gateway to generate real responses.
 * Operations tools are simulated (the point is the approval flow, not actual deletion/notification).
 */

import OpenAI from 'openai';

const client = new OpenAI();

// ============================================================================
// Sub-Agent Tool Groupings
// ============================================================================

/** Maps each tool to its conceptual sub-agent within the network */
export const TOOL_SUB_AGENTS: Record<string, string> = {
	search_web: 'research',
	lookup_info: 'research',
	delete_records: 'operations',
	send_notification: 'operations',
	request_confirmation: 'confirmation',
};

// ============================================================================
// OpenAI Function Definitions
// ============================================================================

export const toolDefinitions: OpenAI.ChatCompletionTool[] = [
	// ── Research Sub-Agent ─────────────────────────────────────────────────
	{
		type: 'function',
		function: {
			name: 'search_web',
			description: 'Searches the web for information on a topic',
			parameters: {
				type: 'object',
				properties: {
					query: { type: 'string', description: 'Search query' },
				},
				required: ['query'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'lookup_info',
			description: 'Looks up detailed information about a specific entity (person, company, product)',
			parameters: {
				type: 'object',
				properties: {
					entity: { type: 'string', description: 'Name or ID of the entity to look up' },
				},
				required: ['entity'],
			},
		},
	},
	// ── Operations Sub-Agent (requires approval) ───────────────────────────
	{
		type: 'function',
		function: {
			name: 'delete_records',
			description: 'Permanently deletes records matching the criteria. This is destructive and irreversible.',
			parameters: {
				type: 'object',
				properties: {
					criteria: { type: 'string', description: 'Delete criteria or filter' },
					scope: { type: 'string', enum: ['all', 'matching', 'expired'], description: 'Scope of deletion' },
				},
				required: ['criteria', 'scope'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'send_notification',
			description: 'Sends a notification to a user via email or SMS',
			parameters: {
				type: 'object',
				properties: {
					recipient: { type: 'string', description: 'Email address or phone number' },
					message: { type: 'string', description: 'Notification message content' },
					channel: { type: 'string', enum: ['email', 'sms'], description: 'Delivery channel' },
				},
				required: ['recipient', 'message', 'channel'],
			},
		},
	},
	// ── Confirmation Sub-Agent (suspend/resume pattern) ────────────────────
	{
		type: 'function',
		function: {
			name: 'request_confirmation',
			description:
				'Requests explicit user confirmation before proceeding with an action. Use when the user needs to provide specific data or make a choice before continuing.',
			parameters: {
				type: 'object',
				properties: {
					action: { type: 'string', description: 'Description of the action requiring confirmation' },
					options: {
						type: 'string',
						description: 'Comma-separated options the user can choose from (e.g. "yes,no" or "option-a,option-b")',
					},
				},
				required: ['action'],
			},
		},
	},
];

// ============================================================================
// Approval Configuration
// ============================================================================

/**
 * Tools that require approval before execution (tool-level approval).
 * Mirrors Mastra's `requireApproval: true` on individual tool definitions.
 */
export const TOOLS_REQUIRING_APPROVAL = new Set(['delete_records', 'send_notification']);

/**
 * Tools that use the suspend/resume pattern.
 * Mirrors Mastra's tools that call `suspend()` with a payload and await `resumeData`.
 */
export const TOOLS_WITH_SUSPEND = new Set(['request_confirmation']);

/**
 * Suspend reasons for tools that require approval.
 * Mirrors Mastra's `suspend({ reason })` pattern.
 */
export const TOOL_SUSPEND_REASONS: Record<string, string> = {
	delete_records: 'This will permanently delete records. This action cannot be undone.',
	send_notification: 'This will send an external notification to the specified recipient.',
};

// ============================================================================
// Suspend Payload Generator
// ============================================================================

/**
 * Generates the suspend payload for a tool that uses the suspend/resume pattern.
 * Mirrors Mastra's `suspend({ message, action })` pattern where tools provide
 * context about what data is needed from the user.
 */
export function getSuspendPayload(toolName: string, args: Record<string, string>): Record<string, string> {
	switch (toolName) {
		case 'request_confirmation':
			return {
				message: `Please confirm: ${args.action ?? 'unknown action'}`,
				action: args.action ?? '',
				options: args.options ?? 'yes,no',
			};
		default:
			return { message: `Tool "${toolName}" is waiting for input.` };
	}
}

// ============================================================================
// Tool Executors
// ============================================================================

export interface ToolResult {
	success: boolean;
	data: Record<string, unknown>;
}

/** Executes a tool by name with the given arguments and an optional model override */
export async function executeTool(
	toolName: string,
	args: Record<string, string>,
	model = 'gpt-5-nano'
): Promise<ToolResult> {
	switch (toolName) {
		case 'search_web': {
			const query = args.query ?? '';
			const completion = await client.chat.completions.create({
				model,
				messages: [
					{
						role: 'system',
						content:
							'You are a web search tool. Given a search query, return a concise summary of relevant information. Respond with factual, up-to-date information in 2-3 short paragraphs.',
					},
					{ role: 'user', content: query },
				],
			});

			return {
				success: true,
				data: {
					query,
					summary: completion.choices[0]?.message?.content ?? '',
					tokens: completion.usage?.total_tokens ?? 0,
				},
			};
		}

		case 'lookup_info': {
			const entity = args.entity ?? '';
			const completion = await client.chat.completions.create({
				model,
				messages: [
					{
						role: 'system',
						content:
							'You are an information lookup tool. Given an entity name (person, company, product, etc.), return a concise factual overview. Include key details like what it is, when it was founded/created, and why it is notable. Respond in 2-3 short paragraphs.',
					},
					{ role: 'user', content: entity },
				],
			});

			return {
				success: true,
				data: {
					entity,
					summary: completion.choices[0]?.message?.content ?? '',
					tokens: completion.usage?.total_tokens ?? 0,
				},
			};
		}

		// Operations tools are simulated - the point is the approval flow
		case 'delete_records': {
			return {
				success: true,
				data: {
					deleted: true,
					criteria: args.criteria ?? '',
					scope: args.scope ?? 'matching',
					recordsRemoved: Math.floor(Math.random() * 50) + 5,
					timestamp: new Date().toISOString(),
				},
			};
		}

		case 'send_notification': {
			return {
				success: true,
				data: {
					sent: true,
					recipient: args.recipient ?? '',
					channel: args.channel ?? 'email',
					messagePreview: (args.message ?? '').slice(0, 100),
					timestamp: new Date().toISOString(),
				},
			};
		}

		case 'request_confirmation': {
			return {
				success: true,
				data: {
					confirmed: true,
					action: args.action ?? '',
					timestamp: new Date().toISOString(),
				},
			};
		}

		default:
			return { success: false, data: { error: `Unknown tool: ${toolName}` } };
	}
}

/**
 * Executes a confirmation tool with resume data from the user.
 * Mirrors Mastra's tool execution with `resumeData` context passed
 * when the network is resumed after a `suspend()` call.
 */
export function executeConfirmationTool(args: Record<string, string>, resumeData: Record<string, unknown>): ToolResult {
	return {
		success: true,
		data: {
			confirmed: resumeData.confirmed ?? false,
			action: args.action ?? '',
			userChoice: resumeData.choice ?? 'confirmed',
			timestamp: new Date().toISOString(),
		},
	};
}
