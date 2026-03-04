import { useCallback, useEffect, useRef, useState } from 'react';
import { TARGETS } from '../lib/targets';
import type { ExplorationStep, StreamEvent } from '../lib/types';
import './App.css';

type AppState = 'idle' | 'exploring' | 'done' | 'error';

export function App() {
	const [customUrl, setCustomUrl] = useState('');
	const [steps, setSteps] = useState<ExplorationStep[]>([]);
	const [summary, setSummary] = useState<{ summary: string; title: string; url: string } | null>(
		null
	);
	const [appState, setAppState] = useState<AppState>('idle');
	const [error, setError] = useState<string | null>(null);
	const maxSteps = 4;

	const eventSourceRef = useRef<EventSource | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll to latest step
	useEffect(() => {
		if (steps.length > 0 || summary) {
			bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [steps.length, summary]);

	const handleExplore = useCallback(
		(url: string) => {
			// Prevent duplicate explorations
			if (eventSourceRef.current) return;

			// Reset state for new exploration
			setSteps([]);
			setSummary(null);
			setError(null);
			setAppState('exploring');
			const params = new URLSearchParams({ url, maxSteps: String(maxSteps) });
			const es = new EventSource(`/api/explore/stream?${params.toString()}`);
			eventSourceRef.current = es;

			es.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as StreamEvent;

					switch (data.type) {
						case 'preview':
							setSteps((prev) => [
								...prev,
								{
									stepNumber: data.stepNumber,
									screenshotUrl: data.screenshotUrl,
									action: data.action,
									observation: '',
									pageUrl: data.pageUrl,
									cached: data.cached,
									elementRef: data.elementRef,
								},
							]);
							break;
						case 'step':
							setSteps((prev) =>
								prev.map((s) =>
									s.stepNumber === data.step.stepNumber ? data.step : s
								)
							);
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
						case 'done':
							setAppState('done');
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
		},
		[]
	);

	const handleCustomExplore = useCallback(() => {
		if (!customUrl.trim()) return;
		const url = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
		handleExplore(url);
	}, [customUrl, handleExplore]);

	const handleReset = useCallback(() => {
		eventSourceRef.current?.close();
		eventSourceRef.current = null;
		setCustomUrl('');
		setSteps([]);
		setSummary(null);
		setError(null);
		setAppState('idle');
	}, []);

	// Clean up EventSource on unmount
	useEffect(() => {
		return () => {
			eventSourceRef.current?.close();
		};
	}, []);

	const isExploring = appState === 'exploring';
	const hasResults = steps.length > 0 || summary;
	const isActive = isExploring || hasResults;

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-6 max-w-3xl p-8 md:p-16 w-full">
				{/* Header — compact when active, large when idle */}
				{isActive ? (
					<div className="flex items-center gap-4 mb-4">
						<Logo className="h-auto w-8 shrink-0" />
						<div>
							<h1 className="text-2xl font-thin">
								{summary?.title ?? 'Exploring...'}
							</h1>
							<p className="text-gray-500 text-sm break-all">
								{summary?.url ?? (steps[0]?.pageUrl || '')}
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

				{/* Input section — only when idle */}
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

				{/* Initial loading (before first step arrives) */}
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

				{/* Timeline — appears as soon as steps stream in */}
				{hasResults && (
					<>
						<div className="relative">
							<div className="absolute left-4 top-8 bottom-0 w-px bg-gray-800" />
							<div className="flex flex-col gap-8">
								{steps.map((step) => (
									<div
										key={step.stepNumber}
										className="step-enter relative pl-12"
									>
										<div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-500 text-sm font-medium z-10">
											{step.stepNumber}
										</div>
										{step.cached && (
											<span className="absolute left-10 top-1.5 bg-cyan-950 border border-cyan-800 rounded text-cyan-400 text-[10px] py-0.5 px-1.5 font-medium uppercase tracking-wider">
												Cached
											</span>
										)}
										<div className="bg-black border border-gray-900 rounded-lg p-5 flex flex-col gap-4">
											<div>
												<span className="text-gray-500 text-xs uppercase tracking-wider">
													Action
												</span>
												<p className="text-white text-sm mt-1">
													{step.action}
												</p>
											</div>
											<img
												src={step.screenshotUrl}
												alt={`Step ${step.stepNumber} screenshot`}
												className="rounded-lg border border-gray-800 shadow-lg w-full"
											/>
											<div>
												<span className="text-gray-500 text-xs uppercase tracking-wider">
													Observation
												</span>
												{step.observation ? (
													<p className="text-gray-300 text-sm mt-1">
														{step.observation}
													</p>
												) : (
													<div className="flex items-center gap-2 mt-1">
														<div className="w-3 h-3 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
														<span className="text-gray-500 text-sm" data-loading="true">
															Observing
														</span>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Loading indicator during streaming */}
						{isExploring && (
							<div className="ml-12 flex items-center gap-3 py-4">
								<div className="w-5 h-5 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
								<span
									className="text-gray-400 text-sm"
									data-loading="true"
								>
									Step {steps.length + 1} of {maxSteps}
								</span>
							</div>
						)}

						{/* Summary card */}
						{summary && (
							<div className="step-enter bg-black border border-cyan-900 rounded-lg p-6 ml-12">
								<span className="text-cyan-500 text-xs uppercase tracking-wider font-medium">
									Summary
								</span>
								<p className="text-gray-300 text-sm mt-2 leading-relaxed">
									{summary.summary}
								</p>
							</div>
						)}

						{/* Reset button */}
						{!isExploring && (
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

				{/* Scroll anchor */}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}

// Agentuity logo SVG component
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
