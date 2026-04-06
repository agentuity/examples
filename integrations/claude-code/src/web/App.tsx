import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { marked } from 'marked';
import './App.css';

// Configure marked for code-friendly output
marked.setOptions({
	breaks: true,
	gfm: true,
});

interface ExecutionResult {
	stdout?: string;
	stderr?: string;
	exitCode?: number;
}

interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
	executionResult?: ExecutionResult;
}

const SUGGESTIONS = [
	'Show me the fibonacci code',
	'Explain the class hierarchy',
	'Run the math-tricks.ts file',
	'Write a sorting algorithm',
];

function ExecutionResultBlock({ result }: { result: ExecutionResult }) {
	return (
		<div className="mt-3 border border-gray-800 rounded-lg overflow-hidden text-xs">
			<div className="bg-gray-950 px-3 py-1.5 border-b border-gray-800 flex items-center justify-between">
				<span className="text-gray-400 font-medium">Sandbox Execution</span>
				<span
					className={`font-mono ${result.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}
				>
					exit {result.exitCode ?? '?'}
				</span>
			</div>
			{result.stdout && (
				<pre className="px-3 py-2 text-green-400 whitespace-pre-wrap font-mono">
					{result.stdout}
				</pre>
			)}
			{result.stderr && (
				<pre className="px-3 py-2 text-red-400 whitespace-pre-wrap font-mono border-t border-gray-800">
					{result.stderr}
				</pre>
			)}
		</div>
	);
}

function MessageContent({ content, role }: { content: string; role: 'user' | 'assistant' }) {
	const html = useMemo(() => {
		if (role === 'user') return null;
		return marked.parse(content) as string;
	}, [content, role]);

	if (role === 'user') {
		return <span className="whitespace-pre-wrap">{content}</span>;
	}

	return (
		<div
			className="prose prose-invert prose-sm max-w-none"
			dangerouslySetInnerHTML={{ __html: html! }}
		/>
	);
}

export function App() {
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Load history on mount
	useEffect(() => {
		fetch('/api/chat/history')
			.then((res) => res.json())
			.then((data) => {
				if (data?.messages) {
					setMessages(data.messages as Message[]);
				}
			})
			.catch(() => {
				// Silently ignore history load errors
			});
	}, []);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, isLoading]);

	const handleSend = useCallback(
		async (text?: string) => {
			const userPrompt = (text ?? input).trim();
			if (!userPrompt || isLoading) return;

			// Optimistic: show user message immediately
			setMessages((prev) => [
				...prev,
				{ role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
			]);
			setInput('');
			setIsLoading(true);

			try {
				const res = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ prompt: userPrompt }),
				});
				const result = await res.json();

				if (result) {
					setMessages((prev) => [
						...prev,
						{
							role: 'assistant',
							content: result.response,
							timestamp: new Date().toISOString(),
							executionResult: result.executionResult,
						},
					]);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[input, isLoading],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	const handleClear = useCallback(async () => {
		await fetch('/api/chat/history', { method: 'DELETE' });
		setMessages([]);
	}, []);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col max-w-3xl w-full h-screen">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-800">
					<div className="flex items-center gap-3">
						<svg
							aria-hidden="true"
							className="h-auto w-7"
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
						<div>
							<h1 className="text-lg font-semibold leading-tight">Claude Code Agent</h1>
							<p className="text-gray-500 text-xs">
								Conversational code intelligence powered by Claude
							</p>
						</div>
					</div>
					{messages.length > 0 && (
						<button
							className="bg-transparent border border-gray-800 rounded text-gray-500 text-xs py-1.5 px-3 hover:bg-gray-900 hover:text-white cursor-pointer transition-colors"
							onClick={handleClear}
							type="button"
						>
							Clear Chat
						</button>
					)}
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
					{messages.length === 0 && !isLoading && (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center text-gray-600">
								<p className="text-lg mb-2">Ask me about code</p>
								<p className="text-sm mb-4">
									I can read, write, analyze, and execute TypeScript files.
								</p>
								<div className="flex flex-wrap gap-2 justify-center">
									{SUGGESTIONS.map((suggestion) => (
										<button
											key={suggestion}
											className="bg-gray-900 border border-gray-800 rounded-full text-gray-400 text-xs py-1.5 px-3 hover:bg-gray-800 hover:text-white cursor-pointer transition-colors"
											onClick={() => handleSend(suggestion)}
											type="button"
										>
											{suggestion}
										</button>
									))}
								</div>
							</div>
						</div>
					)}

					{messages.map((msg, i) => (
						<div
							key={`${msg.timestamp}-${i}`}
							className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
						>
							<div
								className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
									msg.role === 'user'
										? 'bg-cyan-900/30 border border-cyan-800/50 text-white'
										: 'bg-gray-900 border border-gray-800 text-gray-300'
								}`}
							>
								<MessageContent content={msg.content} role={msg.role} />
								{msg.executionResult && (
									<ExecutionResultBlock result={msg.executionResult} />
								)}
							</div>
						</div>
					))}

					{isLoading && (
						<div className="flex justify-start">
							<div
								className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500"
								data-loading="true"
							>
								Thinking
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="border-t border-gray-800 p-4">
					<div className="flex gap-3 items-end">
						<textarea
							className="flex-1 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm resize-none py-3 px-4 min-h-[48px] max-h-32 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2"
							disabled={isLoading}
							onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
								setInput(e.currentTarget.value)
							}
							onKeyDown={handleKeyDown}
							placeholder="Ask about code... (Enter to send, Shift+Enter for new line)"
							rows={1}
							value={input}
						/>
						<button
							className="bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 cursor-pointer transition-colors"
							disabled={isLoading || !input.trim()}
							onClick={() => handleSend()}
							type="button"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
