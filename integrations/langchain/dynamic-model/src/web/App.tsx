import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

type Message = { role: string; content: string };

type ChatResult = {
	response: string;
	modelUsed: string;
	messageCount: number;
	threadId: string;
	sessionId: string;
};

export function App() {
	const [message, setMessage] = useState('');
	const [history, setHistory] = useState<Message[]>([]);
	const [result, setResult] = useState<ChatResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const chat = useCallback(async (body: { message: string; conversationHistory: Message[] }) => {
		setIsLoading(true);
		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await res.json();
			setResult(data);
			return data;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;

			const newMessage = message.trim();
			const res = await chat({ message: newMessage, conversationHistory: history });

			// Add user + assistant to history for next request
			const assistantContent =
				res && typeof res === 'object' && 'response' in res
					? (res as { response: string }).response
					: '';
			setHistory((prev) => [
				...prev,
				{ role: 'user', content: newMessage },
				...(assistantContent ? [{ role: 'assistant', content: assistantContent }] : []),
			]);
			setMessage('');
		},
		[message, isLoading, chat, history],
	);

	const handleClear = useCallback(() => {
		setHistory([]);
	}, []);

	const threshold = 10;
	const currentCount = history.length + 1;
	const willUseAdvanced = currentCount > threshold;

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-8 text-center">
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

					<h1 className="text-5xl font-thin">Dynamic Model</h1>

					<p className="text-gray-400 text-lg">
						LangChain{' '}
						<span className="italic font-serif">Dynamic Model Selection</span> on
						Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Middleware selects between gpt-4.1-mini (fast/cheap) and gpt-4.1
						(powerful) based on conversation complexity. Send more messages to trigger
						the upgrade.
					</p>
				</div>

				{/* Model Indicator */}
				<div className="bg-black border border-gray-900 rounded-lg p-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className={`size-3 rounded-full ${willUseAdvanced ? 'bg-purple-500' : 'bg-cyan-500'}`}
						/>
						<span className="text-sm text-gray-400">
							Next request will use{' '}
							<strong className="text-white">
								{willUseAdvanced ? 'gpt-4.1' : 'gpt-4.1-mini'}
							</strong>
						</span>
					</div>
					<div className="text-xs text-gray-500">
						{currentCount} / {threshold} messages (threshold for upgrade)
					</div>
				</div>

				{/* Chat Form */}
				<form
					onSubmit={handleSubmit}
					className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4"
				>
					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-none py-3 px-4 min-h-20 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2"
						disabled={isLoading}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
							setMessage(e.currentTarget.value)
						}
						placeholder="Ask a question..."
						rows={2}
						value={message}
					/>

					<div className="flex items-center gap-2">
						<div className="relative group">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-6 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading || !message.trim()}
								type="submit"
								data-loading={isLoading}
							>
								{isLoading ? 'Thinking' : 'Send'}
							</button>
						</div>

						{history.length > 0 && (
							<button
								type="button"
								className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer ml-2"
								onClick={handleClear}
							>
								Clear history ({history.length} messages)
							</button>
						)}
					</div>
				</form>

				{/* Response */}
				{isLoading ? (
					<div
						className="bg-black border border-gray-900 rounded-lg p-8 text-gray-600 text-sm"
						data-loading
					/>
				) : result ? (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
						<h3 className="text-white text-xl font-normal">Response</h3>
						<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
							{result.response}
						</p>
						<div className="text-gray-500 flex flex-wrap text-xs gap-4">
							<span>
								Model{' '}
								<strong
									className={
										result.modelUsed === 'gpt-4.1'
											? 'text-purple-400'
											: 'text-cyan-400'
									}
								>
									{result.modelUsed}
								</strong>
							</span>
							<span>
								Messages{' '}
								<strong className="text-gray-400">{result.messageCount}</strong>
							</span>
							{result.threadId && (
								<span>
									Thread{' '}
									<strong className="text-gray-400">
										{result.threadId.slice(0, 12)}...
									</strong>
								</span>
							)}
						</div>
					</div>
				) : null}

				{/* Conversation History */}
				{history.length > 0 && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-3">
						<h3 className="text-white text-xl font-normal">
							Conversation History
							<span className="text-gray-500 text-sm font-normal ml-2">
								({history.length} messages)
							</span>
						</h3>
						<div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
							{history.map((msg, i) => (
								<div
									key={`${msg.role}-${i}`}
									className={`text-sm rounded-md py-2 px-3 ${
										msg.role === 'user'
											? 'bg-gray-900 text-gray-300'
											: 'bg-gray-950 border border-gray-800 text-gray-400'
									}`}
								>
									<span className="text-xs uppercase tracking-wide text-gray-500 block mb-1">
										{msg.role}
									</span>
									<div className="truncate">{msg.content}</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* LangChain Patterns */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						LangChain Patterns
					</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'Dynamic Model Selection',
								text: 'wrapModelCall middleware swaps models based on message count',
							},
							{
								title: 'Two-Tier Models',
								text: 'gpt-4.1-mini for simple queries, gpt-4.1 for complex conversations',
							},
							{
								title: 'Middleware Integration',
								text: 'createMiddleware() hooks into the agent execution pipeline',
							},
						].map((item) => (
							<div key={item.title} className="flex items-start gap-3">
								<div className="items-center bg-cyan-950 border border-cyan-800 rounded flex size-4 shrink-0 justify-center mt-0.5">
									<svg
										aria-hidden="true"
										className="size-2.5"
										fill="none"
										height="24"
										stroke="var(--color-cyan-500)"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										width="24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M20 6 9 17l-5-5" />
									</svg>
								</div>
								<div>
									<h4 className="text-white text-sm font-normal -mt-0.5 mb-0.5">
										{item.title}
									</h4>
									<p className="text-gray-400 text-xs">{item.text}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
