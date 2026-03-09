/**
 * Tool definitions for the approval agent using Mastra's createTool.
 *
 * Demonstrates tool call approval patterns from Mastra:
 * - Tools without requireApproval: execute immediately (getWeatherTool, searchRecordsTool)
 * - Tools with requireApproval: suspend for human approval (deleteUserDataTool, sendNotificationTool)
 *
 * Each tool is defined with Mastra's createTool() and a Zod inputSchema.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ============================================================================
// Safe Tools — no approval required
// ============================================================================

export const getWeatherTool = createTool({
	id: 'get-weather',
	description: 'Fetches current weather for a location',
	inputSchema: z.object({
		location: z.string().describe('City or location name'),
	}),
	execute: async ({ location }: { location: string }) => {
		const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy', 'Windy'];
		return {
			location,
			temperature: `${Math.floor(Math.random() * 30) + 40}°F`,
			condition: conditions[Math.floor(Math.random() * conditions.length)] ?? 'Unknown',
			humidity: `${Math.floor(Math.random() * 60) + 30}%`,
		};
	},
});

export const searchRecordsTool = createTool({
	id: 'search-records',
	description: 'Searches records in the database by keyword',
	inputSchema: z.object({
		query: z.string().describe('Search query'),
	}),
	execute: async ({ query }: { query: string }) => {
		return {
			query,
			results: [
				{ id: '1', name: `Result for "${query}" #1`, relevance: 0.95 },
				{ id: '2', name: `Result for "${query}" #2`, relevance: 0.82 },
			],
			total: 2,
		};
	},
});

// ============================================================================
// Dangerous Tools — require approval
// Mirrors Mastra's requireApproval: true pattern
// ============================================================================

export const deleteUserDataTool = createTool({
	id: 'delete-user-data',
	description: 'Permanently deletes all data for a user. This is destructive and irreversible.',
	inputSchema: z.object({
		userId: z.string().describe('The user ID whose data to delete'),
		reason: z.string().describe('Reason for deletion'),
	}),
	requireApproval: true,
	execute: async ({ userId, reason }: { userId: string; reason: string }) => {
		return {
			deleted: true,
			userId,
			reason,
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

// ============================================================================
// Approval Configuration
// ============================================================================

/**
 * Human-readable reasons for tools that require approval.
 * Mastra's suspendPayload includes toolName and args but not a reason string,
 * so we provide context for the approval UI here.
 */
export const TOOL_SUSPEND_REASONS: Record<string, string> = {
	'delete-user-data': 'This will permanently delete all user data. This action cannot be undone.',
	'send-notification': 'This will send an external notification to the specified recipient.',
};
