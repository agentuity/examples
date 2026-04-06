import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import {
	type HistoryEntry,
	LANGUAGES,
	MODELS,
	type Language,
	type Model,
} from '@tanstack-turborepo/shared';

const DEFAULT_TEXT =
	'This Turborepo UI sends translation requests to an Agentuity backend, where Agentuity handles model access through a gateway, keeps thread state and history in sync, and runs eval checks on results.';

const BASE_URL = import.meta.env.VITE_AGENTUITY_BASE_URL ?? '';

interface TranslateResponse {
	history: HistoryEntry[];
	sessionId: string;
	threadId: string;
	tokens: number;
	translation: string;
	translationCount: number;
}

interface HistoryResponse {
	history: HistoryEntry[];
	threadId: string;
	translationCount: number;
}

export function TranslateDemo() {
	const [text, setText] = useState(DEFAULT_TEXT);
	const [toLanguage, setToLanguage] = useState<Language>('Spanish');
	const [model, setModel] = useState<Model>('gpt-5-nano');
	const [isLoading, setIsLoading] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [translateData, setTranslateData] = useState<TranslateResponse | null>(null);
	const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
	const [lastCleared, setLastCleared] = useState(false);

	const history = useMemo(
		() => lastCleared
			? historyData?.history ?? []
			: translateData?.history ?? historyData?.history ?? [],
		[historyData?.history, translateData?.history, lastCleared],
	);
	const threadId = translateData?.threadId;

	const fetchHistory = useCallback(async () => {
		try {
			const res = await fetch(`${BASE_URL}/api/translate/history`);
			if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
			const data: HistoryResponse = await res.json();
			setHistoryData(data);
		} catch {
			// Silently ignore history fetch failures
		}
	}, []);

	const onTranslate = async () => {
		setIsLoading(true);
		setError(null);
		setLastCleared(false);
		try {
			const res = await fetch(`${BASE_URL}/api/translate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, toLanguage, model }),
			});
			if (!res.ok) throw new Error(`Translation failed: ${res.statusText}`);
			const data: TranslateResponse = await res.json();
			setTranslateData(data);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setIsLoading(false);
		}
	};

	const onClearHistory = async () => {
		setIsClearing(true);
		try {
			const res = await fetch(`${BASE_URL}/api/translate/history`, { method: 'DELETE' });
			if (!res.ok) throw new Error(`Failed to clear history: ${res.statusText}`);
			setLastCleared(true);
			await fetchHistory();
		} catch {
			// Silently ignore clear failures
		} finally {
			setIsClearing(false);
		}
	};

	return (
		<main className="demo-page">
			<div className="demo-shell">
				<header className="demo-header">
					<h1 className="demo-title">Turborepo + Agentuity Integration</h1>
					<p className="demo-subtitle">Run your frontend and AI backend in a monorepo with Turborepo.</p>
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
									setToLanguage(event.target.value as Language)
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
									setModel(event.target.value as Model)
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
										{entry.model} &bull; {entry.toLanguage} &bull; {entry.sessionId.slice(0, 12)}...
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
