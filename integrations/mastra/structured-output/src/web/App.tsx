import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, Fragment, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;
const PLAN_TYPES = ['work', 'personal', 'mixed'] as const;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;
const DEFAULT_PROMPT =
	'I need to plan a productive day. I have a team meeting in the morning, need to finish a project report, go to the gym, and have dinner with a friend.';

type Activity = {
	name: string;
	startTime: string;
	endTime: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
};

type TimeBlock = {
	name: string;
	activities: Activity[];
};

export function App() {
	const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
	const [planType, setPlanType] = useState<(typeof PLAN_TYPES)[number]>('mixed');
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');

	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/plan/history');
	const { data: planResult, invoke: createPlan, isLoading } = useAPI('POST /api/plan');
	const { invoke: clearHistory } = useAPI('DELETE /api/plan/history');
	const { track } = useAnalytics();

	const history = planResult?.history ?? historyData?.history ?? [];
	const threadId = planResult?.threadId ?? historyData?.threadId;

	const handleCreatePlan = useCallback(async () => {
		track('create_plan', { prompt, planType, model });
		await createPlan({ prompt, planType, model });
	}, [prompt, planType, model, createPlan, track]);

	const handleClearHistory = useCallback(async () => {
		track('clear_history');
		await clearHistory();
		await refetchHistory();
	}, [clearHistory, refetchHistory, track]);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high':
				return 'text-red-400 border-red-500/30 bg-red-500/10';
			case 'medium':
				return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
			case 'low':
				return 'text-green-400 border-green-500/30 bg-green-500/10';
			default:
				return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
		}
	};

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-4xl p-16 w-full">
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

					<h1 className="text-5xl font-thin">Structured Output</h1>

					<p className="text-gray-400 text-lg">
						AI-powered <span className="italic font-serif">Day Planner</span> with structured data
					</p>
				</div>

				{/* Plan Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-1.5">
						Create a
						<select
							className="appearance-none bg-transparent border-0 border-b border-dashed border-gray-700 text-white cursor-pointer font-normal outline-none hover:border-b-cyan-400 focus:border-b-cyan-400 -mb-0.5"
							disabled={isLoading}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setPlanType(e.currentTarget.value as (typeof PLAN_TYPES)[number])
							}
							value={planType}
						>
							<option value="work">Work</option>
							<option value="personal">Personal</option>
							<option value="mixed">Mixed</option>
						</select>
						plan using
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
								disabled={isLoading}
								onClick={handleCreatePlan}
								type="button"
								data-loading={isLoading}
							>
								{isLoading ? 'Planning' : 'Plan My Day'}
							</button>
						</div>
					</div>

					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-y py-3 px-4 min-h-28 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2 z-10"
						disabled={isLoading}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.currentTarget.value)}
						placeholder="Describe your day - what do you need to accomplish?"
						rows={4}
						value={prompt}
					/>

					{/* Plan Result */}
					{isLoading ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4"
							data-loading
						/>
					) : !planResult?.plan ? (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
							Your structured daily plan will appear here
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{/* Summary */}
							<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-cyan-500 py-3 px-4">
								<strong>Summary:</strong> {planResult.summary}
							</div>

							{/* Structured Plan */}
							<div className="bg-gray-950 border border-gray-800 rounded-md p-4">
								<h4 className="text-white text-sm font-semibold mb-4">
									Structured Output ({planResult.totalActivities} activities)
								</h4>

								<div className="flex flex-col gap-4">
									{(planResult.plan as TimeBlock[]).map((block, blockIndex) => (
										<div key={blockIndex} className="border border-gray-800 rounded-lg p-3">
											<h5 className="text-cyan-400 text-sm font-medium mb-2">
												{block.name}
											</h5>
											<div className="flex flex-col gap-2">
												{block.activities.map((activity, actIndex) => (
													<div
														key={actIndex}
														className="bg-gray-900 rounded p-2 text-xs grid grid-cols-[auto_1fr_auto] gap-2 items-center"
													>
														<span className="text-gray-500 font-mono">
															{activity.startTime}-{activity.endTime}
														</span>
														<div>
															<span className="text-white font-medium">
																{activity.name}
															</span>
															<span className="text-gray-500 ml-2">
																{activity.description}
															</span>
														</div>
														<span
															className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(activity.priority)}`}
														>
															{activity.priority}
														</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Metadata */}
							<div className="text-gray-500 flex text-xs gap-4">
								{planResult.tokens > 0 && (
									<span>
										Tokens <strong className="text-gray-400">{planResult.tokens}</strong>
									</span>
								)}

								{planResult.threadId && (
									<span className="group border-b border-dashed border-gray-700 cursor-help relative transition-colors duration-200 hover:border-b-cyan-400">
										<span>
											Thread{' '}
											<strong className="text-gray-400">
												{planResult.threadId.slice(0, 12)}...
											</strong>
										</span>
										<div className="group-hover:flex hidden absolute left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-lg p-4 leading-normal z-10 mb-2 shadow-2xl text-left w-72 bottom-full flex-col gap-2">
											<div className="text-base text-white font-semibold">Thread ID</div>
											<p className="text-gray-400">
												Your <strong className="text-gray-200">conversation context</strong>{' '}
												that persists across requests.
											</p>
										</div>
									</span>
								)}

								{planResult.sessionId && (
									<span className="group border-b border-dashed border-gray-700 cursor-help relative transition-colors duration-200 hover:border-b-cyan-400">
										<span>
											Session{' '}
											<strong className="text-gray-400">
												{planResult.sessionId.slice(0, 12)}...
											</strong>
										</span>
										<div className="group-hover:flex hidden absolute left-1/2 -translate-x-1/2 -translate-y-2 bg-gray-900 border border-gray-800 rounded-lg p-4 leading-normal z-10 shadow-2xl text-left w-72 bottom-full flex-col gap-2">
											<div className="text-base text-white font-semibold">Session ID</div>
											<p className="text-gray-400">
												A <strong className="text-gray-200">unique identifier</strong> for this
												specific request.
											</p>
										</div>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* History */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<h3 className="text-white text-xl font-normal">Recent Plans</h3>

						{history.length > 0 && (
							<button
								className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
								onClick={handleClearHistory}
								type="button"
							>
								Clear
							</button>
						)}
					</div>

					<div className="bg-gray-950 rounded-md">
						{history.length > 0 ? (
							[...history].reverse().map((entry, index) => (
								<button
									key={`${entry.timestamp}-${index}`}
									type="button"
									tabIndex={0}
									className="group items-center grid w-full text-xs gap-3 py-2 px-3 rounded cursor-help relative transition-colors duration-150 hover:bg-gray-900 focus:outline-none grid-cols-[1fr_auto_auto] text-left"
								>
									<span className="text-gray-400 truncate">{entry.prompt}</span>

									<span className="bg-gray-900 border border-gray-800 rounded text-gray-400 text-center py-0.5 px-1.5">
										{entry.planType} / {entry.activityCount} activities
									</span>

									<span className="text-gray-600">{entry.sessionId.slice(0, 12)}...</span>

									{/* Pop-up */}
									<div className="group-hover:grid hidden absolute left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-lg p-4 leading-normal z-10 mb-2 shadow-2xl text-left bottom-full gap-2 grid-cols-[auto_1fr_auto]">
										{[
											{ label: 'Model', value: entry.model, description: null },
											{ label: 'Tokens', value: entry.tokens, description: null },
											{ label: 'Activities', value: entry.activityCount, description: null },
											{
												label: 'Thread',
												value: `${threadId?.slice(0, 12)}...`,
												description: '(Same for all)',
											},
											{
												label: 'Session',
												value: `${entry.sessionId.slice(0, 12)}...`,
												description: '(Unique)',
											},
										].map((item) => (
											<Fragment key={item.label}>
												<span className="text-gray-500">{item.label}</span>
												<span className="text-gray-200 font-medium">{item.value}</span>
												<span className="text-gray-500 text-xs">{item.description}</span>
											</Fragment>
										))}
									</div>
								</button>
							))
						) : (
							<div className="text-gray-600 text-sm py-2 px-3">History will appear here</div>
						)}
					</div>
				</div>

				{/* Schema Display */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<h3 className="text-white text-xl font-normal">Output Schema</h3>
					<p className="text-gray-400 text-sm">
						The agent returns structured data that matches this schema, making it easy to render in UI
						or process programmatically.
					</p>
					<pre className="bg-gray-950 border border-gray-800 rounded-md p-4 text-xs text-gray-400 overflow-x-auto">
						{`{
  plan: [{
    name: string,        // Time block name
    activities: [{
      name: string,      // Activity name
      startTime: string, // HH:MM format
      endTime: string,   // HH:MM format
      description: string,
      priority: "high" | "medium" | "low"
    }]
  }],
  summary: string,       // Day summary
  totalActivities: number,
  tokens: number,
  sessionId: string,
  threadId: string
}`}
					</pre>
				</div>

				{/* Next Steps */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Next Steps</h3>

					<div className="flex flex-col gap-6">
						{[
							{
								key: 'customize-schema',
								title: 'Customize the output schema',
								text: (
									<>
										Edit <code className="text-white">src/agent/translate/index.ts</code> to
										define your own structured output format.
									</>
								),
							},
							{
								key: 'add-routes',
								title: 'Add new API routes',
								text: (
									<>
										Create new files in <code className="text-white">src/api/</code> to
										expose more endpoints.
									</>
								),
							},
							{
								key: 'update-frontend',
								title: 'Update the frontend',
								text: (
									<>
										Modify <code className="text-white">src/web/App.tsx</code> to display
										structured data in custom ways.
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
										text: <>Test the day planner agent directly in the dev UI.</>,
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
