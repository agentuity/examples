import { useAPI } from '@agentuity/react';
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	'Search for the latest AI news and tell me the time in New York',
	"What's the weather and what is 42 * 17?",
	'Search for stock market news',
	"What time is it in Tokyo and what's the weather like?",
];

type TimelineEntry = {
	step: number;
	type: string;
	content: string;
	timestamp: number;
};

export function App() {
	const [message, setMessage] = useState('');
	const [showTimeline, setShowTimeline] = useState(true);

	const { data: chatResult, invoke: chat, isLoading } = useAPI('POST /api/chat');
	const result = chatResult as {
		response: string;
		timeline: TimelineEntry[];
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
		async (suggestion: string) => {
			setMessage(suggestion);
			await chat({ message: suggestion });
		},
		[chat],
	);

	const typeColor = (type: string) => {
		switch (type) {
			case 'tool_call':
				return 'bg-cyan-950/30 border border-cyan-900/50 text-cyan-400';
			case 'tool_result':
				return 'bg-gray-950 border border-gray-800 text-gray-400';
			case 'agent_updated':
				return 'bg-purple-950/30 border border-purple-900/50 text-purple-400';
			case 'message':
				return 'bg-gray-900 text-gray-300';
			default:
				return 'bg-gray-900 text-gray-200';
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

					<h1 className="text-5xl font-thin">Streaming Events</h1>

					<p className="text-gray-400 text-lg">
						OpenAI Agents SDK{' '}
						<span className="italic font-serif">Real-Time Stream Events</span> on Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Stream agent execution with run(agent, input, {'{ stream: true }'}). Captures
						raw_model_stream_event, run_item_stream_event, and agent_updated_stream_event in
						a timeline. Try multi-step questions to see tool calls stream in.
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
						placeholder="Ask a multi-step question to see streaming in action..."
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
								{isLoading ? 'Streaming' : 'Send'}
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
								<span>
									Steps{' '}
									<strong className="text-gray-400">{result.totalSteps}</strong>
								</span>
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

						{/* Streaming Timeline */}
						{result.timeline?.length > 0 && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
								<button
									type="button"
									className="text-white text-xl font-normal text-left flex items-center gap-2 cursor-pointer"
									onClick={() => setShowTimeline(!showTimeline)}
								>
									Streaming Timeline
									<span className="text-gray-500 text-sm font-normal">
										({result.timeline.length} events) {showTimeline ? '▾' : '▸'}
									</span>
								</button>

								{showTimeline && (
									<div className="flex flex-col gap-3">
										{result.timeline.map((entry, i) => (
											<div
												key={`${entry.type}-${entry.step}-${i}`}
												className={`text-sm rounded-md py-2 px-3 ${typeColor(entry.type)}`}
											>
												<div className="flex items-center justify-between mb-1">
													<span className="text-xs uppercase tracking-wide text-gray-500">
														{entry.type.replace('_', ' ')}
													</span>
													<span className="text-xs text-gray-600 font-mono">
														+{entry.timestamp}ms
													</span>
												</div>
												<div>{entry.content}</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</>
				) : null}

				{/* OpenAI Agents SDK Patterns */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						OpenAI Agents SDK Patterns
					</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'Stream Mode',
								text: 'run(agent, input, { stream: true }) enables incremental output delivery',
							},
							{
								title: 'raw_model_stream_event',
								text: 'Low-level model response chunks including text deltas as they generate',
							},
							{
								title: 'run_item_stream_event',
								text: 'Agent SDK events: tool calls starting, tool results arriving, messages completing',
							},
							{
								title: 'agent_updated_stream_event',
								text: 'Fires when the active agent changes (useful in multi-agent handoff scenarios)',
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
