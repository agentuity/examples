import { useAPI } from '@agentuity/react';
import { useCallback, useState } from 'react';
import './App.css';

function relativeTime(dateStr: string): string {
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diff = now - then;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days === 1) return 'Yesterday';
	return `${days}d ago`;
}

export function App() {
	const [copied, setCopied] = useState(false);

	const {
		data: latestData,
		refetch: refetchLatest,
		isLoading: loadingLatest,
	} = useAPI('GET /api/digests/latest');
	const {
		data: historyData,
		refetch: refetchHistory,
		isLoading: loadingHistory,
	} = useAPI('GET /api/digests/history');
	const { invoke: triggerDigest, isLoading: generating } = useAPI('POST /api/digest/now');

	const [runError, setRunError] = useState<string | null>(null);

	const handleRunNow = useCallback(async () => {
		setRunError(null);
		try {
			await triggerDigest();
			await Promise.all([refetchLatest(), refetchHistory()]);
		} catch (err) {
			setRunError(err instanceof Error ? err.message : 'Failed to generate digest');
		}
	}, [triggerDigest, refetchLatest, refetchHistory]);

	const handleCopy = useCallback(async (url: string) => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, []);

	const latest = latestData?.exists ? latestData.digest : null;
	const digests = historyData?.digests ?? [];

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
					<h1 className="text-5xl font-thin">Scheduled Digest</h1>
					<p className="text-gray-400 text-lg">
						Cron + KV + Durable Streams working together
					</p>
				</div>

				{/* Latest Digest (Hero) */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="items-center flex justify-between">
						<h2 className="text-white text-xl font-normal">Latest Digest</h2>
						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-4 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={generating}
								onClick={handleRunNow}
								type="button"
								data-loading={generating}
							>
								{generating ? 'Generating' : 'Run Now'}
							</button>
						</div>
					</div>

					{runError && (
						<div className="text-sm bg-red-500/10 border border-red-500/30 rounded-md text-red-400 py-3 px-4">
							{runError}
						</div>
					)}

					{loadingLatest ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4"
							data-loading
						/>
					) : !latest ? (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
							No digest yet. Click "Run Now" to generate one.
						</div>
					) : (
						<div className="flex flex-col gap-4">
							<div className="bg-gray-950 border border-gray-800 rounded-md p-4 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<h3 className="text-cyan-500 font-medium">{latest.title}</h3>
									<span className="text-gray-500 text-xs">
										{relativeTime(latest.date)}
									</span>
								</div>
								<p className="text-gray-400 text-sm leading-relaxed">
									{latest.summary}
								</p>
								<div className="text-gray-500 text-xs">
									{latest.itemCount} items summarized
								</div>
							</div>

							<div className="flex gap-2">
								<a
									href={latest.streamUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 text-xs py-1.5 px-3 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/50 no-underline"
								>
									View Full Digest
								</a>
								<button
									type="button"
									className="bg-transparent border border-gray-900 rounded text-gray-500 cursor-pointer text-xs transition-all duration-200 py-1.5 px-3 hover:bg-gray-900 hover:border-gray-700 hover:text-white"
									onClick={() => handleCopy(latest.streamUrl)}
								>
									{copied ? 'Copied!' : 'Copy Share Link'}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* History */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<h2 className="text-white text-xl font-normal">Digest History</h2>

					<div className="bg-gray-950 rounded-md">
						{loadingHistory ? (
							<div className="text-gray-600 text-sm py-2 px-3" data-loading />
						) : digests.length > 0 ? (
							digests.map((digest, i) => (
								<div
									key={`${digest.date}-${i}`}
									className="group flex items-center justify-between py-2.5 px-3 rounded transition-colors duration-150 hover:bg-gray-900"
								>
									<div className="flex flex-col gap-0.5 min-w-0 flex-1">
										<span className="text-gray-300 text-sm truncate">
											{digest.title}
										</span>
										<span className="text-gray-600 text-xs">
											{digest.itemCount} items · {relativeTime(digest.date)}
										</span>
									</div>
									<a
										href={digest.streamUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-cyan-500/50 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 no-underline hover:text-cyan-400"
									>
										View
									</a>
								</div>
							))
						) : (
							<div className="text-gray-600 text-sm py-2 px-3">
								No digests yet. Generate your first one above.
							</div>
						)}
					</div>
				</div>

				{/* Info Cards */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						How It Works
					</h3>
					<div className="flex flex-col gap-6">
						{[
							{
								key: 'cron',
								title: 'Cron Schedule',
								text: 'Runs every hour in deployed environments. Locally, trigger with "Run Now" or curl -X POST http://localhost:3500/api/digest.',
							},
							{
								key: 'kv',
								title: 'KV Storage',
								text: 'Digests are stored in KV with 30-day TTL. Each digest gets a date-keyed entry plus a "latest" pointer for quick access.',
							},
							{
								key: 'stream',
								title: 'Durable Streams',
								text: 'Each digest is published to a permanent, public URL. Share the link and anyone can read the formatted HTML digest.',
							},
						].map((step) => (
							<div key={step.key} className="items-start flex gap-3">
								<div className="items-center bg-cyan-950 border border-cyan-500/30 rounded flex size-4 shrink-0 justify-center mt-0.5">
									<div className="bg-cyan-500 rounded-full size-1.5" />
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
