import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;

// Example prompts to demonstrate memory features
const EXAMPLE_PROMPTS = [
	{ label: 'Share your name', text: 'My name is Alice' },
	{ label: 'Recall name', text: "What's my name?" },
	{ label: 'Share interest', text: 'I love hiking and photography' },
	{ label: 'Recall interests', text: 'What are my interests?' },
	{ label: 'Previous topic', text: 'What did we talk about?' },
];

export function App() {
	const [message, setMessage] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// API hooks
	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/history');
	const { data: chatResult, invoke: sendChat, isLoading } = useAPI('POST /api/chat');
	const { invoke: clearHistory } = useAPI('DELETE /api/history');
	const { track } = useAnalytics();

	// Combine history from initial fetch and chat results
	const messages = historyData?.messages ?? [];
	const preferences = chatResult?.preferences ?? historyData?.preferences;
	const threadId = chatResult?.threadId ?? historyData?.threadId;

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, chatResult]);

	// Refetch history after chat
	useEffect(() => {
		if (chatResult) {
			refetchHistory();
		}
	}, [chatResult, refetchHistory]);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;

			track('chat_message', { message: message.slice(0, 50) });
			await sendChat({ message });
			setMessage('');
		},
		[message, isLoading, sendChat, track]
	);

	const handleExampleClick = useCallback(
		async (text: string) => {
			track('example_prompt', { prompt: text });
			await sendChat({ message: text });
		},
		[sendChat, track]
	);

	const handleClearHistory = useCallback(async () => {
		track('clear_history');
		await clearHistory();
		await refetchHistory();
	}, [clearHistory, refetchHistory, track]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-8 md:p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-4 relative text-center">
					<svg
						aria-hidden="true"
						className="h-auto mb-4 w-12"
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

					<h1 className="text-4xl md:text-5xl font-thin">Agent Memory</h1>

					<p className="text-gray-400 text-lg">
						Conversational memory with <span className="italic font-serif">Agentuity</span>
					</p>
				</div>

				{/* Thread Info Bar */}
				<div className="bg-black border border-gray-900 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between text-sm">
					<div className="flex gap-4 text-gray-400">
						{threadId && (
							<span>
								Thread: <code className="text-cyan-400">{threadId.slice(0, 16)}...</code>
							</span>
						)}
						<span>
							Messages: <strong className="text-white">{messages.length}</strong>
						</span>
					</div>
					{messages.length > 0 && (
						<button
							onClick={handleClearHistory}
							className="text-gray-500 hover:text-red-400 transition-colors text-xs"
							type="button"
						>
							Clear History
						</button>
					)}
				</div>

				{/* User Preferences (if any) */}
				{preferences && (preferences.name || preferences.interests?.length) && (
					<div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
						<h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Remembered About You</h3>
						<div className="flex flex-wrap gap-2">
							{preferences.name && (
								<span className="bg-cyan-900/30 border border-cyan-800 text-cyan-400 px-2 py-1 rounded text-sm">
									Name: {preferences.name}
								</span>
							)}
							{preferences.interests?.map((interest) => (
								<span
									key={interest}
									className="bg-purple-900/30 border border-purple-800 text-purple-400 px-2 py-1 rounded text-sm"
								>
									{interest}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Chat Messages */}
				<div className="bg-black border border-gray-900 rounded-lg p-4 flex flex-col gap-4 min-h-[300px] max-h-[400px] overflow-y-auto">
					{messages.length === 0 ? (
						<div className="text-gray-600 text-center py-8">
							<p className="mb-2">No messages yet</p>
							<p className="text-sm">Start a conversation or try an example below</p>
						</div>
					) : (
						<>
							{messages.map((msg, index) => (
								<div
									key={`${msg.timestamp}-${index}`}
									className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[80%] rounded-lg px-4 py-2 ${
											msg.role === 'user'
												? 'bg-cyan-900/50 border border-cyan-800 text-cyan-100'
												: 'bg-gray-900 border border-gray-800 text-gray-200'
										}`}
									>
										<p className="text-sm whitespace-pre-wrap">{msg.content}</p>
										<p className="text-xs text-gray-500 mt-1">
											{new Date(msg.timestamp).toLocaleTimeString()}
										</p>
									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
										<p className="text-sm text-gray-400">Thinking...</p>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				{/* Example Prompts */}
				<div className="flex flex-wrap gap-2">
					{EXAMPLE_PROMPTS.map((example) => (
						<button
							key={example.label}
							onClick={() => handleExampleClick(example.text)}
							disabled={isLoading}
							className="bg-gray-900 border border-gray-800 text-gray-400 px-3 py-1.5 rounded-full text-xs hover:border-cyan-700 hover:text-cyan-400 transition-colors disabled:opacity-50"
							type="button"
						>
							{example.label}
						</button>
					))}
				</div>

				{/* Chat Input */}
				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						value={message}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
						placeholder="Type a message..."
						disabled={isLoading}
						className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-700"
					/>
					<button
						type="submit"
						disabled={isLoading || !message.trim()}
						className="bg-cyan-900 border border-cyan-700 text-cyan-100 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Sending...' : 'Send'}
					</button>
				</form>

				{/* Documentation */}
				<div className="bg-black border border-gray-900 rounded-lg p-6 mt-4">
					<h3 className="text-white text-lg font-normal mb-4">How It Works</h3>

					<div className="space-y-4 text-sm text-gray-400">
						<div>
							<h4 className="text-gray-200 font-medium mb-1">Message History</h4>
							<p>
								Messages are stored using{' '}
								<code className="text-cyan-400">ctx.thread.state.push()</code> with a sliding
								window of 20 messages (like Mastra's <code className="text-cyan-400">lastMessages</code>{' '}
								option).
							</p>
						</div>

						<div>
							<h4 className="text-gray-200 font-medium mb-1">Thread Isolation</h4>
							<p>
								Each browser session gets a unique thread ID stored in cookies (like Mastra's{' '}
								<code className="text-cyan-400">thread</code> parameter). Different browsers =
								different conversations.
							</p>
						</div>

						<div>
							<h4 className="text-gray-200 font-medium mb-1">User Preferences</h4>
							<p>
								The agent extracts and stores user information (name, interests) in thread state,
								similar to Mastra's working memory concept.
							</p>
						</div>
					</div>
				</div>

				{/* Next Steps */}
				<div className="bg-black border border-gray-900 rounded-lg p-6">
					<h3 className="text-white text-lg font-normal mb-4">Explore the Code</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'Memory Agent',
								path: 'src/agent/memory/index.ts',
								desc: 'See how ctx.thread.state stores messages and preferences',
							},
							{
								title: 'API Routes',
								path: 'src/api/index.ts',
								desc: 'Chat, history, and clear endpoints',
							},
							WORKBENCH_PATH
								? {
										title: 'Try Workbench',
										path: WORKBENCH_PATH,
										desc: 'Test the agent directly',
										isLink: true,
									}
								: null,
						]
							.filter(Boolean)
							.map((item) =>
								item ? (
									<div key={item.title} className="flex items-start gap-3">
										<div className="bg-green-950 border border-green-800 rounded p-1">
											<svg
												className="w-3 h-3 text-green-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</div>
										<div>
											<h4 className="text-white text-sm">
												{item.isLink ? (
													<a href={item.path} className="underline hover:text-cyan-400">
														{item.title}
													</a>
												) : (
													item.title
												)}
											</h4>
											<p className="text-gray-500 text-xs">
												{item.isLink ? item.desc : (
													<>
														<code className="text-gray-400">{item.path}</code> - {item.desc}
													</>
												)}
											</p>
										</div>
									</div>
								) : null
							)}
					</div>
				</div>
			</div>
		</div>
	);
}
