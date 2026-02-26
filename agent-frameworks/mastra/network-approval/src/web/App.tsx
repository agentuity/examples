import { useAPI } from '@agentuity/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const EXAMPLE_REQUESTS = [
	{ label: 'Search (safe)', text: 'Search the web for recent AI news' },
	{ label: 'Lookup (safe)', text: 'Look up information about OpenAI' },
	{ label: 'Delete (approval)', text: 'Delete all expired user records' },
	{ label: 'Notify (approval)', text: 'Send an email notification to user@example.com saying their account is ready' },
	{ label: 'Confirm (suspend)', text: 'I need to confirm before deleting the old backup files' },
];

export function App() {
	const [text, setText] = useState(EXAMPLE_REQUESTS[0]!.text);
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');
	const [requireToolApproval, setRequireToolApproval] = useState(false);

	const { data: networkResult, invoke: sendNetwork, isLoading } = useAPI('POST /api/network');
	const { data: approveResult, invoke: approve, isLoading: isApproving } = useAPI('POST /api/network/approve');
	const { data: declineResult, invoke: decline, isLoading: isDeclining } = useAPI('POST /api/network/decline');
	const { data: resumeResult, invoke: resume, isLoading: isResuming } = useAPI('POST /api/network/resume');
	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/network/history');
	const { invoke: clearHistory } = useAPI('DELETE /api/network/history');

	// Use the most recent result from any action
	const result = resumeResult ?? approveResult ?? declineResult ?? networkResult;
	const history = historyData?.networkHistory ?? [];
	const isWorking = isLoading || isApproving || isDeclining || isResuming;

	const handleSend = useCallback(async () => {
		await sendNetwork({ text, model, requireToolApproval });
	}, [text, model, requireToolApproval, sendNetwork]);

	const handleApprove = useCallback(async () => {
		await approve();
		await refetchHistory();
	}, [approve, refetchHistory]);

	const handleDecline = useCallback(async () => {
		await decline();
		await refetchHistory();
	}, [decline, refetchHistory]);

	const handleResume = useCallback(
		async (confirmed: boolean) => {
			await resume({ confirmed });
			await refetchHistory();
		},
		[resume, refetchHistory]
	);

	const handleClearHistory = useCallback(async () => {
		await clearHistory();
		await refetchHistory();
	}, [clearHistory, refetchHistory]);

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

					<h1 className="text-5xl font-thin">Network Approval</h1>

					<p className="text-gray-400 text-lg">
						Mastra network approval patterns on{' '}
						<span className="italic font-serif">Agentuity</span>
					</p>
				</div>

				{/* Request Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-1.5">
						Send to network using
						<select
							className="appearance-none bg-transparent border-0 border-b border-dashed border-gray-700 text-white cursor-pointer font-normal outline-none hover:border-b-cyan-400 focus:border-b-cyan-400 -mb-0.5"
							disabled={isWorking}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setModel(e.currentTarget.value as (typeof MODELS)[number])
							}
							value={model}
						>
							<option value="gpt-5-nano">GPT-5 Nano</option>
							<option value="gpt-5-mini">GPT-5 Mini</option>
							<option value="gpt-5">GPT-5</option>
						</select>

						<label className="items-center flex gap-1.5 ml-2 cursor-pointer">
							<input
								type="checkbox"
								checked={requireToolApproval}
								onChange={(e) => setRequireToolApproval(e.target.checked)}
								disabled={isWorking}
								className="accent-cyan-500"
							/>
							<span className="text-xs">Require all approvals</span>
						</label>

						<div className="relative group ml-auto z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-4 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isWorking}
								onClick={handleSend}
								type="button"
								data-loading={isLoading}
							>
								{isLoading ? 'Sending' : 'Send'}
							</button>
						</div>
					</div>

					{/* Example request buttons */}
					<div className="flex flex-wrap gap-1.5">
						{EXAMPLE_REQUESTS.map((example) => (
							<button
								key={example.label}
								type="button"
								className="bg-gray-950 border border-gray-800 rounded text-gray-400 text-xs py-1 px-2 cursor-pointer transition-colors duration-150 hover:border-cyan-500 hover:text-white disabled:opacity-50"
								disabled={isWorking}
								onClick={() => setText(example.text)}
							>
								{example.label}
							</button>
						))}
					</div>

					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-y py-3 px-4 min-h-20 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2 z-10"
						disabled={isWorking}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.currentTarget.value)}
						placeholder="Enter a request for the network..."
						rows={2}
						value={text}
					/>

					{/* Result */}
					{isWorking && !result ? (
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
							<div
								className={`text-sm bg-gray-950 border rounded-md py-3 px-4 ${
									result.suspended ? 'border-yellow-700 text-yellow-400' : 'border-gray-800 text-cyan-500'
								}`}
							>
								{result.response}
							</div>

							{/* Approval actions */}
							{result.suspended && result.suspendType === 'approval' && (
								<div className="flex gap-2">
									<button
										type="button"
										className="bg-green-950 border border-green-700 rounded text-green-400 text-sm py-1.5 px-4 cursor-pointer transition-colors hover:bg-green-900 disabled:opacity-50"
										onClick={handleApprove}
										disabled={isWorking}
									>
										{isApproving ? 'Approving...' : 'Approve'}
									</button>
									<button
										type="button"
										className="bg-red-950 border border-red-700 rounded text-red-400 text-sm py-1.5 px-4 cursor-pointer transition-colors hover:bg-red-900 disabled:opacity-50"
										onClick={handleDecline}
										disabled={isWorking}
									>
										{isDeclining ? 'Declining...' : 'Decline'}
									</button>
									{result.pendingApproval && (
										<span className="text-gray-500 text-xs self-center ml-2">
											{result.pendingApproval.subAgent} / {result.pendingApproval.toolName}
										</span>
									)}
								</div>
							)}

							{/* Resume actions */}
							{result.suspended && result.suspendType === 'suspend' && (
								<div className="flex gap-2">
									<button
										type="button"
										className="bg-green-950 border border-green-700 rounded text-green-400 text-sm py-1.5 px-4 cursor-pointer transition-colors hover:bg-green-900 disabled:opacity-50"
										onClick={() => handleResume(true)}
										disabled={isWorking}
									>
										{isResuming ? 'Resuming...' : 'Confirm'}
									</button>
									<button
										type="button"
										className="bg-red-950 border border-red-700 rounded text-red-400 text-sm py-1.5 px-4 cursor-pointer transition-colors hover:bg-red-900 disabled:opacity-50"
										onClick={() => handleResume(false)}
										disabled={isWorking}
									>
										Cancel
									</button>
									{result.suspendedExecution && (
										<span className="text-gray-500 text-xs self-center ml-2">
											{result.suspendedExecution.subAgent} / {result.suspendedExecution.toolName}
										</span>
									)}
								</div>
							)}

							{/* Metadata */}
							<div className="text-gray-500 flex text-xs gap-4">
								{result.subAgent && (
									<span>
										Sub-agent <strong className="text-gray-400">{result.subAgent}</strong>
									</span>
								)}
								{result.toolExecuted && (
									<span>
										Tool <strong className="text-gray-400">{result.toolExecuted}</strong>
									</span>
								)}
								{result.tokens > 0 && (
									<span>
										Tokens <strong className="text-gray-400">{result.tokens}</strong>
									</span>
								)}
								{result.threadId && (
									<span>
										Thread{' '}
										<strong className="text-gray-400">{result.threadId.slice(0, 12)}...</strong>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* History */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<h3 className="text-white text-xl font-normal">Network History</h3>

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
								<div
									key={`${entry.id}-${index}`}
									className="items-center grid w-full text-xs gap-3 py-2 px-3 rounded transition-colors duration-150 hover:bg-gray-900 grid-cols-[auto_1fr_auto_auto] text-left"
								>
									<span
										className={`rounded text-center py-0.5 px-1.5 text-xs font-medium ${
											entry.type === 'approved'
												? 'bg-green-950 border border-green-800 text-green-400'
												: entry.type === 'declined'
													? 'bg-red-950 border border-red-800 text-red-400'
													: entry.type === 'resumed'
														? 'bg-blue-950 border border-blue-800 text-blue-400'
														: 'bg-gray-900 border border-gray-800 text-gray-400'
										}`}
									>
										{entry.type}
									</span>
									<span className="text-gray-400 truncate">
										{entry.subAgent} / {entry.toolName}
									</span>
									<span className="text-gray-600">{entry.tokens} tokens</span>
									<span className="text-gray-600">
										{new Date(entry.resolvedAt).toLocaleTimeString()}
									</span>
								</div>
							))
						) : (
							<div className="text-gray-600 text-sm py-2 px-3">History will appear here</div>
						)}
					</div>
				</div>

				{/* Info */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">How It Works</h3>
					<div className="flex flex-col gap-6">
						{[
							{
								key: 'safe',
								title: 'Safe tools execute immediately',
								text: 'Research sub-agent tools (search, lookup) run without approval.',
							},
							{
								key: 'approval',
								title: 'Dangerous tools require approval',
								text: 'Operations sub-agent tools (delete, notify) pause for approve/decline.',
							},
							{
								key: 'suspend',
								title: 'Confirmation tools suspend with context',
								text: 'The network suspends and provides options, then resumes with your response.',
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
										text: 'Test the network agent directly in the dev UI.',
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
											<path d="M20 6 9 17l-5-5" />
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
