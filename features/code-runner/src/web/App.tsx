import { useCallback, useState } from 'react';
import { useAPI } from '@agentuity/react';
import { PROMPTS } from '../lib/prompts';
import './App.css';

export function App() {
	const [selectedPrompt, setSelectedPrompt] = useState(0);
	const { data, invoke, isLoading, error } = useAPI('POST /api/run');

	const handleRun = useCallback(async () => {
		await invoke({ prompt: PROMPTS[selectedPrompt]!.prompt });
	}, [invoke, selectedPrompt]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-8 max-w-5xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-4 relative text-center">
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

					<h1 className="text-5xl font-thin">Sandbox Code Runner</h1>

					<p className="text-gray-400 text-lg">
						Generate code in TypeScript and Python, execute in{' '}
						<span className="italic font-serif">parallel sandboxes</span>, compare results
					</p>
				</div>

				{/* Prompt Selector Card */}
				<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<div className="flex gap-3">
							{PROMPTS.map((p, i) => (
								<button
									key={p.label}
									type="button"
									className={`flex-1 border rounded-md py-2.5 px-4 text-sm text-left cursor-pointer transition-colors duration-150 ${
										selectedPrompt === i
											? 'border-cyan-500 bg-cyan-500/10 text-white'
											: 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
									}`}
									disabled={isLoading}
									onClick={() => setSelectedPrompt(i)}
								>
									{p.label}
								</button>
							))}
						</div>

						<p className="text-sm text-gray-400">{PROMPTS[selectedPrompt]!.prompt}</p>
					</div>

					<div className="flex items-center gap-4">
						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-6 py-2.5 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading}
								onClick={handleRun}
								type="button"
								data-loading={isLoading}
							>
								{isLoading ? 'Running' : 'Run Code'}
							</button>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className="text-gray-500 text-sm" data-loading="true">
						Generating code and running sandboxes
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="text-red-400 text-sm">{String(error)}</div>
				)}

				{/* Results Grid */}
				{data && (
					<div className="grid grid-cols-2 gap-6">
						{(
							[
								{ key: 'typescript', label: 'TypeScript', result: data.typescript },
								{ key: 'python', label: 'Python', result: data.python },
							] as const
						).map(({ key, label, result }) => (
							<div key={key} className="bg-black border border-gray-900 rounded-lg p-6 flex flex-col gap-4">
								{/* Card Header */}
								<div className="flex items-center justify-between">
									<span className="text-white font-medium">{label}</span>
									<div className="flex items-center gap-3">
										<span className="text-xs text-gray-500">{result.durationMs}ms</span>
										<span
											className={`text-xs rounded px-2 py-0.5 font-medium ${
												result.exitCode === 0
													? 'bg-green-500/20 text-green-400'
													: 'bg-red-500/20 text-red-400'
											}`}
										>
											exit {result.exitCode}
										</span>
									</div>
								</div>

								{/* Generated Code */}
								<div>
									<p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Code</p>
									<pre className="bg-gray-950 border border-gray-800 rounded-md p-4 text-sm font-mono overflow-x-auto">
										<code className="text-gray-300">{result.code}</code>
									</pre>
								</div>

								{/* stdout */}
								{result.stdout && (
									<div>
										<p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Output</p>
										<pre className="bg-gray-950 border border-gray-800 rounded-md p-4 text-sm font-mono overflow-x-auto">
											<code className="text-cyan-500">{result.stdout}</code>
										</pre>
									</div>
								)}

								{/* stderr */}
								{result.stderr && (
									<div>
										<p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Stderr</p>
										<pre className="bg-gray-950 border border-gray-800 rounded-md p-4 text-sm font-mono overflow-x-auto">
											<code className="text-red-400">{result.stderr}</code>
										</pre>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Footer */}
				<div className="text-center text-xs text-gray-600">
					<span>Test the agent directly in the </span>
					<a href="/workbench" className="text-gray-500 hover:text-gray-400 transition-colors underline">
						Workbench
					</a>
				</div>
			</div>
		</div>
	);
}
