import { useAPI } from '@agentuity/react';
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	{ label: 'Multi-tool query', message: 'What is the weather, what time is it in New York, and what are 15% of 85?' },
	{ label: 'Search + calculate', message: 'Search for the latest stock market news and calculate 1000 * 1.012' },
	{ label: 'Simple search', message: 'Search for the latest sports scores' },
	{ label: 'Time zones', message: 'What time is it in London and Tokyo?' },
];

export function App() {
	const [message, setMessage] = useState('');

	const { data: chatResult, invoke: chat, isLoading } = useAPI('POST /api/chat');
	const result = chatResult as {
		response: string;
		timeline: Array<{
			step: number;
			type: string;
			content: string;
			timestamp: number;
		}>;
		totalSteps: number;
		threadId: string;
		sessionId: string;
	} | null;

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;
			await chat({ message: message.trim() });
		},
		[message, isLoading, chat],
	);

	const handleSuggestion = useCallback(
		async (s: (typeof SUGGESTIONS)[number]) => {
			setMessage(s.message);
			await chat({ message: s.message });
		},
		[chat],
	);

	const typeColor = (type: string) => {
		switch (type) {
			case 'tool_call': return 'text-yellow-400';
			case 'tool_result': return 'text-green-400';
			case 'ai_message': return 'text-cyan-400';
			default: return 'text-gray-400';
		}
	};

	const typeBorder = (type: string) => {
		switch (type) {
			case 'tool_call': return 'border-yellow-900/50 bg-yellow-950/20';
			case 'tool_result': return 'border-green-900/50 bg-green-950/20';
			case 'ai_message': return 'border-cyan-900/50 bg-cyan-950/20';
			default: return 'border-gray-800 bg-gray-950';
		}
	};

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

					<h1 className="text-5xl font-thin">Streaming</h1>

					<p className="text-gray-400 text-lg">
						LangChain{' '}
						<span className="italic font-serif">agent.stream()</span> on
						Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Stream agent responses with intermediate progress. Watch tool calls
						and results arrive step-by-step in the timeline.
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
						placeholder="Ask something that uses multiple tools..."
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
								{isLoading ? 'Streaming' : 'Stream'}
							</button>
						</div>
					</div>

					{/* Suggestions */}
					{!result && !isLoading && (
						<div className="flex flex-wrap gap-2 mt-2">
							{SUGGESTIONS.map((s) => (
								<button
									key={s.label}
									type="button"
									className="text-xs bg-gray-900 border border-gray-800 rounded-full text-gray-400 py-1.5 px-3 cursor-pointer hover:border-gray-700 hover:text-white transition-colors"
									onClick={() => handleSuggestion(s)}
								>
									{s.label}
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
						{/* Final Response */}
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
							<h3 className="text-white text-xl font-normal">Response</h3>
							<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
								{result.response}
							</p>
							<div className="text-gray-500 flex flex-wrap text-xs gap-4">
								<span>
									Steps <strong className="text-gray-400">{result.totalSteps}</strong>
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

						{/* Stream Timeline */}
						{result.timeline.length > 0 && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
								<h3 className="text-white text-xl font-normal">
									Stream Timeline
								</h3>
								<div className="flex flex-col gap-2">
									{result.timeline.map((entry, i) => (
										<div
											key={`${entry.step}-${i}`}
											className={`text-sm border rounded-md py-2 px-3 flex flex-col gap-1 ${typeBorder(entry.type)}`}
										>
											<div className="flex items-center gap-2">
												<span className={`text-xs font-mono ${typeColor(entry.type)}`}>
													{entry.type}
												</span>
												<span className="text-gray-600 text-xs">
													step {entry.step} &middot; {entry.timestamp}ms
												</span>
											</div>
											<p className="text-gray-300 text-xs break-all">
												{entry.content}
											</p>
										</div>
									))}
								</div>
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
								title: 'agent.stream()',
								text: 'Stream the agent execution to receive chunks as they arrive',
							},
							{
								title: 'streamMode: "values"',
								text: 'Get full state snapshots at each step showing the complete message list',
							},
							{
								title: 'Intermediate Steps',
								text: 'Track tool calls, tool results, and AI messages as they happen in the ReAct loop',
							},
							{
								title: 'Timeline Visualization',
								text: 'Build a real-time view of the agent reasoning process with timestamps',
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
