import { useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	'The history of the Silk Road',
	'How CRISPR gene editing works',
	'The James Webb Space Telescope',
	'Origins of the Internet',
];

interface ResearchResult {
	summary: string;
	sourcesUsed: number;
}

export function App() {
	const [topic, setTopic] = useState('');
	const [data, setData] = useState<ResearchResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleResearch = useCallback(async () => {
		const trimmed = topic.trim();
		if (!trimmed) return;
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/research', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: trimmed }),
			});
			if (!res.ok) throw new Error(`Request failed: ${res.status}`);
			const result = await res.json();
			setData(result);
		} catch (err) {
			setError(String(err));
		} finally {
			setIsLoading(false);
		}
	}, [topic]);

	const handleSuggestion = useCallback(
		async (suggestion: string) => {
			setTopic(suggestion);
			setIsLoading(true);
			setError(null);
			try {
				const res = await fetch('/api/research', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ topic: suggestion }),
				});
				if (!res.ok) throw new Error(`Request failed: ${res.status}`);
				const result = await res.json();
				setData(result);
			} catch (err) {
				setError(String(err));
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const handleReset = useCallback(() => {
		setTopic('');
		setData(null);
		setError(null);
	}, []);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-8 md:p-16 w-full">
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

					<h1 className="text-5xl font-thin">Research Agent</h1>

					<p className="text-gray-400 text-lg">
						An <span className="italic font-serif">autonomous</span> research assistant powered by Wikipedia
					</p>
				</div>

				{/* Input Card */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<label htmlFor="topic" className="text-gray-400 text-sm">
							What would you like to research?
						</label>
						<div className="flex gap-3">
							<input
								id="topic"
								type="text"
								value={topic}
								onChange={(e) => setTopic(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleResearch();
								}}
								placeholder="Enter a topic..."
								disabled={isLoading}
								className="flex-1 text-sm bg-gray-950 border border-gray-800 rounded-md text-white py-2.5 px-4 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2 disabled:opacity-50"
							/>
							<div className="relative group z-0">
								<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
								<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
								<button
									className="relative font-semibold text-white px-4 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isLoading || !topic.trim()}
									onClick={handleResearch}
									type="button"
									data-loading={isLoading}
								>
									{isLoading ? 'Researching' : 'Research'}
								</button>
							</div>
						</div>
					</div>

					{/* Suggestions */}
					{!data && !isLoading && !error && (
						<div className="flex flex-col gap-2">
							<span className="text-gray-500 text-xs">Try one of these:</span>
							<div className="flex flex-wrap gap-2">
								{SUGGESTIONS.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => handleSuggestion(s)}
										className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
									>
										{s}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 shadow-2xl flex items-center justify-center gap-4">
						<div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
						<p className="text-gray-400 text-sm" data-loading="true">
							Researching
						</p>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="flex flex-col gap-3">
						<div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-red-400 text-sm">
							{error}
						</div>
						<button
							type="button"
							onClick={handleReset}
							className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white self-start"
						>
							Try again
						</button>
					</div>
				)}

				{/* Results */}
				{data && !isLoading && (
					<div className="flex flex-col gap-4">
						<div className="bg-cyan-950/30 border border-cyan-900 rounded-lg p-6 flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-cyan-500 text-xs uppercase tracking-wider font-medium">
									Research Summary
								</span>
								<span className="bg-gray-900 border border-gray-800 rounded py-0.5 px-2 text-cyan-500 text-xs">
									{data.sourcesUsed} {data.sourcesUsed === 1 ? 'source' : 'sources'}
								</span>
							</div>
							<div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
								{data.summary}
							</div>
						</div>

						<button
							type="button"
							onClick={handleReset}
							className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white self-start"
						>
							Research another topic
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
