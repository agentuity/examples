import { useAPI } from '@agentuity/react';
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const ROLES = ['viewer', 'editor', 'admin'] as const;

const SUGGESTIONS = [
	{ label: 'Public search (any role)', message: 'Search for AI news', role: 'viewer', auth: false },
	{ label: 'Weather (any role)', message: "What's the weather in Tokyo?", role: 'viewer', auth: false },
	{ label: 'Read DB (authenticated)', message: 'Read the users table', role: 'editor', auth: true },
	{ label: 'Write DB (editor+)', message: 'Write a new record to users table', role: 'editor', auth: true },
	{ label: 'Delete (admin only)', message: 'Delete record 5 from users table', role: 'admin', auth: true },
	{ label: 'Calculate tip (runtime)', message: 'Calculate a 20% tip on $85', role: 'viewer', auth: false },
];

export function App() {
	const [message, setMessage] = useState('');
	const [role, setRole] = useState<(typeof ROLES)[number]>('viewer');
	const [authenticated, setAuthenticated] = useState(false);

	const { data: chatResult, invoke: chat, isLoading } = useAPI('POST /api/chat');
	const result = chatResult as {
		response: string;
		filtersApplied: string[];
		availableToolCount: number;
		threadId: string;
		sessionId: string;
	} | null;

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;
			await chat({ message: message.trim(), userRole: role, authenticated });
		},
		[message, isLoading, chat, role, authenticated],
	);

	const handleSuggestion = useCallback(
		async (s: (typeof SUGGESTIONS)[number]) => {
			setMessage(s.message);
			setRole(s.role as (typeof ROLES)[number]);
			setAuthenticated(s.auth);
			await chat({ message: s.message, userRole: s.role as 'viewer' | 'editor' | 'admin', authenticated: s.auth });
		},
		[chat],
	);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-8 text-center">
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

					<h1 className="text-5xl font-thin">Dynamic Tools</h1>

					<p className="text-gray-400 text-lg">
						LangChain{' '}
						<span className="italic font-serif">Dynamic Tool Selection</span> on
						Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Three middleware layers filter tools by authentication state, user role,
						and dynamically register tools at runtime.
					</p>
				</div>

				{/* Controls */}
				<div className="bg-black border border-gray-900 rounded-lg p-6 flex items-center gap-6">
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-500">Role</span>
						<select
							className="appearance-none bg-transparent border-0 border-b border-dashed border-gray-700 text-white cursor-pointer text-sm outline-none hover:border-b-cyan-400 focus:border-b-cyan-400"
							value={role}
							onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
						>
							{ROLES.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
					</div>

					<label className="flex items-center gap-2 cursor-pointer text-sm">
						<input
							type="checkbox"
							checked={authenticated}
							onChange={(e) => setAuthenticated(e.target.checked)}
							className="accent-cyan-500"
						/>
						<span className={authenticated ? 'text-cyan-400' : 'text-gray-500'}>
							Authenticated
						</span>
					</label>
				</div>

				{/* Chat Form */}
				<form
					onSubmit={handleSubmit}
					className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4"
				>
					<textarea
						className="text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-none py-3 px-4 min-h-20 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2"
						disabled={isLoading}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
							setMessage(e.currentTarget.value)
						}
						placeholder="Ask a question..."
						rows={2}
						value={message}
					/>

					<div className="flex items-center gap-2">
						<div className="relative group">
							<div className="absolute inset-0 bg-linear-to-r from-cyan-700 via-blue-500 to-purple-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-cyan-500/50 rounded-lg blur-3xl opacity-50" />
							<button
								className="relative font-semibold text-white px-6 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading || !message.trim()}
								type="submit"
								data-loading={isLoading}
							>
								{isLoading ? 'Thinking' : 'Send'}
							</button>
						</div>
					</div>

					{/* Suggestions */}
					{!result && !isLoading && (
						<div className="flex flex-wrap gap-2 mt-2">
							{SUGGESTIONS.map((s) => (
								<button
									key={s.label}
									type="button"
									className="text-xs bg-gray-900 border border-gray-800 rounded-full text-gray-400 py-1.5 px-3 cursor-pointer hover:border-gray-700 hover:text-white transition-colors"
									onClick={() => handleSuggestion(s)}
								>
									{s.label}
								</button>
							))}
						</div>
					)}
				</form>

				{/* Response */}
				{isLoading ? (
					<div
						className="bg-black border border-gray-900 rounded-lg p-8 text-gray-600 text-sm"
						data-loading
					/>
				) : result ? (
					<>
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
							<h3 className="text-white text-xl font-normal">Response</h3>
							<p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
								{result.response}
							</p>
							<div className="text-gray-500 flex flex-wrap text-xs gap-4">
								{result.threadId && (
									<span>
										Thread{' '}
										<strong className="text-gray-400">
											{result.threadId.slice(0, 12)}...
										</strong>
									</span>
								)}
							</div>
						</div>

						{/* Filters Applied */}
						{result.filtersApplied?.length > 0 && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-3">
								<h3 className="text-white text-xl font-normal">
									Middleware Filters Applied
								</h3>
								<div className="flex flex-col gap-2">
									{result.filtersApplied.map((filter, i) => (
										<div
											key={`filter-${i}`}
											className="text-sm bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 rounded-md py-2 px-3"
										>
											{filter}
										</div>
									))}
								</div>
							</div>
						)}
					</>
				) : null}

				{/* LangChain Patterns */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						LangChain Patterns
					</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'Filter by State',
								text: 'wrapModelCall checks authentication and message count to filter tools',
							},
							{
								title: 'Filter by Context',
								text: 'wrapModelCall reads userRole from runtime context (admin/editor/viewer)',
							},
							{
								title: 'Runtime Registration',
								text: 'wrapModelCall adds calculate_tip; wrapToolCall handles its execution',
							},
							{
								title: 'Composed Middleware',
								text: 'Three middleware layers chain together in the agent pipeline',
							},
						].map((item) => (
							<div key={item.title} className="flex items-start gap-3">
								<div className="items-center bg-cyan-950 border border-cyan-800 rounded flex size-4 shrink-0 justify-center mt-0.5">
									<svg
										aria-hidden="true"
										className="size-2.5"
										fill="none"
										height="24"
										stroke="var(--color-cyan-500)"
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
										{item.title}
									</h4>
									<p className="text-gray-400 text-xs">{item.text}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
