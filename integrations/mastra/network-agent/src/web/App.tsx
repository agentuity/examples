import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const EXAMPLE_PROMPTS = [
	"What's the weather in Tokyo?",
	'Tell me three cool ways to use AI agents',
	'Research and write about renewable energy',
	'Tell me some historical facts about Paris',
];

export function App() {
	const [message, setMessage] = useState('');
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-mini');

	// API hooks for network agent
	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/network/history');
	const { data: networkResult, invoke: sendMessage, isLoading } = useAPI('POST /api/network');
	const { invoke: clearHistory } = useAPI('DELETE /api/network/history');

	const { track } = useAnalytics();

	// Conversation history from network agent
	const conversation = networkResult?.events ?? [];
	const executedPrimitives = networkResult?.executedPrimitives ?? [];

	const handleSend = useCallback(async () => {
		if (!message.trim()) return;
		track('network_message', { message, model });
		await sendMessage({ message, model });
		setMessage('');
	}, [message, model, sendMessage, track]);

	const handleClearHistory = useCallback(async () => {
		track('clear_history');
		await clearHistory();
		await refetchHistory();
	}, [clearHistory, refetchHistory, track]);

	const handleExampleClick = useCallback((prompt: string) => {
		setMessage(prompt);
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend]
	);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-8 relative text-center">
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

					<h1 className="text-5xl font-thin">Agent Network</h1>

					<p className="text-gray-400 text-lg">
						A routing agent that coordinates{' '}
						<span className="italic font-serif">research, writing, and tools</span>
					</p>
				</div>

				{/* Chat Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-1.5">
						<span>Send a message using</span>
						<select
							className="appearance-none bg-transparent border-0 border-b border-dashed border-gray-700 text-white cursor-pointer font-normal outline-none hover:border-b-cyan-400 focus:border-b-cyan-400 -mb-0.5"
							disabled={isLoading}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setModel(e.currentTarget.value as (typeof MODELS)[number])
							}
							value={model}
						>
							<option value="gpt-5-nano">GPT-5 Nano</option>
							<option value="gpt-5-mini">GPT-5 Mini</option>
							<option value="gpt-5">GPT-5</option>
						</select>
						<div className="relative group ml-auto z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-4 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading || !message.trim()}
								onClick={handleSend}
								type="button"
								data-loading={isLoading}
							>
								{isLoading ? 'Processing...' : 'Send'}
							</button>
						</div>
					</div>

					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-y py-3 px-4 min-h-28 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2 z-10"
						disabled={isLoading}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask me anything... I can research topics, write content, check weather, or provide city information."
						rows={3}
						value={message}
					/>

					{/* Example Prompts */}
					<div className="flex flex-wrap gap-2">
						{EXAMPLE_PROMPTS.map((prompt) => (
							<button
								key={prompt}
								type="button"
								className="text-xs bg-gray-900 border border-gray-800 rounded-full px-3 py-1 text-gray-400 hover:text-white hover:border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
								onClick={() => handleExampleClick(prompt)}
								disabled={isLoading}
							>
								{prompt}
							</button>
						))}
					</div>

					{/* Response */}
					{isLoading ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4"
							data-loading
						/>
					) : !networkResult?.response ? (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
							Response will appear here
						</div>
					) : (
						<div className="flex flex-col gap-3">
							<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-cyan-500 py-3 px-4 whitespace-pre-wrap">
								{networkResult.response}
							</div>

							<div className="text-gray-500 flex flex-wrap text-xs gap-4">
								{executedPrimitives.length > 0 && (
									<span className="group border-b border-dashed border-gray-700 cursor-help relative transition-colors duration-200 hover:border-b-cyan-400">
										<span>
											Executed{' '}
											<strong className="text-gray-400">
												{executedPrimitives.join(', ')}
											</strong>
										</span>

										<div className="group-hover:flex hidden absolute left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-lg p-4 leading-normal z-10 mb-2 shadow-2xl text-left w-72 bottom-full flex-col gap-2">
											<div className="text-base text-white font-semibold">
												Executed Primitives
											</div>
											<p className="text-gray-400">
												The routing agent decided to use these tools/agents to complete
												your request.
											</p>
										</div>
									</span>
								)}

								{networkResult.threadId && (
									<span className="group border-b border-dashed border-gray-700 cursor-help relative transition-colors duration-200 hover:border-b-cyan-400">
										<span>
											Thread{' '}
											<strong className="text-gray-400">
												{networkResult.threadId.slice(0, 12)}...
											</strong>
										</span>

										<div className="group-hover:flex hidden absolute left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-lg p-4 leading-normal z-10 mb-2 shadow-2xl text-left w-72 bottom-full flex-col gap-2">
											<div className="text-base text-white font-semibold">Thread ID</div>
											<p className="text-gray-400">
												Your <strong className="text-gray-200">conversation context</strong>{' '}
												that persists across requests. The network agent remembers your
												conversation history.
											</p>
										</div>
									</span>
								)}

								{networkResult.sessionId && (
									<span>
										Session{' '}
										<strong className="text-gray-400">
											{networkResult.sessionId.slice(0, 12)}...
										</strong>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Network Architecture */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<h3 className="text-white text-xl font-normal">Network Architecture</h3>
						{conversation.length > 0 && (
							<button
								className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
								onClick={handleClearHistory}
								type="button"
							>
								Clear History
							</button>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						{[
							{
								name: 'Research Agent',
								description: 'Gathers concise insights as bullet points',
								tool: 'research_topic',
							},
							{
								name: 'Writing Agent',
								description: 'Produces full-paragraph written content',
								tool: 'write_content',
							},
							{
								name: 'Weather Tool',
								description: 'Gets current weather for any location',
								tool: 'get_weather',
							},
							{
								name: 'City Workflow',
								description: 'Coordinates research + writing for cities',
								tool: 'city_research',
							},
						].map((item) => (
							<div
								key={item.name}
								className={`bg-gray-950 border rounded-md p-4 transition-colors ${
									executedPrimitives.includes(item.tool)
										? 'border-cyan-500 bg-cyan-950/20'
										: 'border-gray-800'
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<div
										className={`w-2 h-2 rounded-full ${
											executedPrimitives.includes(item.tool) ? 'bg-cyan-500' : 'bg-gray-700'
										}`}
									/>
									<span className="text-white text-sm font-medium">{item.name}</span>
								</div>
								<p className="text-gray-500 text-xs">{item.description}</p>
							</div>
						))}
					</div>

					<p className="text-gray-500 text-xs text-center">
						The routing agent uses LLM reasoning to decide which primitives to call based on your
						message.
					</p>
				</div>

				{/* Next Steps */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Next Steps</h3>

					<div className="flex flex-col gap-6">
						{[
							{
								key: 'customize-network',
								title: 'Customize the network',
								text: (
									<>
										Edit <code className="text-white">src/agent/network/index.ts</code> to
										add new tools or modify routing behavior.
									</>
								),
							},
							{
								key: 'add-agents',
								title: 'Add new agents',
								text: (
									<>
										Create agents in <code className="text-white">src/agent/</code> and
										register them in the network's tool definitions.
									</>
								),
							},
							{
								key: 'add-workflows',
								title: 'Create workflows',
								text: (
									<>
										Add workflows in{' '}
										<code className="text-white">src/agent/network/workflows.ts</code> to
										coordinate multi-step tasks.
									</>
								),
							},
							WORKBENCH_PATH
								? {
										key: 'workbench',
										title: (
											<>
												Try{' '}
												<a href={WORKBENCH_PATH} className="underline relative">
													Workbench
												</a>
											</>
										),
										text: <>Test the network agent directly in the dev UI.</>,
									}
								: null,
						]
							.filter((step): step is NonNullable<typeof step> => Boolean(step))
							.map((step) => (
								<div key={step.key} className="items-start flex gap-3">
									<div className="items-center bg-green-950 border border-green-500 rounded flex size-4 shrink-0 justify-center">
										<svg
											aria-hidden="true"
											className="size-2.5"
											fill="none"
											height="24"
											stroke="var(--color-green-500)"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											viewBox="0 0 24 24"
											width="24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M20 6 9 17l-5-5"></path>
										</svg>
									</div>

									<div>
										<h4 className="text-white text-sm font-normal -mt-0.5 mb-0.5">
											{step.title}
										</h4>
										<p className="text-gray-400 text-xs">{step.text}</p>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
