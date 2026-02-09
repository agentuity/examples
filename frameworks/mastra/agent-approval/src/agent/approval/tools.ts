/**
 * Tool definitions for the approval agent.
 *
 * Demonstrates tool call approval patterns from Mastra:
 * - Tools without approval: execute immediately (get_weather, search_records)
 * - Tools with requireApproval: suspend for human approval (delete_user_data, send_notification)
 *
 * Each tool has an OpenAI function definition for the LLM, and an executor
 * that simulates the actual operation.
 */

import type OpenAI from 'openai';

// ============================================================================
// OpenAI Function Definitions
// ============================================================================

export const toolDefinitions: OpenAI.ChatCompletionTool[] = [
	{
		type: 'function',
		function: {
			name: 'get_weather',
			description: 'Fetches current weather for a location',
			parameters: {
				type: 'object',
				properties: {
					location: { type: 'string', description: 'City or location name' },
				},
				required: ['location'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'search_records',
			description: 'Searches records in the database by keyword',
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
			name: 'delete_user_data',
			description: 'Permanently deletes all data for a user. This is destructive and irreversible.',
			parameters: {
				type: 'object',
				properties: {
					userId: { type: 'string', description: 'The user ID whose data to delete' },
					reason: { type: 'string', description: 'Reason for deletion' },
				},
				required: ['userId', 'reason'],
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
];

// ============================================================================
// Approval Configuration
// ============================================================================

/**
 * Tools that require approval before execution (tool-level approval).
 * Mirrors Mastra's `requireApproval: true` on individual tool definitions.
 */
export const TOOLS_REQUIRING_APPROVAL = new Set(['delete_user_data', 'send_notification']);

/**
 * Suspend reasons for tools that require approval.
 * Mirrors Mastra's `suspend({ reason })` pattern where tools provide
 * context about why approval is needed.
 */
export const TOOL_SUSPEND_REASONS: Record<string, string> = {
	delete_user_data: 'This will permanently delete all user data. This action cannot be undone.',
	send_notification: 'This will send an external notification to the specified recipient.',
};

// ============================================================================
// Tool Executors
// ============================================================================

export interface ToolResult {
	success: boolean;
	data: Record<string, unknown>;
}

/**
 * Executes a tool by name with the given arguments.
 * In a real application, these would call actual APIs or databases.
 */
export async function executeTool(toolName: string, args: Record<string, string>): Promise<ToolResult> {
	switch (toolName) {
		case 'get_weather': {
			const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy', 'Windy'];
			return {
				success: true,
				data: {
					location: args.location ?? 'Unknown',
					temperature: `${Math.floor(Math.random() * 30) + 40}°F`,
					condition: conditions[Math.floor(Math.random() * conditions.length)] ?? 'Unknown',
					humidity: `${Math.floor(Math.random() * 60) + 30}%`,
				},
			};
		}

		case 'search_records': {
			return {
				success: true,
				data: {
					query: args.query ?? '',
					results: [
						{ id: '1', name: `Result for "${args.query}" #1`, relevance: 0.95 },
						{ id: '2', name: `Result for "${args.query}" #2`, relevance: 0.82 },
					],
					total: 2,
				},
			};
		}

		case 'delete_user_data': {
			return {
				success: true,
				data: {
					deleted: true,
					userId: args.userId ?? '',
					reason: args.reason ?? '',
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

		default:
			return { success: false, data: { error: `Unknown tool: ${toolName}` } };
	}
}
