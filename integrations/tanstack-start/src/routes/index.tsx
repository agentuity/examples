import { type ChangeEvent, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AgentuityProvider, useAPI } from '@agentuity/react';
import '@agentuity/routes';

const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const DEFAULT_TEXT =
	'This TanStack Start UI sends translation requests to an Agentuity backend, where Agentuity handles model access through a gateway, keeps thread state and history in sync, and runs eval checks on results.';

export const Route = createFileRoute('/')({
	component: TranslateRoute,
});

export function TranslateRoute() {
	return (
		<AgentuityProvider baseUrl={import.meta.env.VITE_AGENTUITY_BASE_URL}>
			<TranslateDemo />
		</AgentuityProvider>
	);
}

function TranslateDemo() {
	const [text, setText] = useState(DEFAULT_TEXT);
	const [toLanguage, setToLanguage] = useState<(typeof LANGUAGES)[number]>('Spanish');
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');

	const [lastCleared, setLastCleared] = useState(false);

	const { data: historyData, refetch: refetchHistory } = useAPI('GET /api/translate/history');
	const { data: translateData, invoke: translate, isLoading, error } = useAPI('POST /api/translate');
	const { invoke: clearHistory, isLoading: isClearing } = useAPI('DELETE /api/translate/history');

	const history = useMemo(
		() => lastCleared
			? historyData?.history ?? []
			: translateData?.history ?? historyData?.history ?? [],
		[historyData?.history, translateData?.history, lastCleared]
	);
	const threadId = translateData?.threadId;

	const onTranslate = async () => {
		try {
			setLastCleared(false);
			await translate({ text, toLanguage, model });
		} catch {
			return;
		}
	};

	const onClearHistory = async () => {
		try {
			await clearHistory();
			setLastCleared(true);
			await refetchHistory();
		} catch {
			return;
		}
	};

	return (
		<main className="demo-page">
			<div className="demo-shell">
				<header className="demo-header">
					<h1 className="demo-title">TanStack Start + Agentuity Integration</h1>
					<p className="demo-subtitle">
						Run your frontend in TanStack Start and your AI backend in Agentuity.
					</p>
				</header>

				<section className="demo-card">
					<label className="demo-field">
						<span className="demo-label">Text to translate</span>
						<textarea
							className="demo-textarea"
							disabled={isLoading}
							onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
							rows={5}
							value={text}
						/>
					</label>

					<div className="demo-controls">
						<label className="demo-field">
							<span className="demo-label">Target language</span>
							<select
								className="demo-select"
								disabled={isLoading}
								onChange={(event: ChangeEvent<HTMLSelectElement>) =>
									setToLanguage(event.target.value as (typeof LANGUAGES)[number])
								}
								value={toLanguage}
							>
								{LANGUAGES.map((language) => (
									<option key={language} value={language}>
										{language}
									</option>
								))}
							</select>
						</label>

						<label className="demo-field">
							<span className="demo-label">Model</span>
							<select
								className="demo-select"
								disabled={isLoading}
								onChange={(event: ChangeEvent<HTMLSelectElement>) =>
									setModel(event.target.value as (typeof MODELS)[number])
								}
								value={model}
							>
								{MODELS.map((modelName) => (
									<option key={modelName} value={modelName}>
										{modelName}
									</option>
								))}
							</select>
						</label>

						<button
							className="demo-button demo-button-primary"
							disabled={isLoading || !text.trim()}
							onClick={onTranslate}
							type="button"
						>
							{isLoading ? 'Translating...' : 'Translate'}
						</button>
					</div>

					{error && <div className="demo-error">Error: {error.message}</div>}

					<div className={`demo-output${translateData?.translation ? ' demo-output-ready' : ''}`}>
						{translateData?.translation ?? 'Translation appears here'}
					</div>

					<div className="demo-meta">
						<span>Thread: {threadId ? `${threadId.slice(0, 12)}...` : 'N/A'}</span>
						{translateData?.sessionId ? <span>Session: {translateData.sessionId.slice(0, 12)}...</span> : null}
						{typeof translateData?.tokens === 'number' ? <span>Tokens: {translateData.tokens}</span> : null}
					</div>
				</section>

				<section className="demo-card">
					<div className="demo-history-header">
						<h2 className="demo-history-title">
							Recent Translations
							{historyData?.threadId ? (
								<span className="demo-history-thread"> (Thread: {historyData.threadId.slice(0, 12)}...)</span>
							) : null}
						</h2>
						<button
							className="demo-button demo-button-secondary"
							disabled={isLoading || isClearing || !history.length}
							onClick={onClearHistory}
							type="button"
						>
							{isClearing ? 'Clearing...' : 'Clear'}
						</button>
					</div>

					{history.length ? (
						<ul className="demo-history-list">
							{[...history].reverse().map((entry, index) => (
								<li className="demo-history-item" key={`${entry.timestamp}-${index}`}>
									<div className="demo-history-meta">
										{entry.model} • {entry.toLanguage} • {entry.sessionId.slice(0, 12)}...
									</div>
									<div className="demo-history-source">{entry.text}</div>
									<div className="demo-history-translation">{entry.translation}</div>
								</li>
							))}
						</ul>
					) : (
						<p className="demo-history-empty">History appears after the first translation request.</p>
					)}
				</section>
			</div>
		</main>
	);
}
