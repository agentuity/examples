import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import './App.css';

const SUGGESTIONS = [
	{ label: 'Look up Jane Doe', message: 'Look up Jane Doe' },
	{ label: 'Find John Smith', message: 'Find contact info for John Smith' },
	{ label: 'Alice Chen details', message: 'Get me Alice Chen\'s contact information' },
	{ label: 'Bob Wilson info', message: 'Who is Bob Wilson? Get his details.' },
];

type ContactInfo = {
	name: string;
	email: string;
	phone: string;
	company: string;
	role: string;
	summary: string;
};

type ChatResult = {
	structuredResponse: ContactInfo;
	rawResponse: string;
	threadId: string;
	sessionId: string;
};

export function App() {
	const [message, setMessage] = useState('');
	const [result, setResult] = useState<ChatResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const chat = useCallback(async (body: { message: string }) => {
		setIsLoading(true);
		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await res.json();
			setResult(data);
			return data;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!message.trim() || isLoading) return;
			await chat({ message: message.trim() });
		},
		[message, isLoading, chat],
	);

	const handleSuggestion = useCallback(
		async (s: (typeof SUGGESTIONS)[number]) => {
			setMessage(s.message);
			await chat({ message: s.message });
		},
		[chat],
	);

	const contact = result?.structuredResponse;

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

					<h1 className="text-5xl font-thin">Structured Output</h1>

					<p className="text-gray-400 text-lg">
						LangChain{' '}
						<span className="italic font-serif">responseFormat</span> on
						Agentuity
					</p>

					<p className="text-gray-500 text-sm max-w-lg">
						Zod schema forces the agent to return typed, structured data instead
						of free-form text. Ask about a person to extract their contact card.
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
						placeholder="Ask about a person — e.g. 'Look up Jane Doe'"
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
								{isLoading ? 'Extracting' : 'Extract'}
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
				) : contact ? (
					<>
						{/* Structured Contact Card */}
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-4">
							<h3 className="text-white text-xl font-normal">Contact Card</h3>
							<div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
								{[
									{ label: 'Name', value: contact.name },
									{ label: 'Email', value: contact.email },
									{ label: 'Phone', value: contact.phone },
									{ label: 'Company', value: contact.company },
									{ label: 'Role', value: contact.role },
									{ label: 'Summary', value: contact.summary },
								].map((field) => (
									<div key={field.label} className="contents">
										<span className="text-gray-500">{field.label}</span>
										<span
											className={field.value === 'not found' ? 'text-gray-600 italic' : 'text-cyan-400'}
										>
											{field.value}
										</span>
									</div>
								))}
							</div>
							<div className="text-gray-500 flex flex-wrap text-xs gap-4 mt-2">
								{result?.threadId && (
									<span>
										Thread{' '}
										<strong className="text-gray-400">
											{result.threadId.slice(0, 12)}...
										</strong>
									</span>
								)}
							</div>
						</div>

						{/* Raw JSON */}
						<div className="bg-black border border-gray-900 rounded-lg p-8 flex flex-col gap-3">
							<h3 className="text-white text-xl font-normal">
								Structured JSON Response
							</h3>
							<pre className="text-xs bg-gray-950 border border-gray-800 rounded-md text-cyan-400 py-3 px-4 whitespace-pre-wrap overflow-x-auto">
								{JSON.stringify(contact, null, 2)}
							</pre>
						</div>
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
								title: 'Zod responseFormat',
								text: 'ContactInfoSchema defines the exact shape the LLM must return',
							},
							{
								title: 'responseFormat on createAgent()',
								text: 'Schema passed to createAgent() constrains agent output to match the Zod type',
							},
							{
								title: 'structuredResponse',
								text: 'result.structuredResponse gives you typed data instead of free-form text',
							},
							{
								title: 'Tools + Structured Output',
								text: 'Agent uses tools to gather data, then formats it into the required schema',
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
