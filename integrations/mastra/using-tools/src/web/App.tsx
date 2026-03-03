import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;

export function App() {
	const [message, setMessage] = useState('What is the weather in London?');
	const [activeAgent, setActiveAgent] = useState<'weather' | 'activities'>('weather');

	// API hooks for weather and activities agents
	const {
		data: weatherResult,
		invoke: askWeather,
		isLoading: isWeatherLoading,
	} = useAPI('POST /api/weather');

	const {
		data: activitiesResult,
		invoke: askActivities,
		isLoading: isActivitiesLoading,
	} = useAPI('POST /api/activities');

	const { track } = useAnalytics();

	const isLoading = isWeatherLoading || isActivitiesLoading;
	const result = activeAgent === 'weather' ? weatherResult : activitiesResult;

	const handleSubmit = useCallback(async () => {
		track('agent_query', { agent: activeAgent, message });
		if (activeAgent === 'weather') {
			await askWeather({ message });
		} else {
			await askActivities({ message });
		}
	}, [activeAgent, message, askWeather, askActivities, track]);

	const handleAgentChange = (agent: 'weather' | 'activities') => {
		setActiveAgent(agent);
		if (agent === 'weather') {
			setMessage('What is the weather in London?');
		} else {
			setMessage('What should I do in Paris today?');
		}
	};

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

					<h1 className="text-5xl font-thin">Using Tools</h1>

					<p className="text-gray-400 text-lg">
						Agents with <span className="italic font-serif">OpenAI Function Calling</span>
					</p>
				</div>

				{/* Agent Selector */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-3">
						<span>Select Agent:</span>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => handleAgentChange('weather')}
								className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
									activeAgent === 'weather'
										? 'bg-cyan-900/50 border-cyan-500 text-cyan-400'
										: 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
								}`}
							>
								Weather (1 Tool)
							</button>
							<button
								type="button"
								onClick={() => handleAgentChange('activities')}
								className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
									activeAgent === 'activities'
										? 'bg-cyan-900/50 border-cyan-500 text-cyan-400'
										: 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
								}`}
							>
								Activities (2 Tools)
							</button>
						</div>
					</div>

					<div className="text-sm text-gray-500">
						{activeAgent === 'weather' ? (
							<>
								<strong className="text-gray-300">Weather Agent:</strong> Uses a single{' '}
								<code className="text-cyan-400">get_weather</code> tool to fetch real weather
								data from wttr.in API.
							</>
						) : (
							<>
								<strong className="text-gray-300">Activities Agent:</strong> Uses two tools:{' '}
								<code className="text-cyan-400">get_weather</code> to check conditions and{' '}
								<code className="text-cyan-400">get_activities</code> to suggest activities.
							</>
						)}
					</div>
				</div>

				{/* Query Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<span>Ask the agent:</span>
						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-4 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading}
								onClick={handleSubmit}
								type="button"
							>
								{isLoading ? 'Thinking...' : 'Ask'}
							</button>
						</div>
					</div>

					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-y py-3 px-4 min-h-20 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2 z-10"
						disabled={isLoading}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.currentTarget.value)}
						placeholder="Ask about weather or activities..."
						rows={2}
						value={message}
					/>

					{/* Response */}
					{isLoading ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4"
							data-loading
						/>
					) : !result?.response ? (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
							Response will appear here
						</div>
					) : (
						<div className="flex flex-col gap-3">
							<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-cyan-500 py-3 px-4 whitespace-pre-wrap">
								{result.response}
							</div>

							<div className="text-gray-500 flex text-xs gap-4">
								{result.tokens > 0 && (
									<span>
										Tokens <strong className="text-gray-400">{result.tokens}</strong>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Tool Calls */}
				{result?.toolCalls && result.toolCalls.length > 0 && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
						<h3 className="text-white text-xl font-normal">Tool Calls</h3>

						<div className="flex flex-col gap-4">
							{result.toolCalls.map((call, index) => (
								<div
									key={`${call.tool}-${index}`}
									className="bg-gray-950 border border-gray-800 rounded-md p-4"
								>
									<div className="flex items-center gap-2 mb-3">
										<span className="bg-cyan-900/50 border border-cyan-700 text-cyan-400 px-2 py-0.5 rounded text-xs font-mono">
											{call.tool}
										</span>
									</div>

									<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
										<span className="text-gray-500">Input:</span>
										<code className="text-gray-300 font-mono text-xs bg-gray-900 px-2 py-1 rounded">
											{call.input}
										</code>

										<span className="text-gray-500">Output:</span>
										<code className="text-gray-300 font-mono text-xs bg-gray-900 px-2 py-1 rounded break-all">
											{call.output}
										</code>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Next Steps */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Next Steps</h3>

					<div className="flex flex-col gap-6">
						{[
							{
								key: 'weather-agent',
								title: 'Explore the Weather Agent',
								text: (
									<>
										Check <code className="text-white">src/agent/weather/index.ts</code> to
										see how a single tool is implemented with OpenAI function calling.
									</>
								),
							},
							{
								key: 'activities-agent',
								title: 'Explore the Activities Agent',
								text: (
									<>
										Check <code className="text-white">src/agent/activities/index.ts</code>{' '}
										to see how multiple tools work together.
									</>
								),
							},
							{
								key: 'add-tools',
								title: 'Add your own tools',
								text: (
									<>
										Define new tool functions and add them to the{' '}
										<code className="text-white">tools</code> array to extend agent
										capabilities.
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
										text: <>Test the agents directly in the dev UI.</>,
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
