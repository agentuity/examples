import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	"What's the weather in San Francisco?",
	'Search for the latest AI news',
	"What's the weather in Tokyo and New York?",
	'Tell me about LangChain',
];

type Step = {
	type: string;
	content: string;
	toolName?: string;
	toolArgs?: string;
};

type ChatResult = {
	response: string;
	steps: Step[];
	threadId: string;
	sessionId: string;
};

export function App() {
	const [message, setMessage] = useState('');
	const [showSteps, setShowSteps] = useState(false);
	const [result, setResult] = useState<ChatResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const chat = useCallback(async (body: { message: string }) => {
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
			await chat({ message: message.trim() });
		},
		[message, isLoading, chat],
	);

	const handleSuggestion = useCallback(
		async (suggestion: string) => {
			setMessage(suggestion);
			await chat({ message: suggestion });
		},
		[chat],
	);

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

					<h1 className="text-5xl font-thin">Basic Agent</h1>

					<p className="text-gray-400 text-lg">
						LangChain <span className="italic font-serif">ReAct Agent</span> on Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Static model + tools + error handling middleware. The agent uses the ReAct loop
						to reason about your question, call tools, and deliver a final answer.
					</p>
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
						placeholder="Ask a question (try weather or search)..."
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
					</div>

					{/* Suggestions */}
					{!result && !isLoading && (
						<div className="flex flex-wrap gap-2 mt-2">
							{SUGGESTIONS.map((s) => (
								<button
									key={s}
									type="button"
									className="text-xs bg-gray-900 border border-gray-800 rounded-full text-gray-400 py-1.5 px-3 cursor-pointer hover:border-gray-700 hover:text-white transition-colors"
									onClick={() => handleSuggestion(s)}
								>
									{s}
								</button>
							))}
						</div>
					)}
				</form>

				{/* Response */}
				{isLoading ? (
					<div
						className="bg-black border border-gray-900 rounded-lg p-8 text-gray-600 text-sm"
						data-loading
					/>
				) : result ? (
					<>
						{/* Final Answer */}
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
							<h3 className="text-white text-xl font-normal">Response</h3>
							<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
								{result.response}
							</p>
							<div className="text-gray-500 flex text-xs gap-4">
								{result.threadId && (
									<span>
										Thread{' '}
										<strong className="text-gray-400">
											{result.threadId.slice(0, 12)}...
										</strong>
									</span>
								)}
								{result.sessionId && (
									<span>
										Session{' '}
										<strong className="text-gray-400">
											{result.sessionId.slice(0, 12)}...
										</strong>
									</span>
								)}
							</div>
						</div>

						{/* ReAct Trace */}
						{result.steps?.length > 0 && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
								<button
									type="button"
									className="text-white text-xl font-normal text-left flex items-center gap-2 cursor-pointer"
									onClick={() => setShowSteps(!showSteps)}
								>
									ReAct Trace
									<span className="text-gray-500 text-sm font-normal">
										({result.steps.length} steps) {showSteps ? '▾' : '▸'}
									</span>
								</button>

								{showSteps && (
									<div className="flex flex-col gap-3">
										{result.steps.map((step: Step, i: number) => (
											<div
												key={`${step.type}-${i}`}
												className={`text-sm rounded-md py-2 px-3 ${
													step.type === 'human'
														? 'bg-gray-900 text-gray-300'
														: step.type === 'tool_call'
															? 'bg-cyan-950/30 border border-cyan-900/50 text-cyan-400'
															: step.type === 'tool_result'
																? 'bg-gray-950 border border-gray-800 text-gray-400'
																: 'bg-gray-900 text-gray-200'
												}`}
											>
												<span className="text-xs uppercase tracking-wide text-gray-500 block mb-1">
													{step.type === 'tool_call'
														? `Tool Call → ${step.toolName}`
														: step.type === 'tool_result'
															? `Tool Result ← ${step.toolName}`
															: step.type}
												</span>
												{step.toolArgs && (
													<div className="text-xs text-gray-500 mb-1 font-mono">
														{step.toolArgs}
													</div>
												)}
												<div>{step.content}</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</>
				) : null}

				{/* LangChain Patterns */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						LangChain Patterns
					</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'Static Model',
								text: 'ChatOpenAI instance with temperature, maxTokens, and timeout configuration',
							},
							{
								title: 'Static Tools',
								text: 'search and get_weather defined with tool() + Zod schemas',
							},
							{
								title: 'Error Handling',
								text: 'wrapToolCall middleware catches errors and returns ToolMessage for recovery',
							},
							{
								title: 'ReAct Loop',
								text: 'Agent reasons, calls tools, observes results, and delivers a final answer',
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
