import { useAPI } from '@agentuity/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { createCodePlugin } from '@streamdown/code';
import type { PartData, StreamEvent } from '../api/types';
import './App.css';

type AppState = 'idle' | 'booting' | 'ready' | 'stopping';
type Message = { role: 'user'; content: string } | { role: 'assistant'; parts: Map<string, PartData> };

const DEFAULT_REPO = 'https://github.com/agentuity/sdk';

// Streamdown plugins (initialized once, outside component tree)
const codePlugin = createCodePlugin({ themes: ['github-dark', 'github-dark'] });

// Custom Streamdown components for dark theme
const streamdownComponents = {
	h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
		<h1 className="text-lg font-bold mt-4 mb-2 text-white" {...props}>{children}</h1>
	),
	h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
		<h2 className="text-base font-bold mt-3 mb-1.5 text-white" {...props}>{children}</h2>
	),
	h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
		<h3 className="text-sm font-semibold mt-2 mb-1 text-white" {...props}>{children}</h3>
	),
	p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
		<p className="text-sm leading-relaxed text-gray-300 my-1.5" {...props}>{children}</p>
	),
	a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
		<a href={href} target="_blank" rel="noopener noreferrer"
			className="text-cyan-400 underline underline-offset-2 hover:opacity-80 text-sm" {...props}>
			{children}
		</a>
	),
	code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
		// Fenced code blocks have a language-* className from Streamdown
		if (className && className.includes('language-')) {
			return <code className={className} {...props}>{children}</code>;
		}
		// Inline code
		return (
			<code className="rounded bg-gray-900 border border-gray-800 px-1.5 py-0.5 text-[0.85em] font-mono text-cyan-400" {...props}>
				{children}
			</code>
		);
	},
	pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
		<pre className="overflow-x-auto rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs leading-relaxed font-mono my-2" {...props}>
			{children}
		</pre>
	),
	ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
		<ul className="text-sm list-disc ml-6 my-1.5 space-y-0.5 text-gray-300" {...props}>{children}</ul>
	),
	ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
		<ol className="text-sm list-decimal ml-6 my-1.5 space-y-0.5 text-gray-300" {...props}>{children}</ol>
	),
	li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
		<li className="text-sm text-gray-300" {...props}>{children}</li>
	),
	blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
		<blockquote className="border-l-2 border-cyan-800 pl-3 my-2 text-sm text-gray-400 italic" {...props}>
			{children}
		</blockquote>
	),
	hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
		<hr className="my-3 border-gray-800" {...props} />
	),
	strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
		<strong className="font-semibold text-white" {...props}>{children}</strong>
	),
	em: ({ children, ...props }: React.ComponentPropsWithoutRef<'em'>) => (
		<em className="text-gray-300" {...props}>{children}</em>
	),
	table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
		<div className="overflow-x-auto my-2">
			<table className="text-xs border-collapse border border-gray-800" {...props}>{children}</table>
		</div>
	),
	th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
		<th className="border border-gray-800 px-2 py-1 text-left text-xs font-semibold bg-gray-900 text-white" {...props}>{children}</th>
	),
	td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
		<td className="border border-gray-800 px-2 py-1 text-xs text-gray-300" {...props}>{children}</td>
	),
};

// Smaller, muted components for reasoning blocks
const reasoningComponents = {
	h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
		<h1 className="text-xs font-bold mt-2 mb-1 text-gray-500" {...props}>{children}</h1>
	),
	h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
		<h2 className="text-xs font-bold mt-1.5 mb-0.5 text-gray-500" {...props}>{children}</h2>
	),
	h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
		<h3 className="text-[11px] font-semibold mt-1 mb-0.5 text-gray-500" {...props}>{children}</h3>
	),
	p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
		<p className="text-[11px] leading-relaxed text-gray-500 my-1" {...props}>{children}</p>
	),
	code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
		if (className && className.includes('language-')) {
			return <code className={className} {...props}>{children}</code>;
		}
		return (
			<code className="rounded bg-gray-900 px-1 py-0.5 text-[10px] font-mono text-gray-400" {...props}>
				{children}
			</code>
		);
	},
	pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
		<pre className="overflow-x-auto rounded-md bg-gray-900 p-2 text-[10px] leading-relaxed font-mono my-1" {...props}>
			{children}
		</pre>
	),
	ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
		<ul className="text-[11px] list-disc ml-4 my-1 space-y-0.5 text-gray-500" {...props}>{children}</ul>
	),
	ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
		<ol className="text-[11px] list-decimal ml-4 my-1 space-y-0.5 text-gray-500" {...props}>{children}</ol>
	),
	li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
		<li className="text-[11px] text-gray-500" {...props}>{children}</li>
	),
	strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
		<strong className="font-semibold text-gray-400" {...props}>{children}</strong>
	),
	em: ({ children, ...props }: React.ComponentPropsWithoutRef<'em'>) => (
		<em className="text-gray-500" {...props}>{children}</em>
	),
	blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
		<blockquote className="border-l-2 border-gray-800 pl-2 my-1 text-[11px] text-gray-500 italic" {...props}>
			{children}
		</blockquote>
	),
};

export function App() {
	const [state, setState] = useState<AppState>('idle');
	const [repoUrl, setRepoUrl] = useState(DEFAULT_REPO);
	const [error, setError] = useState<string | null>(null);

	const startApi = useAPI('POST /api/start');
	const statusApi = useAPI('GET /api/status');
	const stopApi = useAPI('POST /api/stop');

	// Rehydrate from KV on mount (once only)
	const rehydrated = useRef(false);
	useEffect(() => {
		const data = statusApi.data;
		if (!rehydrated.current && data?.exists && data.ready && data.repoUrl) {
			rehydrated.current = true;
			setRepoUrl(data.repoUrl);
			setState('ready');
		}
	}, [statusApi.data]);

	const handleStart = useCallback(async () => {
		setState('booting');
		setError(null);

		try {
			const data = await startApi.invoke({ repoUrl });
			if (data?.ready) {
				setRepoUrl(data.repoUrl);
				setState('ready');
			} else {
				setError(data?.message || 'Workspace failed to start. Try again.');
				setState('idle');
			}
		} catch (err) {
			setError(String(err));
			setState('idle');
		}
	}, [startApi, repoUrl]);

	const handleStop = useCallback(async () => {
		setState('stopping');
		setError(null);

		try {
			await stopApi.invoke();
			setState('idle');
		} catch (err) {
			setError(String(err));
			setState('ready');
		}
	}, [stopApi]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-6 max-w-3xl p-8 md:p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-2 text-center">
					<Logo className="h-auto mb-4 w-12" />
					<h1 className="text-4xl font-thin">OpenCode Assistant</h1>
					<p className="text-gray-400 text-sm">
						Ask questions about any GitHub repository
					</p>
				</div>

				{error && (
					<div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-red-400 text-sm">
						{error}
					</div>
				)}

				{/* Idle State */}
				{state === 'idle' && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-5">
						<div className="w-full max-w-md flex flex-col gap-3">
							<label className="text-gray-400 text-xs uppercase tracking-wider" htmlFor="repo-url">
								GitHub Repository URL
							</label>
							<input
								id="repo-url"
								type="url"
								value={repoUrl}
								onChange={(e) => setRepoUrl(e.target.value)}
								placeholder="https://github.com/owner/repo"
								className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyan-800 transition-colors"
							/>
						</div>

						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-6 py-2.5 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleStart}
								disabled={!repoUrl.trim()}
								type="button"
							>
								Start
							</button>
						</div>
					</div>
				)}

				{/* Booting State */}
				{state === 'booting' && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-4">
						<div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
						<div className="text-center">
							<p className="text-white text-sm" data-loading="true">
								Starting workspace
							</p>
							<p className="text-gray-500 text-xs mt-1">
								Cloning repo, booting OpenCode server
							</p>
						</div>
					</div>
				)}

				{/* Ready State — Chat */}
				{state === 'ready' && <ChatPanel repoUrl={repoUrl} onStop={handleStop} isReconnected={rehydrated.current} />}

				{/* Stopping State */}
				{state === 'stopping' && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-4">
						<div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
						<p className="text-white text-sm" data-loading="true">
							Stopping workspace
						</p>
					</div>
				)}

			</div>
		</div>
	);
}

// Reasoning block: collapsible thinking indicator
function ReasoningBlock({ part, isStreaming }: { part: PartData; isStreaming: boolean }) {
	const isThinking = isStreaming && !part.time?.end;
	const duration = part.time?.end != null && part.time?.start != null
		? Math.ceil((part.time.end - part.time.start) / 1000)
		: null;

	return (
		<details className="reasoning-block mb-2" open={isThinking || undefined}>
			<summary className="text-xs text-gray-500 select-none py-1">
				{isThinking ? (
					<span className="thinking-pulse text-cyan-600">Thinking...</span>
				) : (
					<span className="text-gray-500">
						Thought{duration !== null ? ` (${duration}s)` : ''}
					</span>
				)}
			</summary>
			<div className="max-h-48 overflow-y-auto rounded-md border border-gray-800/50 bg-gray-900/30 p-2.5 text-[11px] mt-1 mb-2 break-words [&_pre]:whitespace-pre-wrap [&_pre]:overflow-hidden [&_code]:break-all">
				<Streamdown
					plugins={{ code: codePlugin }}
					components={reasoningComponents}
					isAnimating={isStreaming}
					caret={isStreaming ? 'block' : undefined}
					mode={isStreaming ? 'streaming' : undefined}
				>
					{part.text}
				</Streamdown>
			</div>
		</details>
	);
}

// Chat panel — rendered only when workspace is ready so EventSource connects
function ChatPanel({ repoUrl, onStop, isReconnected }: { repoUrl: string; onStop: () => void; isReconnected?: boolean }) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [question, setQuestion] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const askApi = useAPI('POST /api/ask');
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const es = new EventSource('/api/events');

		es.onopen = () => setIsConnected(true);
		es.onerror = () => setIsConnected(false);

		es.onmessage = (e) => {
			let event: StreamEvent;
			try {
				event = JSON.parse(e.data);
			} catch {
				return;
			}

			if (event.type === 'part') {
				// Upsert the part into the last assistant message (or create one)
				setMessages((prev) => {
					const last = prev[prev.length - 1];
					if (last?.role === 'assistant') {
						const parts = new Map(last.parts);
						parts.set(event.part.id, event.part);
						return [...prev.slice(0, -1), { ...last, parts }];
					}
					const parts = new Map([[event.part.id, event.part]]);
					return [...prev, { role: 'assistant', parts }];
				});
			} else if (event.type === 'error') {
				// Show error as a text part in a new assistant message
				const errorPart: PartData = { id: 'error', type: 'text', text: `Error: ${event.message}` };
				setMessages((prev) => [...prev, { role: 'assistant', parts: new Map([['error', errorPart]]) }]);
				setIsStreaming(false);
			} else if (event.type === 'status') {
				setIsStreaming(event.status === 'busy');
			}
		};

		return () => {
			es.close();
		};
	}, []);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleAsk = useCallback(async () => {
		const q = question.trim();
		if (!q || isStreaming) return;

		setMessages((prev) => [...prev, { role: 'user', content: q }]);
		setQuestion('');
		setIsStreaming(true);

		try {
			await askApi.invoke({ question: q });
		} catch (err) {
			setIsStreaming(false);
			const errorPart: PartData = { id: 'error', type: 'text', text: `Error: ${String(err)}` };
			setMessages((prev) => [...prev, { role: 'assistant', parts: new Map([['error', errorPart]]) }]);
		}
	}, [question, isStreaming, askApi]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleAsk();
			}
		},
		[handleAsk]
	);

	return (
		<div className="flex flex-col gap-4">
			{/* Repo badge */}
			<div className="flex items-center gap-2 text-xs text-gray-500">
				<span className="inline-block w-2 h-2 rounded-full bg-green-500" />
				<span className="font-mono truncate">{repoUrl}</span>
				{!isConnected && <span className="text-yellow-500">(reconnecting...)</span>}
			</div>

			{/* Messages */}
			<div className="bg-black border border-gray-900 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-[300px] gap-2">
						<span className="text-gray-600 text-sm">Ask a question about the codebase</span>
						{isReconnected && (
							<span className="text-gray-700 text-xs">
								Reconnected to existing session — the AI remembers your prior questions
							</span>
						)}
					</div>
				) : (
					<div className="p-4 flex flex-col gap-4">
						{messages.map((msg, i) => (
							<div
								key={i}
								className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
							>
								<div
									className={
										msg.role === 'user'
											? 'bg-cyan-950/30 border border-cyan-900/50 rounded-lg px-4 py-2.5 max-w-[85%] text-sm text-white'
											: 'bg-gray-950 border border-gray-900 rounded-lg px-4 py-2.5 max-w-[85%] text-sm text-gray-300'
									}
								>
									{msg.role === 'assistant' ? (
										<div className="max-w-none text-sm">
											{Array.from(msg.parts.values()).map((part) => {
												if (part.type === 'reasoning') {
													return (
														<ReasoningBlock
															key={part.id}
															part={part}
															isStreaming={isStreaming && i === messages.length - 1}
														/>
													);
												}
												// text part
												return (
													<Streamdown
														key={part.id}
														plugins={{ code: codePlugin }}
														components={streamdownComponents}
														isAnimating={isStreaming && i === messages.length - 1}
														caret={isStreaming && i === messages.length - 1 ? 'block' : undefined}
														mode={isStreaming && i === messages.length - 1 ? 'streaming' : undefined}
													>
														{part.text}
													</Streamdown>
												);
											})}
										</div>
									) : (
										msg.content
									)}
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input */}
			<div className="flex gap-3">
				<input
					type="text"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask about the codebase..."
					disabled={isStreaming}
					className="flex-1 bg-black border border-gray-900 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-800 transition-colors disabled:opacity-50"
				/>
				<button
					onClick={handleAsk}
					disabled={isStreaming || !question.trim()}
					type="button"
					className="bg-cyan-950/50 border border-cyan-900/50 rounded-lg px-5 py-2.5 text-cyan-500 text-sm font-medium cursor-pointer hover:bg-cyan-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isStreaming ? 'Thinking...' : 'Ask'}
				</button>
				<button
					onClick={onStop}
					type="button"
					className="bg-transparent border border-red-900 rounded-lg px-5 py-2.5 text-red-400 text-sm cursor-pointer hover:bg-red-950/30 hover:border-red-700 transition-colors"
				>
					Stop
				</button>
			</div>
		</div>
	);
}

// Agentuity logo SVG component
function Logo({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			height="191"
			viewBox="0 0 220 191"
			width="220"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				clipRule="evenodd"
				d="M220 191H0L31.427 136.5H0L8 122.5H180.5L220 191ZM47.5879 136.5L24.2339 177H195.766L172.412 136.5H47.5879Z"
				fill="var(--color-cyan-500)"
				fillRule="evenodd"
			/>
			<path
				clipRule="evenodd"
				d="M110 0L157.448 82.5H189L197 96.5H54.5L110 0ZM78.7021 82.5L110 28.0811L141.298 82.5H78.7021Z"
				fill="var(--color-cyan-500)"
				fillRule="evenodd"
			/>
		</svg>
	);
}
