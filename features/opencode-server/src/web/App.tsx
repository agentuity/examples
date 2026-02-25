import { useAPI } from '@agentuity/react';
import { useCallback, useEffect, useState } from 'react';
import './App.css';

type ServerInfo = {
	sandboxId: string;
	serverUrl: string;
	password: string;
};

type State = 'idle' | 'starting' | 'running' | 'stopping';

export function App() {
	const [state, setState] = useState<State>('idle');
	const [server, setServer] = useState<ServerInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	const startApi = useAPI('POST /api/server/start');
	const statusApi = useAPI('GET /api/server/status');
	const stopApi = useAPI('POST /api/server/stop');

	// Copy to clipboard with brief "Copied" feedback
	const copyToClipboard = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopied(label);
		setTimeout(() => setCopied(null), 1500);
	}, []);

	// Rehydrate from KV when status data arrives (GET auto-fetches on mount)
	useEffect(() => {
		const data = statusApi.data;
		if (data?.exists && data.sandbox && data.ready && state === 'idle') {
			setServer({
				sandboxId: data.sandbox.sandboxId,
				serverUrl: data.sandbox.serverUrl,
				password: data.sandbox.password,
			});
			setState('running');
		}
	}, [statusApi.data, state]);

	const handleStart = useCallback(async () => {
		setState('starting');
		setError(null);

		try {
			const data = await startApi.invoke();
			if (data) {
				setServer({
					sandboxId: data.sandboxId,
					serverUrl: data.serverUrl,
					password: data.password,
				});
				setState('running');

				if (!data.ready) {
					setError('Server started but did not become ready within 30s. It may still be starting up.');
				}
			}
		} catch (err) {
			setError(String(err));
			setState('idle');
		}
	}, [startApi]);

	const handleStop = useCallback(async () => {
		setState('stopping');
		setError(null);

		try {
			await stopApi.invoke();
			setServer(null);
			setState('idle');
		} catch (err) {
			setError(String(err));
			setState('running');
		}
	}, [stopApi]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-8 max-w-3xl p-8 md:p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-4 text-center">
					<Logo className="h-auto mb-4 w-12" />
					<h1 className="text-5xl font-thin">OpenCode Server</h1>
					<p className="text-gray-400 text-lg">
						Run <span className="italic font-serif">OpenCode</span> as a server in a sandbox, attach
						from your terminal
					</p>
				</div>

				{/* Error State */}
				{error && (
					<div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-red-400 text-sm">
						{error}
					</div>
				)}

				{/* Idle State */}
				{state === 'idle' && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-6">
						<p className="text-gray-400 text-sm text-center max-w-md">
							Start an OpenCode server in a sandbox with network access. Once running, attach from
							your terminal.
						</p>

						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-6 py-2.5 bg-gray-950 rounded-lg shadow-2xl cursor-pointer"
								onClick={handleStart}
								type="button"
							>
								Start Server
							</button>
						</div>
					</div>
				)}

				{/* Starting State */}
				{state === 'starting' && (
					<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col items-center gap-4">
						<div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
						<div className="text-center">
							<p className="text-white text-sm" data-loading="true">
								Starting OpenCode server
							</p>
							<p className="text-gray-500 text-xs mt-1">
								Creating sandbox, exposing network port, waiting for readiness
							</p>
						</div>
					</div>
				)}

				{/* Running State */}
				{(state === 'running' || state === 'stopping') && server && (
					<div className="flex flex-col gap-4">
						{/* Server URL */}
						<div className="bg-black border border-gray-900 rounded-lg p-5 flex flex-col gap-3">
							<span className="text-gray-500 text-xs uppercase tracking-wider">
								Server URL
							</span>
							<div className="flex items-center gap-3">
								<code className="flex-1 text-cyan-500 text-sm font-mono break-all">
									{server.serverUrl}
								</code>
								<CopyButton
									text={server.serverUrl}
									label="url"
									copied={copied}
									onClick={copyToClipboard}
								/>
							</div>
						</div>

						{/* Attach Command */}
						<div className="bg-black border border-gray-900 rounded-lg p-5 flex flex-col gap-3">
							<span className="text-gray-500 text-xs uppercase tracking-wider">
								Attach Command
							</span>
							<div className="flex items-center gap-3">
								<code className="flex-1 text-white text-sm font-mono break-all">
									opencode attach {server.serverUrl}
								</code>
								<CopyButton
									text={`opencode attach ${server.serverUrl}`}
									label="attach"
									copied={copied}
									onClick={copyToClipboard}
								/>
							</div>
							<p className="text-gray-500 text-xs">
								Set{' '}
								<code className="text-gray-400">
									OPENCODE_SERVER_PASSWORD={server.password}
								</code>{' '}
								in your shell before running
							</p>
						</div>

						{/* Password */}
						<div className="bg-black border border-gray-900 rounded-lg p-5 flex flex-col gap-3">
							<span className="text-gray-500 text-xs uppercase tracking-wider">
								Password
							</span>
							<div className="flex items-center gap-3">
								<code className="flex-1 text-white text-sm font-mono break-all">
									{server.password}
								</code>
								<CopyButton
									text={server.password}
									label="password"
									copied={copied}
									onClick={copyToClipboard}
								/>
							</div>
						</div>

						{/* Sandbox ID */}
						<div className="text-center">
							<span className="text-gray-600 text-xs font-mono">
								Sandbox: {server.sandboxId}
							</span>
						</div>

						{/* Stop Button */}
						<div className="flex justify-center mt-2">
							<button
								className="bg-transparent border border-red-900 rounded-lg text-red-400 cursor-pointer text-sm transition-all duration-200 py-2.5 px-6 hover:bg-red-950/30 hover:border-red-700 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleStop}
								disabled={state === 'stopping'}
								type="button"
								data-loading={state === 'stopping'}
							>
								{state === 'stopping' ? 'Stopping' : 'Stop & Destroy'}
							</button>
						</div>
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

// Copy button component
function CopyButton({
	text,
	label,
	copied,
	onClick,
}: {
	text: string;
	label: string;
	copied: string | null;
	onClick: (text: string, label: string) => void;
}) {
	return (
		<button
			className="shrink-0 bg-gray-900 border border-gray-800 rounded px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:border-gray-700 transition-colors cursor-pointer"
			onClick={() => onClick(text, label)}
			type="button"
		>
			{copied === label ? 'Copied' : 'Copy'}
		</button>
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
