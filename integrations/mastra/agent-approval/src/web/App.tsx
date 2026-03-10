import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const EXAMPLE_REQUESTS = [
	{ label: "Weather (safe)", text: "What's the weather in Tokyo?" },
	{ label: "Search (safe)", text: "Search for recent records about AI" },
	{ label: "Delete (approval)", text: "Delete all data for user_123" },
	{ label: "Email (approval)", text: "Send an email to john@example.com" },
];

export function App() {
	const [text, setText] = useState(EXAMPLE_REQUESTS[0]!.text);
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');
	const [requireToolApproval, setRequireToolApproval] = useState(false);

	const { track } = useAnalytics();

	const { data: approvalResult, invoke: sendApproval, isLoading } = useAPI('POST /api/approval');
	const { data: approveResult, invoke: approve, isLoading: isApproving } = useAPI('POST /api/approval/approve');
	const { data: declineResult, invoke: decline, isLoading: isDeclining } = useAPI('POST /api/approval/decline');
	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/approval/history');
	const { data: statsData, refetch: refetchStats } = useAPI('GET /api/approval/stats');
	const { invoke: clearHistory } = useAPI('DELETE /api/approval/history');

	// Use the most recent result from any action
	const result = approveResult ?? declineResult ?? approvalResult;
	const history = historyData?.approvalHistory ?? [];
	const stats = statsData;
	const isWorking = isLoading || isApproving || isDeclining;

	const handleSend = useCallback(async () => {
		track('approval_request', { model, requireToolApproval });
		await sendApproval({ text, model, requireToolApproval });
		await refetchStats();
	}, [text, model, requireToolApproval, sendApproval, refetchStats, track]);

	const handleApprove = useCallback(async () => {
		track('approval_approved');
		await approve(undefined);
		await refetchHistory();
		await refetchStats();
	}, [approve, refetchHistory, refetchStats, track]);

	const handleDecline = useCallback(async () => {
		track('approval_declined');
		await decline(undefined);
		await refetchHistory();
		await refetchStats();
	}, [decline, refetchHistory, refetchStats, track]);

	const handleClearHistory = useCallback(async () => {
		await clearHistory();
		await refetchHistory();
		await refetchStats();
	}, [clearHistory, refetchHistory, refetchStats]);

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

					<h1 className="text-5xl font-thin">Approval Agent</h1>

					<p className="text-gray-400 text-lg">
						Mastra tool approval patterns on{' '}
						<span className="italic font-serif">Agentuity</span>
					</p>
				</div>

				{/* Request Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-1.5">
						Send using
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
							<span className="text-xs">Require approval for ALL tool calls</span>
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
								{isLoading ? 'Processing...' : 'Send'}
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
						placeholder="Enter a request for the agent..."
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
								className={`text-sm bg-gray-950 border rounded-md py-3 px-4 whitespace-pre-wrap ${
									result.suspended
										? 'border-yellow-700 text-yellow-400'
										: 'border-gray-800 text-cyan-500'
								}`}
							>
								{result.response}
							</div>

							{/* Pending approval panel */}
							{result.suspended && result.pendingApproval && (
								<div className="bg-yellow-950/30 border border-yellow-800 rounded-md p-4 flex flex-col gap-3">
									<div className="text-yellow-300 text-xs font-medium uppercase tracking-wide">
										Awaiting Approval
									</div>
									<div className="flex flex-col gap-1.5">
										<div className="text-xs text-gray-400">
											Tool:{' '}
											<code className="text-yellow-300">{result.pendingApproval.toolName}</code>
										</div>
										{result.pendingApproval.reason && (
											<div className="text-xs text-gray-400">
												Reason:{' '}
												<span className="text-gray-300">{result.pendingApproval.reason}</span>
											</div>
										)}
										{result.pendingApproval.toolArgs && (
											<div className="text-xs text-gray-500">
												Args:{' '}
												<code className="text-gray-400 break-all">
													{result.pendingApproval.toolArgs}
												</code>
											</div>
										)}
									</div>
									<div className="flex gap-2 mt-1">
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
									</div>
								</div>
							)}

							{/* Metadata */}
							<div className="text-gray-500 flex text-xs gap-4">
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

				{/* Stats */}
				{stats && stats.totalRequests > 0 && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
						<h3 className="text-white text-xl font-normal">Stats</h3>
						<div className="grid grid-cols-4 gap-4">
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-white">{stats.totalRequests}</div>
								<div className="text-gray-500 text-xs mt-1">Total</div>
							</div>
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-green-400">{stats.approvedCount}</div>
								<div className="text-gray-500 text-xs mt-1">Approved</div>
							</div>
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-red-400">{stats.declinedCount}</div>
								<div className="text-gray-500 text-xs mt-1">Declined</div>
							</div>
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-cyan-400">{stats.totalTokens}</div>
								<div className="text-gray-500 text-xs mt-1">Tokens</div>
							</div>
						</div>
					</div>
				)}

				{/* Approval History */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<h3 className="text-white text-xl font-normal">Approval History</h3>

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
											entry.status === 'approved'
												? 'bg-green-950 border border-green-800 text-green-400'
												: entry.status === 'declined'
													? 'bg-red-950 border border-red-800 text-red-400'
													: 'bg-gray-900 border border-gray-800 text-gray-400'
										}`}
									>
										{entry.status}
									</span>
									<span className="text-gray-400 truncate">{entry.toolName}</span>
									<span className="text-gray-600">{entry.tokens} tokens</span>
									<span className="text-gray-600">
										{new Date(entry.resolvedAt).toLocaleTimeString()}
									</span>
								</div>
							))
						) : (
							<div className="text-gray-600 text-sm py-2 px-3">
								Approval history will appear here
							</div>
						)}
					</div>
				</div>

				{/* How It Works */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">How It Works</h3>
					<div className="flex flex-col gap-6">
						{[
							{
								key: 'safe',
								title: 'Safe tools execute immediately',
								text: 'Tools like weather lookup and search run without any approval required.',
							},
							{
								key: 'approval',
								title: 'Sensitive tools require approval',
								text: (
									<>
										Tools like <code className="text-white">delete-user-data</code> and{' '}
										<code className="text-white">send-notification</code> are created with{' '}
										<code className="text-white">requireApproval: true</code> and pause for
										approve/decline.
									</>
								),
							},
							{
								key: 'agent-level',
								title: 'Agent-level approval overrides everything',
								text: 'Check "Require approval for ALL tool calls" to force approval on every tool call, regardless of tool-level settings.',
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
										text: 'Test the approval agent directly in the dev UI.',
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
