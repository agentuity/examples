/**
 * Claude Code Agent — conversational code intelligence with sandbox execution.
 *
 * Uses the Claude Agent SDK for code analysis and generation, and
 * Agentuity Sandboxes for safe, isolated code execution.
 */

import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { SAMPLE_FILES } from './sample-files';

// Resolve the Claude Code CLI path dynamically (works from both src/ and .agentuity/)
const require = createRequire(import.meta.url);
const claudeCodePath = join(dirname(require.resolve('@anthropic-ai/claude-code/package.json')), 'cli.js');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const MessageSchema = s.object({
	role: s.enum(['user', 'assistant']),
	content: s.string(),
	timestamp: s.string(),
});

type Message = s.infer<typeof MessageSchema>;

const ExecutionResultSchema = s.object({
	stdout: s.string().optional(),
	stderr: s.string().optional(),
	exitCode: s.number().optional(),
});

const AgentInput = s.object({
	prompt: s.string().describe('The user prompt to send to Claude Code'),
});

export const AgentOutput = s.object({
	response: s.string().describe('The assistant response text'),
	sessionId: s.string().describe('Current session ID'),
	threadId: s.string().describe('Thread ID for continuity'),
	executionResult: ExecutionResultSchema.optional().describe(
		'Code execution result from sandbox, if any',
	),
	costUsd: s.number().optional().describe('Cost of this query in USD'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure workspace directory exists and seed it with sample files. */
function initWorkspace(workspaceDir: string): void {
	if (!existsSync(workspaceDir)) {
		mkdirSync(workspaceDir, { recursive: true });
	}
	for (const file of SAMPLE_FILES) {
		const filePath = join(workspaceDir, file.name);
		if (!existsSync(filePath)) {
			writeFileSync(filePath, file.content);
		}
	}
}

/** Collect all regular files in the workspace for sandbox submission. */
function collectWorkspaceFiles(workspaceDir: string): Array<{ path: string; content: Buffer }> {
	const files: Array<{ path: string; content: Buffer }> = [];
	if (!existsSync(workspaceDir)) return files;
	for (const name of readdirSync(workspaceDir)) {
		const fullPath = join(workspaceDir, name);
		if (!statSync(fullPath).isFile()) continue;
		files.push({ path: name, content: Buffer.from(readFileSync(fullPath)) });
	}
	return files;
}

/** Extract file paths that Claude Code wrote or edited from SDK messages. */
function getWrittenFiles(messages: SDKMessage[]): string[] {
	const written: string[] = [];
	for (const msg of messages) {
		if (msg.type === 'assistant') {
			for (const block of (msg as any).message?.content ?? []) {
				if (block.type === 'tool_use' && (block.name === 'Write' || block.name === 'Edit')) {
					const filePath = block.input?.file_path;
					if (typeof filePath === 'string') {
						// Extract just the filename from a full path
						const name = filePath.split('/').pop();
						if (name) written.push(name);
					}
				}
			}
		}
	}
	return written;
}

/** Pick the main file to execute in the sandbox. */
function pickMainFile(
	files: Array<{ path: string }>,
	prompt: string,
	sdkMessages?: SDKMessage[],
): string | null {
	// 1. Check if the user mentioned a specific file by name
	const mentioned = files.find((f) => prompt.toLowerCase().includes(f.path.toLowerCase()));
	if (mentioned) return mentioned.path;

	// 2. Prefer files that Claude Code just wrote/edited in this turn
	if (sdkMessages) {
		const written = getWrittenFiles(sdkMessages);
		const writtenFile = files.find((f) => written.includes(f.path));
		if (writtenFile) return writtenFile.path;
	}

	// 3. Fall back to common entry points
	const preferred = ['index.ts', 'main.ts', 'hello.ts', 'index.js'];
	return files.find((f) => preferred.includes(f.path))?.path ?? files[0]?.path ?? null;
}

/** Extract readable text from the collected SDK messages. */
function extractResponseText(messages: SDKMessage[]): string {
	// Prefer the final result message — it contains the clean response text
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg.type === 'result' && msg.subtype === 'success' && (msg as any).result) {
			return (msg as any).result;
		}
	}

	// Fallback: collect text from assistant messages
	const parts: string[] = [];
	for (const msg of messages) {
		if (msg.type === 'assistant') {
			for (const block of (msg as any).message.content) {
				if (block.type === 'text') {
					parts.push(block.text);
				}
			}
		}
	}
	return parts.join('\n\n') || '(No response generated)';
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

const agent = createAgent('claude-code', {
	description:
		'Claude Code agent for conversational code intelligence with sandbox execution',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { prompt }) => {
		ctx.logger.info('Claude Code Agent invoked', { promptLength: prompt.length });

		// 1. Workspace setup — per-thread temp directory seeded with sample files
		const workspaceBase = join(tmpdir(), 'claude-code-workspaces');
		const workspaceDir = join(workspaceBase, ctx.thread.id);
		initWorkspace(workspaceDir);

		// 2. Load conversation history from thread state
		const history = (await ctx.thread.state.get<Message[]>('messages')) ?? [];

		// 3. System prompt — Claude Code handles reading/writing/analyzing, sandbox handles execution
		const systemPrompt = [
			'You are a helpful code assistant running inside an Agentuity agent.',
			'You have access to a workspace with sample TypeScript files.',
			'You can read, write, edit, and search files in the workspace using your tools.',
			'You do NOT have access to Bash. When the user asks to run or execute code, describe what the code will do — a sandbox will handle the actual execution separately.',
			'Keep responses concise and well-formatted with markdown code blocks.',
			history.length > 0
				? `\nThis is a continuing conversation (${history.length} messages so far).`
				: '',
		].join('\n');

		// 4. Build prompt with recent history context (last 3 exchanges = 6 messages)
		const recentHistory = history.slice(-6);
		const contextPrefix =
			recentHistory.length > 0
				? recentHistory.map((m) => `${m.role}: ${m.content}`).join('\n') + '\n\n'
				: '';
		const fullPrompt = contextPrefix + `user: ${prompt}`;

		// 5. Call Claude Agent SDK (no Bash — execution goes through sandbox)
		const collectedMessages: SDKMessage[] = [];
		let costUsd = 0;

		try {
			const q = query({
				prompt: fullPrompt,
				options: {
					systemPrompt,
					pathToClaudeCodeExecutable: claudeCodePath,
					allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
					permissionMode: 'bypassPermissions',
					allowDangerouslySkipPermissions: true,
					cwd: workspaceDir,
					maxTurns: 10,
				},
			});

			for await (const msg of q) {
				collectedMessages.push(msg);
				if (msg.type === 'result') {
					if (msg.subtype === 'success') {
						costUsd = (msg as any).total_cost_usd ?? 0;
					} else if ('errors' in (msg as any)) {
						ctx.logger.error('Claude Agent SDK error', {
							errors: (msg as any).errors,
						});
					}
				}
			}
		} catch (err) {
			ctx.logger.error('Claude Agent SDK query failed', { error: String(err) });
			const detail = err instanceof Error ? err.message : String(err);
			const authHint = detail.includes('exited with code 1')
				? ' Make sure ANTHROPIC_API_KEY is available to local dev in `.env`, or configure another supported Claude auth method.'
				: '';
			return {
				response: `Error communicating with Claude: ${detail}${authHint}`,
				sessionId: ctx.sessionId,
				threadId: ctx.thread.id,
			};
		}

		// 6. Extract response text
		const responseText = extractResponseText(collectedMessages);

		// 7. Sandbox execution — triggered when the user asks to run/execute code
		let executionResult:
			| { stdout?: string; stderr?: string; exitCode?: number }
			| undefined;

		const wantsExecution = /\b(run|execute|test|try)\b/i.test(prompt);
		if (wantsExecution) {
			try {
				const workspaceFiles = collectWorkspaceFiles(workspaceDir);
				const mainFile = pickMainFile(workspaceFiles, prompt, collectedMessages);

				if (workspaceFiles.length > 0 && mainFile) {
					ctx.logger.info('Executing in sandbox', { mainFile, fileCount: workspaceFiles.length });

					const result = await ctx.sandbox.run({
						runtime: 'bun:1',
						command: {
							exec: ['bun', 'run', mainFile],
							files: workspaceFiles,
						},
						resources: { memory: '500Mi', cpu: '500m' },
					});

					// Deduplicate: bun may write the same content to both stdout and stderr
					const stderr =
						result.stderr && result.stderr !== result.stdout
							? result.stderr
							: undefined;

					executionResult = {
						stdout: result.stdout,
						stderr,
						exitCode: result.exitCode,
					};

					ctx.logger.info('Sandbox execution complete', {
						exitCode: result.exitCode,
						durationMs: result.durationMs,
					});
				}
			} catch (err) {
				ctx.logger.error('Sandbox execution failed', { error: String(err) });
				executionResult = {
					stderr: `Sandbox error: ${err instanceof Error ? err.message : String(err)}`,
					exitCode: -1,
				};
			}
		}

		// 8. Persist conversation in thread state (sliding window of 20 messages)
		const userMessage: Message = {
			role: 'user',
			content: prompt,
			timestamp: new Date().toISOString(),
		};
		const assistantMessage: Message = {
			role: 'assistant',
			content: responseText,
			timestamp: new Date().toISOString(),
		};

		await ctx.thread.state.push('messages', userMessage, 20);
		await ctx.thread.state.push('messages', assistantMessage, 20);

		// 9. Return response
		return {
			response: responseText,
			sessionId: ctx.sessionId,
			threadId: ctx.thread.id,
			executionResult,
			costUsd,
		};
	},
});

export default agent;
