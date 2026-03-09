/**
 * Tool definitions for the network agent.
 *
 * Demonstrates Mastra's network approval patterns with tools organized by sub-agent:
 * - Research sub-agent: search-web, lookup-info (no approval, execute immediately)
 * - Operations sub-agent: delete-records, send-notification (require approval)
 * - Confirmation sub-agent: request-confirmation (suspend/resume pattern)
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ============================================================================
// Sub-Agent Tool Groupings
// ============================================================================

/** Maps each tool to its conceptual sub-agent within the network */
export const TOOL_SUB_AGENTS: Record<string, string> = {
	'search-web': 'research',
	'lookup-info': 'research',
	'delete-records': 'operations',
	'send-notification': 'operations',
	'request-confirmation': 'confirmation',
};

// ============================================================================
// Approval Configuration
// ============================================================================

/**
 * Tools that require approval before execution (tool-level approval).
 * Mirrors Mastra's `requireApproval: true` on individual tool definitions.
 */
export const TOOLS_REQUIRING_APPROVAL = new Set(['delete-records', 'send-notification']);

/**
 * Tools that use the suspend/resume pattern.
 * Mirrors Mastra's tools that call `suspend()` with a payload and await `resumeData`.
 */
export const TOOLS_WITH_SUSPEND = new Set(['request-confirmation']);

/**
 * Suspend reasons for tools that require approval.
 * Mirrors Mastra's `suspend({ reason })` pattern.
 */
export const TOOL_SUSPEND_REASONS: Record<string, string> = {
	'delete-records': 'This will permanently delete records. This action cannot be undone.',
	'send-notification': 'This will send an external notification to the specified recipient.',
};

// ============================================================================
// Mastra Tool Definitions
// ============================================================================

// ── Research Sub-Agent ──────────────────────────────────────────────────────

export const searchWebTool = createTool({
	id: 'search-web',
	description: 'Searches the web for information on a topic',
	inputSchema: z.object({
		query: z.string().describe('Search query'),
	}),
	execute: async ({ query }: { query: string }) => {
		return {
			query,
			summary: `Search results for: ${query}. [Simulated web search content would appear here with relevant information about the query.]`,
		};
	},
});

export const lookupInfoTool = createTool({
	id: 'lookup-info',
	description: 'Looks up detailed information about a specific entity (person, company, product)',
	inputSchema: z.object({
		entity: z.string().describe('Name or ID of the entity to look up'),
	}),
	execute: async ({ entity }: { entity: string }) => {
		return {
			entity,
			summary: `Information about ${entity}. [Simulated lookup with key details about the entity.]`,
		};
	},
});

// ── Operations Sub-Agent (require approval) ──────────────────────────────────

export const deleteRecordsTool = createTool({
	id: 'delete-records',
	description: 'Permanently deletes records matching the criteria. This is destructive and irreversible.',
	inputSchema: z.object({
		criteria: z.string().describe('Delete criteria or filter'),
		scope: z.enum(['all', 'matching', 'expired']).describe('Scope of deletion'),
	}),
	requireApproval: true,
	execute: async ({ criteria, scope }: { criteria: string; scope: 'all' | 'matching' | 'expired' }) => {
		return {
			deleted: true,
			criteria,
			scope,
			recordsRemoved: Math.floor(Math.random() * 50) + 5,
			timestamp: new Date().toISOString(),
		};
	},
});

export const sendNotificationTool = createTool({
	id: 'send-notification',
	description: 'Sends a notification to a user via email or SMS',
	inputSchema: z.object({
		recipient: z.string().describe('Email address or phone number'),
		message: z.string().describe('Notification message content'),
		channel: z.enum(['email', 'sms']).describe('Delivery channel'),
	}),
	requireApproval: true,
	execute: async ({ recipient, message, channel }: { recipient: string; message: string; channel: 'email' | 'sms' }) => {
		return {
			sent: true,
			recipient,
			channel,
			messagePreview: message.slice(0, 100),
			timestamp: new Date().toISOString(),
		};
	},
});

// ── Confirmation Sub-Agent (suspend/resume pattern) ──────────────────────────

export const requestConfirmationTool = createTool({
	id: 'request-confirmation',
	description:
		'Requests explicit user confirmation before proceeding with an action. Use when the user needs to provide specific data or make a choice.',
	inputSchema: z.object({
		action: z.string().describe('Description of the action requiring confirmation'),
		options: z.string().optional().describe('Comma-separated options the user can choose from'),
	}),
	execute: async ({ action }: { action: string }) => {
		// Simulated confirmation result (actual suspend/resume is handled by the Agentuity handler)
		return {
			confirmed: true,
			action,
			userChoice: 'confirmed',
			timestamp: new Date().toISOString(),
		};
	},
});

// ============================================================================
// Tool Result Type
// ============================================================================

export interface ToolResult {
	success: boolean;
	data: Record<string, unknown>;
}

// ============================================================================
// Tool Executor
// ============================================================================

/**
 * Executes a tool's logic by name with the given arguments.
 * Used for immediate execution and post-approval execution after the Mastra agent
 * has already determined which tool to call.
 */
export async function executeTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
	switch (toolName) {
		case 'search-web': {
			const query = String(args['query'] ?? '');
			return {
				success: true,
				data: {
					query,
					summary: `Search results for: ${query}. [Simulated web search content would appear here with relevant information about the query.]`,
				},
			};
		}
		case 'lookup-info': {
			const entity = String(args['entity'] ?? '');
			return {
				success: true,
				data: {
					entity,
					summary: `Information about ${entity}. [Simulated lookup with key details about the entity.]`,
				},
			};
		}
		case 'delete-records': {
			return {
				success: true,
				data: {
					deleted: true,
					criteria: args['criteria'] ?? '',
					scope: args['scope'] ?? 'matching',
					recordsRemoved: Math.floor(Math.random() * 50) + 5,
					timestamp: new Date().toISOString(),
				},
			};
		}
		case 'send-notification': {
			return {
				success: true,
				data: {
					sent: true,
					recipient: args['recipient'] ?? '',
					channel: args['channel'] ?? 'email',
					messagePreview: String(args['message'] ?? '').slice(0, 100),
					timestamp: new Date().toISOString(),
				},
			};
		}
		case 'request-confirmation': {
			return {
				success: true,
				data: {
					confirmed: true,
					action: args['action'] ?? '',
					timestamp: new Date().toISOString(),
				},
			};
		}
		default:
			return { success: false, data: { error: `Unknown tool: ${toolName}` } };
	}
}

/**
 * Returns confirmation tool result with resume data from the user.
 * Mirrors Mastra's tool execution with `resumeData` context passed
 * when the network is resumed after a `suspend()` call.
 */
export function executeConfirmationWithResumeData(
	args: Record<string, unknown>,
	resumeData: Record<string, unknown>
): ToolResult {
	return {
		success: true,
		data: {
			confirmed: resumeData['confirmed'] ?? false,
			action: args['action'] ?? '',
			userChoice: resumeData['choice'] ?? 'confirmed',
			timestamp: new Date().toISOString(),
		},
	};
}

/**
 * Generates the suspend payload for a tool that uses the suspend/resume pattern.
 * Mirrors Mastra's `suspend({ message, action })` pattern where tools provide
 * context about what data is needed from the user.
 */
export function getSuspendPayload(toolName: string, args: Record<string, unknown>): Record<string, string> {
	switch (toolName) {
		case 'request-confirmation':
			return {
				message: `Please confirm: ${String(args['action'] ?? 'unknown action')}`,
				action: String(args['action'] ?? ''),
				options: String(args['options'] ?? 'yes,no'),
			};
		default:
			return { message: `Tool "${toolName}" is waiting for input.` };
	}
}
