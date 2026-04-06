import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	'Find Alice',
	'Look up Bob',
	'List all contacts',
	"Who is Carol and what's her email?",
];

type Contact = {
	name: string;
	email: string;
	company: string;
	title: string;
	phone: string;
	summary: string;
};

type ContextUsed = {
	name: string;
	uid: number;
	role: string;
};

type ChatResult = {
	contact?: Contact;
	rawResponse: string;
	contextUsed: ContextUsed;
	threadId: string;
	sessionId: string;
};

export function App() {
	const [message, setMessage] = useState('');
	const [showRaw, setShowRaw] = useState(false);
	const [result, setResult] = useState<ChatResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const chat = useCallback(async (msg: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: msg }),
			});
			if (!res.ok) {
				throw new Error(`Request failed: ${res.status}`);
			}
			const data = await res.json();
			setResult(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;
			await chat(message.trim());
		},
		[message, isLoading, chat],
	);

	const handleSuggestion = useCallback(
		async (suggestion: string) => {
			setMessage(suggestion);
			await chat(suggestion);
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

					<h1 className="text-5xl font-thin">Structured Context</h1>

					<p className="text-gray-400 text-lg">
						OpenAI Agents SDK{' '}
						<span className="italic font-serif">RunContext + outputType</span> on Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Typed RunContext&lt;UserInfo&gt; passes data to tools without sending it to the
						LLM. outputType with a Zod schema forces structured JSON output. Try looking up
						contacts.
					</p>
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
						placeholder="Look up a contact (try Alice, Bob, Carol, or Dave)..."
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
								{isLoading ? 'Looking up' : 'Send'}
							</button>
						</div>
					</div>

					{/* Suggestions */}
					{!result && !isLoading && (
						<div className="flex flex-wrap gap-2 mt-2">
							{SUGGESTIONS.map((s) => (
								<button
									key={s}
									type="button"
									className="text-xs bg-gray-900 border border-gray-800 rounded-full text-gray-400 py-1.5 px-3 cursor-pointer hover:border-gray-700 hover:text-white transition-colors"
									onClick={() => handleSuggestion(s)}
								>
									{s}
								</button>
							))}
						</div>
					)}
				</form>

				{/* Error */}
				{error && (
					<div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
						{error}
					</div>
				)}

				{/* Response */}
				{isLoading ? (
					<div
						className="bg-black border border-gray-900 rounded-lg p-8 text-gray-600 text-sm"
						data-loading
					/>
				) : result ? (
					<>
						{/* Structured Contact Card */}
						{result.contact && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
								<h3 className="text-white text-xl font-normal">Contact</h3>
								<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
									{[
										{ label: 'Name', value: result.contact.name },
										{ label: 'Email', value: result.contact.email },
										{ label: 'Company', value: result.contact.company },
										{ label: 'Title', value: result.contact.title },
										{ label: 'Phone', value: result.contact.phone },
									].map((row) => (
										<>
											<span key={`l-${row.label}`} className="text-gray-500">
												{row.label}
											</span>
											<span key={`v-${row.label}`} className="text-cyan-400">
												{row.value}
											</span>
										</>
									))}
								</div>
								{result.contact.summary && (
									<p className="text-gray-400 text-sm mt-2">
										{result.contact.summary}
									</p>
								)}
								<div className="text-gray-500 flex text-xs gap-4 mt-2">
									{result.threadId && (
										<span>
											Thread{' '}
											<strong className="text-gray-400">
												{result.threadId.slice(0, 12)}...
											</strong>
										</span>
									)}
									{result.sessionId && (
										<span>
											Session{' '}
											<strong className="text-gray-400">
												{result.sessionId.slice(0, 12)}...
											</strong>
										</span>
									)}
								</div>
							</div>
						)}

						{/* Context Used (RunContext) */}
						{result.contextUsed && (
							<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
								<h3 className="text-white text-xl font-normal">
									RunContext&lt;UserInfo&gt;
									<span className="text-gray-500 text-sm font-normal ml-2">
										(not sent to LLM)
									</span>
								</h3>
								<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
									<span className="text-gray-500">name</span>
									<span className="text-purple-400">{result.contextUsed.name}</span>
									<span className="text-gray-500">uid</span>
									<span className="text-purple-400">{result.contextUsed.uid}</span>
									<span className="text-gray-500">role</span>
									<span className="text-purple-400">{result.contextUsed.role}</span>
								</div>
								<p className="text-gray-600 text-xs">
									This context was available to tools via RunContext but was never
									included in the LLM prompt.
								</p>
							</div>
						)}

						{/* Raw JSON Output */}
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
							<button
								type="button"
								className="text-white text-xl font-normal text-left flex items-center gap-2 cursor-pointer"
								onClick={() => setShowRaw(!showRaw)}
							>
								Raw Output
								<span className="text-gray-500 text-sm font-normal">
									(outputType JSON) {showRaw ? '\u25BE' : '\u25B8'}
								</span>
							</button>

							{showRaw && (
								<pre className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-300 py-3 px-4 overflow-x-auto whitespace-pre-wrap">
									{result.rawResponse}
								</pre>
							)}
						</div>
					</>
				) : null}

				{/* OpenAI Agents SDK Patterns */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">
						OpenAI Agents SDK Patterns
					</h3>

					<div className="flex flex-col gap-4">
						{[
							{
								title: 'RunContext<T>',
								text: 'Typed context (UserInfo) passed to run() and accessible in tools -- never sent to the LLM',
							},
							{
								title: 'outputType',
								text: 'Zod schema on Agent forces the LLM to return structured JSON matching the exact shape',
							},
							{
								title: 'Typed finalOutput',
								text: 'result.finalOutput is typed as z.infer<typeof ContactOutput> -- full TypeScript inference',
							},
							{
								title: 'Context in Tools',
								text: 'Tools receive RunContext as second argument, enabling personalized behavior per-user',
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
