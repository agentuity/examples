import { useCallback, useEffect, useRef, useState } from 'react';
import { TARGETS } from '../lib/targets';
import type { MemoryVisit, StreamEvent } from '../agent/web-explorer/types';
import './App.css';

type AppState = 'idle' | 'exploring' | 'paused' | 'done' | 'error';

interface ToolCallState {
	toolCallId: string;
	toolName: string;
	action?: string;
	reason?: string;
	status: 'running' | 'done';
	output?: string;
	screenshotUrl?: string;
	observation?: string;
	durationMs?: number;
	round: number;
}

interface Batch {
	round: number;
	count: number;
	collapsed: boolean;
}

const MAJOR_BROWSER_ACTIONS = new Set(['screenshot', 'click', 'navigate', 'fill']);

function isMajorToolCall(tc: ToolCallState): boolean {
	if (tc.toolName === 'store_finding' || tc.toolName === 'finish_exploration') return true;
	if (tc.toolName === 'browser') return MAJOR_BROWSER_ACTIONS.has(tc.action ?? '');
	return true;
}

export function App() {
	const [customUrl, setCustomUrl] = useState('');
	const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
	const [memoryVisits, setMemoryVisits] = useState<MemoryVisit[]>([]);
	const [memoryExpanded, setMemoryExpanded] = useState(false);
	const [summary, setSummary] = useState<{ summary: string; title: string; url: string } | null>(
		null
	);
	const [appState, setAppState] = useState<AppState>('idle');
	const [error, setError] = useState<string | null>(null);
	const [exploringUrl, setExploringUrl] = useState('');
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [currentRound, setCurrentRound] = useState(1);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [thinkingTexts, setThinkingTexts] = useState<Map<number, string>>(new Map());

	const eventSourceRef = useRef<EventSource | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll to latest tool call
	useEffect(() => {
		if (toolCalls.length > 0 || summary) {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [toolCalls.length, summary]);

	const handleSSEEvents = useCallback((es: EventSource, round: number) => {
		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data) as StreamEvent;

				switch (data.type) {
					case 'session':
						setSessionId(data.sessionId);
						break;
					case 'tool_call_start':
						setToolCalls((prev) => [
							...prev,
							{
								toolCallId: data.toolCallId,
								toolName: data.toolName,
								action: data.action,
								reason: data.reason,
								status: 'running',
								round,
							},
						]);
						break;
					case 'tool_call_finish':
						setToolCalls((prev) =>
							prev.map((tc) =>
								tc.toolCallId === data.toolCallId
									? {
											...tc,
											status: 'done' as const,
											output: data.output,
											screenshotUrl: data.screenshotUrl,
											observation: data.observation,
											durationMs: data.durationMs,
										}
									: tc
							)
						);
						break;
					case 'thinking':
						setThinkingTexts((prev) => {
							const next = new Map(prev);
							next.set(data.stepNumber, data.text);
							return next;
						});
						break;
					case 'memory':
						setMemoryVisits(data.visits);
						break;
					case 'summary':
						setSummary({ summary: data.summary, title: data.title, url: data.url });
						break;
					case 'error':
						setError(data.message);
						setAppState('error');
						es.close();
						eventSourceRef.current = null;
						break;
					case 'paused':
						setSessionId(data.sessionId);
						setAppState('paused');
						es.close();
						eventSourceRef.current = null;
						break;
				}
			} catch {
				// Ignore malformed events
			}
		};

		es.onerror = () => {
			setAppState((current) => {
				if (current === 'exploring') {
					setError('Connection lost. Partial results may be shown below.');
					es.close();
					eventSourceRef.current = null;
					return 'error';
				}
				return current;
			});
		};
	}, []);

	const handleExplore = useCallback(
		(url: string) => {
			if (eventSourceRef.current) return;

			setToolCalls([]);
			setMemoryVisits([]);
			setMemoryExpanded(false);
			setSummary(null);
			setError(null);
			setAppState('exploring');
			setExploringUrl(url);
			setSessionId(null);
			setCurrentRound(1);
			setBatches([]);
			setThinkingTexts(new Map());

			const params = new URLSearchParams({ url, maxSteps: '16' });
			const es = new EventSource(`/api/explore/stream?${params.toString()}`);
			eventSourceRef.current = es;
			handleSSEEvents(es, 1);
		},
		[handleSSEEvents]
	);

	const handleExploreMore = useCallback(() => {
		if (!sessionId || eventSourceRef.current) return;

		const newRound = currentRound + 1;

		const prevRoundCount = toolCalls.filter((tc) => tc.round === currentRound).length;
		setBatches((prev) => [...prev, { round: currentRound, count: prevRoundCount, collapsed: true }]);
		setCurrentRound(newRound);

		setSummary(null);
		setThinkingTexts(new Map());
		setAppState('exploring');

		const params = new URLSearchParams({ sessionId, maxSteps: '10' });
		const es = new EventSource(`/api/explore/stream?${params.toString()}`);
		eventSourceRef.current = es;
		handleSSEEvents(es, newRound);
	}, [sessionId, currentRound, toolCalls, handleSSEEvents]);

	const handleCustomExplore = useCallback(() => {
		if (!customUrl.trim()) return;
		const url = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
		handleExplore(url);
	}, [customUrl, handleExplore]);

	const handleReset = useCallback(() => {
		eventSourceRef.current?.close();
		eventSourceRef.current = null;
		if (sessionId) {
			fetch(`/api/explore/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
		}
		setCustomUrl('');
		setToolCalls([]);
		setMemoryVisits([]);
		setMemoryExpanded(false);
		setSummary(null);
		setError(null);
		setAppState('idle');
		setExploringUrl('');
		setSessionId(null);
		setCurrentRound(1);
		setBatches([]);
		setThinkingTexts(new Map());
	}, [sessionId]);

	const handleEndSession = useCallback(() => {
		handleReset();
	}, [handleReset]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			eventSourceRef.current?.close();
		};
	}, []);

	// Clean up session on tab close
	useEffect(() => {
		const cleanup = () => {
			if (sessionId) {
				fetch(`/api/explore/session/${sessionId}`, { method: 'DELETE', keepalive: true }).catch(() => {});
			}
		};
		window.addEventListener('beforeunload', cleanup);
		return () => window.removeEventListener('beforeunload', cleanup);
	}, [sessionId]);

	const toggleBatch = useCallback((round: number) => {
		setBatches((prev) =>
			prev.map((b) => (b.round === round ? { ...b, collapsed: !b.collapsed } : b))
		);
	}, []);

	const isExploring = appState === 'exploring';
	const isPaused = appState === 'paused';
	const hasResults = toolCalls.length > 0 || summary;
	const isActive = isExploring || isPaused || hasResults;

	// Compute step numbers for major tool calls
	const stepNumbers = new Map<string, number>();
	let stepCounter = 0;
	for (const tc of toolCalls) {
		if (isMajorToolCall(tc)) {
			stepCounter++;
			stepNumbers.set(tc.toolCallId, stepCounter);
		}
	}

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-6 max-w-3xl p-8 md:p-16 w-full">
				{/* Header */}
				{isActive ? (
					<div className="flex items-center gap-4 mb-4">
						<Logo className="h-auto w-8 shrink-0" />
						<div>
							<h1 className="text-2xl font-thin">
								{summary?.title ?? 'Exploring...'}
							</h1>
							<p className="text-gray-500 text-sm break-all">
								{summary?.url ?? exploringUrl}
							</p>
						</div>
					</div>
				) : (
					<div className="items-center flex flex-col gap-2 justify-center mb-8 text-center">
						<Logo className="h-auto mb-4 w-12" />
						<h1 className="text-5xl font-thin">Web Explorer</h1>
						<p className="text-gray-400 text-lg">
							AI-guided{' '}
							<span className="italic font-serif">autonomous</span> web
							exploration in a sandbox
						</p>
					</div>
				)}

				{/* Error banner */}
				{error && (
					<div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-red-400 text-sm">
						{error}
					</div>
				)}

				{/* Input section */}
				{!isActive && (
					<>
						<div className="flex flex-col gap-4">
							{TARGETS.map((target) => (
								<button
									key={target.url}
									type="button"
									className="bg-black border border-gray-900 rounded-lg p-6 text-left cursor-pointer transition-all duration-200 hover:border-cyan-900 hover:bg-gray-950 group"
									onClick={() => handleExplore(target.url)}
								>
									<h3 className="text-white font-medium mb-1 group-hover:text-cyan-500 transition-colors">
										{target.label}
									</h3>
									<p className="text-gray-500 text-sm leading-relaxed">
										{target.description}
									</p>
								</button>
							))}
						</div>

						<div className="bg-black border border-gray-900 rounded-lg p-6 flex flex-col gap-4">
							<p className="text-gray-400 text-sm">
								Or enter a custom URL to explore:
							</p>
							<div className="flex gap-3">
								<input
									type="url"
									value={customUrl}
									onChange={(e) => setCustomUrl(e.currentTarget.value)}
									placeholder="https://..."
									className="flex-1 text-sm bg-gray-950 border border-gray-800 rounded-md text-white py-2.5 px-4 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2"
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleCustomExplore();
									}}
								/>
								<div className="relative group z-0">
									<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
									<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
									<button
										className="relative font-semibold text-white px-5 py-2.5 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={!customUrl.trim()}
										onClick={handleCustomExplore}
										type="button"
									>
										Explore
									</button>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Initial loading */}
				{isExploring && !hasResults && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-4">
						<div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
						<div className="text-center">
							<p className="text-white text-sm" data-loading="true">
								Exploring
							</p>
							<p className="text-gray-500 text-xs mt-1">
								The AI is navigating and taking screenshots in a sandbox
								browser
							</p>
						</div>
					</div>
				)}

				{/* Memory card — collapsed by default */}
				{memoryVisits.length > 0 && (
					<div className="step-enter bg-cyan-950/20 border border-cyan-900/50 rounded-lg">
						<button
							type="button"
							className="w-full flex items-center justify-between p-4 cursor-pointer"
							onClick={() => setMemoryExpanded((v) => !v)}
						>
							<span className="text-cyan-500 text-xs uppercase tracking-wider font-medium">
								Past Visits ({memoryVisits.length})
							</span>
							<span className="text-cyan-400 text-[11px] uppercase tracking-wider">
								{memoryExpanded ? 'Collapse' : 'Expand'}
							</span>
						</button>
						{memoryExpanded && (
							<div className="flex flex-col gap-3 px-4 pb-4">
								{memoryVisits.map((visit) => (
									<div key={visit.url} className="flex gap-3 items-start">
										{visit.screenshotUrl && (
											<img
												src={visit.screenshotUrl}
												alt={visit.title}
												className="w-20 h-14 rounded border border-gray-800 object-cover shrink-0"
											/>
										)}
										<div className="min-w-0">
											{visit.title && visit.title !== visit.url && (
												<p className="text-gray-300 text-xs font-medium truncate">
													{visit.title}
												</p>
											)}
											<p className="text-gray-500 text-[11px] truncate">
												{visit.url}
											</p>
											<p className="text-gray-400 text-xs mt-0.5 line-clamp-2 leading-relaxed">
												{visit.observation}
											</p>
											{visit.actionsTaken.length > 0 && (
												<p className="text-gray-600 text-[10px] mt-0.5 truncate">
													Tried: {visit.actionsTaken.slice(0, 3).join(', ')}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Tool-call timeline */}
				{hasResults && (
					<>
						<div className="relative">
							<div className="absolute left-4 top-8 bottom-0 w-px bg-gray-800" />
							<div className="flex flex-col gap-4">
								{/* Render collapsed batches and visible tool calls */}
								{batches.map((batch) => (
									<div key={`batch-${batch.round}`}>
										<button
											type="button"
											className="step-enter relative pl-12 w-full text-left cursor-pointer group"
											onClick={() => toggleBatch(batch.round)}
										>
											<div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 border border-gray-700 text-gray-500 text-xs z-10">
												{batch.round}
											</div>
											<div className="bg-gray-950 border border-gray-800 rounded-lg p-3 group-hover:border-gray-700 transition-colors">
												<span className="text-gray-500 text-xs">
													Round {batch.round}: {batch.count} actions
													<span className="text-gray-600 ml-2">
														{batch.collapsed ? '(click to expand)' : '(click to collapse)'}
													</span>
												</span>
											</div>
										</button>
										{!batch.collapsed && (
											<div className="flex flex-col gap-4 mt-4">
												{toolCalls
													.filter((tc) => tc.round === batch.round)
													.map((tc) => (
														<ToolCallCard key={tc.toolCallId} tc={tc} stepNumber={stepNumbers.get(tc.toolCallId)} />
													))}
											</div>
										)}
									</div>
								))}

								{/* Current round tool calls */}
								{toolCalls
									.filter((tc) => tc.round === currentRound)
									.map((tc) => (
										<ToolCallCard key={tc.toolCallId} tc={tc} stepNumber={stepNumbers.get(tc.toolCallId)} />
									))}

								{/* Latest thinking / observation */}
								{(() => {
									const latestThinking = [...thinkingTexts.values()].pop();
									if (!latestThinking) return null;
									return (
										<div className="step-enter ml-12 py-2">
											<p className="text-gray-400 text-sm italic leading-relaxed">{latestThinking}</p>
										</div>
									);
								})()}
							</div>
						</div>

						{/* Summary card */}
						{summary?.summary && (
							<div className="step-enter bg-black border border-cyan-900 rounded-lg p-6 ml-12">
								<span className="text-cyan-500 text-xs uppercase tracking-wider font-medium">
									Summary
								</span>
								<p className="text-gray-300 text-sm mt-2 leading-relaxed">
									{summary.summary}
								</p>
							</div>
						)}

						{/* Paused state: Explore More / End Session */}
						{isPaused && (
							<div className="flex justify-center gap-4 mt-4">
								<button
									className="bg-transparent border border-cyan-900 rounded-lg text-cyan-500 cursor-pointer text-sm transition-all duration-200 py-2.5 px-6 hover:bg-cyan-950 hover:border-cyan-700"
									onClick={handleExploreMore}
									type="button"
								>
									Explore More
								</button>
								<button
									className="bg-transparent border border-gray-800 rounded-lg text-gray-400 cursor-pointer text-sm transition-all duration-200 py-2.5 px-6 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
									onClick={handleEndSession}
									type="button"
								>
									End Session
								</button>
							</div>
						)}

						{/* Reset button (done/error state) */}
						{(appState === 'done' || appState === 'error') && (
							<div className="flex justify-center mt-4">
								<button
									className="bg-transparent border border-gray-800 rounded-lg text-gray-400 cursor-pointer text-sm transition-all duration-200 py-2.5 px-6 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
									onClick={handleReset}
									type="button"
								>
									Explore Another
								</button>
							</div>
						)}
					</>
				)}

				<div ref={bottomRef} />
			</div>
		</div>
	);
}

function ToolCallCard({ tc, stepNumber }: { tc: ToolCallState; stepNumber?: number }) {
	const isMajor = isMajorToolCall(tc);
	const isScreenshot = tc.toolName === 'browser' && tc.action === 'screenshot';

	const label = tc.toolName === 'browser'
		? tc.action ?? 'browser'
		: tc.toolName === 'store_finding'
			? 'Finding'
			: tc.toolName === 'finish_exploration'
				? 'Done'
				: tc.toolName;

	// Minor actions: compact single-row card with small gray dot
	if (!isMajor) {
		return (
			<div className="step-enter relative pl-12">
				<div className="absolute left-[10px] top-3 w-2.5 h-2.5 rounded-full bg-gray-700 z-10" />
				<div className="bg-black border border-gray-900 rounded-lg p-3 flex items-center gap-3">
					<span className="tool-call-label text-xs font-medium uppercase tracking-wider text-gray-600">
						{label}
					</span>
					{tc.reason && (
						<span className="text-gray-500 text-xs truncate flex-1">{tc.reason}</span>
					)}
					{tc.durationMs != null && (
						<span className="text-gray-600 text-[10px] shrink-0">
							{tc.durationMs < 1000 ? `${Math.round(tc.durationMs)}ms` : `${(tc.durationMs / 1000).toFixed(1)}s`}
						</span>
					)}
				</div>
			</div>
		);
	}

	// Major actions: numbered cyan circle with full card
	return (
		<div className="step-enter relative pl-12">
			<div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full z-10 text-xs font-medium bg-cyan-950 border border-cyan-500 text-cyan-500">
				{tc.status === 'running' ? (
					<div className="w-3 h-3 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
				) : (
					<span>{stepNumber ?? ''}</span>
				)}
			</div>

			<div className="bg-black border border-gray-900 rounded-lg flex flex-col gap-3 p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="tool-call-label text-xs font-medium uppercase tracking-wider text-gray-500">
							{label}
						</span>
						{tc.durationMs != null && (
							<span className="text-gray-600 text-[10px]">
								{tc.durationMs < 1000 ? `${Math.round(tc.durationMs)}ms` : `${(tc.durationMs / 1000).toFixed(1)}s`}
							</span>
						)}
					</div>
					{tc.status === 'running' && (
						<span className="text-cyan-500 text-[10px] uppercase tracking-wider" data-loading="true">
							Running
						</span>
					)}
				</div>

				{tc.reason && tc.toolName !== 'finish_exploration' && (
					<p className="text-gray-300 text-sm">{tc.reason}</p>
				)}

				{isScreenshot && tc.screenshotUrl && (
					<img
						src={tc.screenshotUrl}
						alt="Page screenshot"
						className="rounded-lg border border-gray-800 shadow-lg w-full"
					/>
				)}

				{isScreenshot && tc.observation && (
					<div>
						<span className="text-gray-500 text-xs uppercase tracking-wider">
							Observation
						</span>
						<p className="text-gray-300 text-sm mt-1 leading-relaxed">
							{tc.observation}
						</p>
					</div>
				)}

				{tc.toolName === 'finish_exploration' && tc.reason && (
					<p className="text-gray-300 text-sm italic">{tc.reason}</p>
				)}
			</div>
		</div>
	);
}

function Logo({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
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
	);
}
