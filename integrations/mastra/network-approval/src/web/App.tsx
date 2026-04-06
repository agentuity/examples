import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const EXAMPLE_REQUESTS = [
	{ label: 'Search (safe)', text: 'Search the web for recent AI news' },
	{ label: 'Lookup (safe)', text: 'Look up information about OpenAI' },
	{ label: 'Delete (approval)', text: 'Delete all expired records from the database' },
	{ label: 'Notify (approval)', text: 'Send an email notification to user@example.com saying their account is ready' },
	{ label: 'Confirm (suspend)', text: 'I need to confirm before deleting the old backup files' },
];

type ResultState = {
	response: string;
	suspended: boolean;
	suspendType?: string;
	pendingApproval?: {
		subAgent: string;
		toolName: string;
		reason: string;
		toolArgs?: string;
	};
	suspendedExecution?: {
		subAgent: string;
		toolName: string;
		suspendPayload: string;
	};
	toolExecuted?: string;
	subAgent?: string;
	threadId: string;
	sessionId: string;
	tokens: number;
};

type NetworkHistoryEntry = {
	id: string;
	toolName: string;
	subAgent: string;
	toolArgs: string;
	type: string;
	requestedAt: string;
	resolvedAt: string;
	tokens: number;
};

type StatsData = {
	threadId: string;
	totalOperations: number;
	immediateCount: number;
	approvedCount: number;
	declinedCount: number;
	resumedCount: number;
	totalTokens: number;
};

type NetworkState = {
	threadId: string;
	networkHistory: NetworkHistoryEntry[];
	pendingApproval?: ResultState['pendingApproval'] & { reason: string };
	suspendedExecution?: ResultState['suspendedExecution'];
	hasPending: boolean;
	hasSuspended: boolean;
	stats: StatsData;
};

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
	const res = await fetch(`/api${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	return res.json() as Promise<T>;
}

function getSuspendedMessage(suspendPayload: string | undefined): string {
	if (!suspendPayload) {
		return 'Execution is suspended and waiting for your input.';
	}

	try {
		const parsed = JSON.parse(suspendPayload) as { message?: unknown };

		if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
			return parsed.message;
		}
	} catch {
		return 'Execution is suspended and waiting for your input.';
	}

	return 'Execution is suspended and waiting for your input.';
}

function formatJson(value: string | undefined): string | null {
	if (!value) {
		return null;
	}

	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
}

function getResultMessage(result: {
	response?: string;
	suspended?: boolean;
	suspendType?: string;
	pendingApproval?: { reason?: string };
	suspendedExecution?: { suspendPayload?: string };
	toolExecuted?: string;
} | null): string {
	if (!result) {
		return '';
	}

	if (result.response?.trim()) {
		return result.response;
	}

	if (result.suspended && result.suspendType === 'approval') {
		return result.pendingApproval?.reason?.trim() || 'This operation is waiting for approval.';
	}

	if (result.suspended && result.suspendType === 'suspend') {
		return getSuspendedMessage(result.suspendedExecution?.suspendPayload);
	}

	if (result.toolExecuted) {
		return `Completed ${result.toolExecuted}.`;
	}

	return '';
}

export function App() {
	const [text, setText] = useState(EXAMPLE_REQUESTS[0]!.text);
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');
	const [requireToolApproval, setRequireToolApproval] = useState(false);
	const [latestResult, setLatestResult] = useState<ResultState | null>(null);

	const [isLoading, setIsLoading] = useState(false);
	const [isApproving, setIsApproving] = useState(false);
	const [isDeclining, setIsDeclining] = useState(false);
	const [isResuming, setIsResuming] = useState(false);

	const [networkState, setNetworkState] = useState<NetworkState | null>(null);

	const refreshState = useCallback(async () => {
		const state = await api<NetworkState>('GET', '/network/state');
		setNetworkState(state);
	}, []);

	useEffect(() => { void refreshState(); }, [refreshState]);

	const stateResult: ResultState | null = networkState?.pendingApproval
		? {
				response: `Tool "${networkState.pendingApproval.toolName}" (${networkState.pendingApproval.subAgent} sub-agent) still requires approval. ${networkState.pendingApproval.reason}`,
				suspended: true,
				suspendType: 'approval',
				pendingApproval: networkState.pendingApproval,
				subAgent: networkState.pendingApproval.subAgent,
				threadId: networkState.threadId,
				sessionId: '',
				tokens: 0,
		  }
		: networkState?.suspendedExecution
			? {
					response: getSuspendedMessage(networkState.suspendedExecution.suspendPayload),
					suspended: true,
					suspendType: 'suspend',
					suspendedExecution: networkState.suspendedExecution,
					subAgent: networkState.suspendedExecution.subAgent,
					threadId: networkState.threadId,
					sessionId: '',
					tokens: 0,
			  }
			: null;

	const result: ResultState | null = stateResult ?? latestResult;
	const resultMessage = getResultMessage(result);
	const displayResult: ResultState | null = result && resultMessage ? { ...result, response: resultMessage } : null;
	const history = networkState?.networkHistory ?? [];
	const stats = networkState?.stats;
	const isWorking = isLoading || isApproving || isDeclining || isResuming;

	const handleSend = useCallback(async () => {
		setIsLoading(true);
		try {
			const nextResult = await api<ResultState>('POST', '/network', { text, model, requireToolApproval });
			setLatestResult(nextResult);
			await refreshState();
		} finally {
			setIsLoading(false);
		}
	}, [text, model, requireToolApproval, refreshState]);

	const handleApprove = useCallback(async () => {
		setIsApproving(true);
		try {
			const nextResult = await api<ResultState>('POST', '/network/approve');
			setLatestResult(nextResult);
			await refreshState();
		} finally {
			setIsApproving(false);
		}
	}, [refreshState]);

	const handleDecline = useCallback(async () => {
		setIsDeclining(true);
		try {
			const nextResult = await api<ResultState>('POST', '/network/decline');
			setLatestResult(nextResult);
			await refreshState();
		} finally {
			setIsDeclining(false);
		}
	}, [refreshState]);

	const handleResume = useCallback(
		async (confirmed: boolean) => {
			setIsResuming(true);
			try {
				const nextResult = await api<ResultState>('POST', '/network/resume', { confirmed });
				setLatestResult(nextResult);
				await refreshState();
			} finally {
				setIsResuming(false);
			}
		},
		[refreshState]
	);

	const handleClearHistory = useCallback(async () => {
		await api('DELETE', '/network/history');
		setLatestResult(null);
		await refreshState();
	}, [refreshState]);

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
					{isWorking && !displayResult ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4"
							data-loading
						/>
					) : !displayResult ? (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
							Response will appear here
						</div>
					) : (
						<div className="flex flex-col gap-3">
							<div
								className={`text-sm bg-gray-950 border rounded-md py-3 px-4 whitespace-pre-wrap ${
									displayResult.suspended ? 'border-yellow-700 text-yellow-400' : 'border-gray-800 text-cyan-500'
								}`}
							>
								{displayResult.response}
							</div>

							{/* Approval actions */}
							{displayResult.suspended && displayResult.suspendType === 'approval' && (
								<div className="bg-yellow-950/30 border border-yellow-800 rounded-md p-4 flex flex-col gap-3">
									<div className="text-yellow-300 text-xs font-medium uppercase tracking-wide">
										Awaiting Approval
									</div>
									{displayResult.pendingApproval && (
										<div className="flex flex-col gap-1.5">
											<div className="text-xs text-gray-400">
												Tool:{' '}
												<code className="text-yellow-300">
													{displayResult.pendingApproval.subAgent} / {displayResult.pendingApproval.toolName}
												</code>
											</div>
											{displayResult.pendingApproval.reason && (
												<div className="text-xs text-gray-400">
													Reason:{' '}
													<span className="text-gray-300">{displayResult.pendingApproval.reason}</span>
												</div>
											)}
											{formatJson(displayResult.pendingApproval.toolArgs) && (
												<div className="text-xs text-gray-500">
													Args:
													<pre className="text-gray-400 break-all whitespace-pre-wrap mt-1">
														{formatJson(displayResult.pendingApproval.toolArgs)}
													</pre>
												</div>
											)}
										</div>
									)}
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

							{/* Resume actions */}
							{displayResult.suspended && displayResult.suspendType === 'suspend' && (
								<div className="bg-blue-950/20 border border-blue-800 rounded-md p-4 flex flex-col gap-3">
									<div className="text-blue-300 text-xs font-medium uppercase tracking-wide">
										Awaiting Input
									</div>
									{displayResult.suspendedExecution && (
										<div className="flex flex-col gap-1.5">
											<div className="text-xs text-gray-400">
												Tool:{' '}
												<code className="text-blue-300">
													{displayResult.suspendedExecution.subAgent} / {displayResult.suspendedExecution.toolName}
												</code>
											</div>
											{formatJson(displayResult.suspendedExecution.suspendPayload) && (
												<div className="text-xs text-gray-500">
													Payload:
													<pre className="text-gray-400 break-all whitespace-pre-wrap mt-1">
														{formatJson(displayResult.suspendedExecution.suspendPayload)}
													</pre>
												</div>
											)}
										</div>
									)}
									<div className="flex gap-2 mt-1">
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
									</div>
								</div>
							)}

							{/* Metadata */}
							<div className="text-gray-500 flex text-xs gap-4">
								{displayResult.subAgent && (
									<span>
										Sub-agent <strong className="text-gray-400">{displayResult.subAgent}</strong>
									</span>
								)}
								{displayResult.toolExecuted && (
									<span>
										Tool <strong className="text-gray-400">{displayResult.toolExecuted}</strong>
									</span>
								)}
								{displayResult.tokens > 0 && (
									<span>
										Tokens <strong className="text-gray-400">{displayResult.tokens}</strong>
									</span>
								)}
								{displayResult.threadId && (
									<span>
										Thread{' '}
										<strong className="text-gray-400">{displayResult.threadId.slice(0, 12)}...</strong>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Stats */}
				{stats && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
						<h3 className="text-white text-xl font-normal">Network Stats</h3>
						<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-white">{stats.totalOperations}</div>
								<div className="text-gray-500 text-xs mt-1">Total</div>
							</div>
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-cyan-400">{stats.immediateCount}</div>
								<div className="text-gray-500 text-xs mt-1">Immediate</div>
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
								<div className="text-2xl font-thin text-blue-400">{stats.resumedCount}</div>
								<div className="text-gray-500 text-xs mt-1">Resumed</div>
							</div>
							<div className="bg-gray-950 border border-gray-800 rounded-md py-3 px-4 text-center">
								<div className="text-2xl font-thin text-cyan-300">{stats.totalTokens}</div>
								<div className="text-gray-500 text-xs mt-1">Tokens</div>
							</div>
						</div>
					</div>
				)}

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
