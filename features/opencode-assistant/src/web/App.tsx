import { useAPI } from '@agentuity/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StreamEvent } from '../lib/types';
import './App.css';

type AppState = 'idle' | 'booting' | 'ready' | 'stopping';
type Message = { role: 'user' | 'assistant'; content: string };

const DEFAULT_REPO = 'https://github.com/agentuity/sdk';

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
				{state === 'ready' && <ChatPanel repoUrl={repoUrl} onStop={handleStop} />}

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

// Chat panel — rendered only when workspace is ready so useEventStream connects
function ChatPanel({ repoUrl, onStop }: { repoUrl: string; onStop: () => void }) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [question, setQuestion] = useState('');
	const [isResponding, setIsResponding] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const askApi = useAPI('POST /api/ask');
	const [isConnected, setIsConnected] = useState(false);

	// Raw EventSource to avoid React batching/dedup dropping rapid SSE deltas.
	// Accumulates text in a ref and flushes to state on requestAnimationFrame.
	const bufferRef = useRef('');
	const rafRef = useRef(0);

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

			if (event.type === 'text' && event.content) {
				bufferRef.current += event.content;
				// Flush on next animation frame to batch rapid deltas into one render
				if (!rafRef.current) {
					rafRef.current = requestAnimationFrame(() => {
						const chunk = bufferRef.current;
						bufferRef.current = '';
						rafRef.current = 0;
						setMessages((prev) => {
							const last = prev[prev.length - 1];
							if (last?.role === 'assistant') {
								return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
							}
							return [...prev, { role: 'assistant', content: chunk }];
						});
					});
				}
			} else if (event.type === 'error' && event.message) {
				setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${event.message}` }]);
				setIsResponding(false);
			} else if (event.type === 'status' && event.status === 'idle') {
				setIsResponding(false);
			}
		};

		return () => {
			es.close();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleAsk = useCallback(async () => {
		const q = question.trim();
		if (!q || isResponding) return;

		setMessages((prev) => [...prev, { role: 'user', content: q }]);
		setQuestion('');
		setIsResponding(true);

		try {
			await askApi.invoke({ question: q });
		} catch (err) {
			setIsResponding(false);
			setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${String(err)}` }]);
		}
	}, [question, isResponding, askApi]);

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
					<div className="flex items-center justify-center h-[300px] text-gray-600 text-sm">
						Ask a question about the codebase
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
										<div className="prose prose-invert prose-sm max-w-none">
											<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
											{i === messages.length - 1 && isResponding && (
												<span className="streaming-cursor" />
											)}
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
					disabled={isResponding}
					className="flex-1 bg-black border border-gray-900 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-800 transition-colors disabled:opacity-50"
				/>
				<button
					onClick={handleAsk}
					disabled={isResponding || !question.trim()}
					type="button"
					className="bg-cyan-950/50 border border-cyan-900/50 rounded-lg px-5 py-2.5 text-cyan-500 text-sm font-medium cursor-pointer hover:bg-cyan-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isResponding ? 'Thinking...' : 'Ask'}
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
