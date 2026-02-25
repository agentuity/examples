'use client';

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AgentuityProvider, useAPI } from '@agentuity/react';
import '@agentuity/routes';

const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

const DEFAULT_TEXT =
	'This Next.js UI sends translation requests to an Agentuity backend, where Agentuity handles model access through a gateway, keeps thread state and history in sync, and runs eval checks on results.';

const HISTORY_ROUTE = 'GET /api/translate/history';
const HISTORY_MAX_ATTEMPTS = 6;
const HISTORY_RETRY_DELAYS_MS = [300, 900, 1800, 2800] as const;
const HISTORY_ROUTE_PATH = HISTORY_ROUTE.split(' ')[1];

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

type HistoryLoadStatus = 'loading' | 'retrying' | 'ready' | 'error';

const HISTORY_REQUEST_TIMEOUT_MS = 5000;

type HistoryEntry = {
	model: string;
	toLanguage: string;
	sessionId: string;
	text: string;
	translation: string;
	timestamp: string;
	tokens?: number;
};

type HistoryResponse = {
	threadId?: string;
	history: HistoryEntry[];
};

const getHistoryUrl = () => {
	if (!process.env.NEXT_PUBLIC_AGENTUITY_BASE_URL) {
		return HISTORY_ROUTE_PATH;
	}

	return new URL(HISTORY_ROUTE_PATH, process.env.NEXT_PUBLIC_AGENTUITY_BASE_URL).toString();
};

const formatHistoryLoadError = (requestError: Error | null) => {
	if (!requestError) {
		return 'Could not load history right now. Please try again.';
	}

	const normalizedMessage = requestError.message.toLowerCase();
	const isStartupLikeFailure =
		normalizedMessage.includes('timed out') ||
		normalizedMessage.includes('timeout') ||
		normalizedMessage.includes('http 500') ||
		normalizedMessage.includes('http 502') ||
		normalizedMessage.includes('http 503') ||
		normalizedMessage.includes('http 504') ||
		normalizedMessage.includes('failed to fetch') ||
		normalizedMessage.includes('network');

	if (isStartupLikeFailure) {
		return 'History is taking longer than expected because the backend may still be starting up. Please retry in a moment.';
	}

	return `Could not load history after multiple attempts: ${requestError.message}`;
};

function TranslateDemoInner() {
	const [text, setText] = useState(DEFAULT_TEXT);
	const [toLanguage, setToLanguage] = useState<(typeof LANGUAGES)[number]>('Spanish');
	const [model, setModel] = useState<(typeof MODELS)[number]>('gpt-5-nano');
	const [historyLoadStatus, setHistoryLoadStatus] = useState<HistoryLoadStatus>('loading');
	const [historyRetryCount, setHistoryRetryCount] = useState(0);
	const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
	const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
	const historyLoadInFlight = useRef(false);
	const historyLoadRunId = useRef(0);
	const isMountedRef = useRef(true);

	const { data: translateData, invoke: translate, isLoading, error } = useAPI('POST /api/translate');
	const { invoke: clearHistory, isLoading: isClearing } = useAPI('DELETE /api/translate/history');

	const history = historyData?.history ?? [];
	const threadId = translateData?.threadId;

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			historyLoadRunId.current += 1;
		};
	}, []);

	useEffect(() => {
		if (!translateData || !Array.isArray(translateData.history)) {
			return;
		}

		setHistoryData((currentHistoryData) => {
			const nextThreadId = translateData.threadId ?? currentHistoryData?.threadId;

			if (
				currentHistoryData?.history === translateData.history &&
				currentHistoryData.threadId === nextThreadId
			) {
				return currentHistoryData;
			}

			return {
				threadId: nextThreadId,
				history: translateData.history,
			};
		});
	}, [translateData]);

	const onTranslate = async () => {
		try {
			await translate({ text, toLanguage, model });
		} catch {
			return;
		}
	};

	const requestHistory = useCallback(async (): Promise<HistoryResponse> => {
		const requestController = new AbortController();
		const timeoutId = setTimeout(() => {
			requestController.abort();
		}, HISTORY_REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(getHistoryUrl(), {
				method: 'GET',
				signal: requestController.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const payload = (await response.json()) as Partial<HistoryResponse>;
			return {
				threadId: payload.threadId,
				history: Array.isArray(payload.history) ? payload.history : [],
			};
		} catch (requestError) {
			if (requestError instanceof DOMException && requestError.name === 'AbortError') {
				throw new Error('History request timed out');
			}

			throw requestError instanceof Error ? requestError : new Error(String(requestError));
		} finally {
			clearTimeout(timeoutId);
		}
	}, []);

	const loadHistoryWithRetry = useCallback(async () => {
		if (historyLoadInFlight.current) {
			return;
		}

		const runId = historyLoadRunId.current + 1;
		historyLoadRunId.current = runId;
		const isActiveRun = () => isMountedRef.current && historyLoadRunId.current === runId;

		historyLoadInFlight.current = true;
		if (isActiveRun()) {
			setHistoryLoadStatus('loading');
			setHistoryRetryCount(0);
			setHistoryLoadError(null);
		}

		try {
			let finalRequestError: Error | null = null;

			for (let attempt = 1; attempt <= HISTORY_MAX_ATTEMPTS; attempt += 1) {
				try {
					const nextHistoryData = await requestHistory();

					if (!isActiveRun()) {
						return;
					}

					setHistoryData(nextHistoryData);
					setHistoryLoadStatus('ready');
					return;
				} catch (requestError) {
					finalRequestError =
						requestError instanceof Error ? requestError : new Error(String(requestError));

					if (!isActiveRun()) {
						return;
					}

					if (attempt >= HISTORY_MAX_ATTEMPTS) {
						setHistoryLoadStatus('error');
						setHistoryLoadError(formatHistoryLoadError(finalRequestError));
						return;
					}

					setHistoryLoadStatus('retrying');
					setHistoryRetryCount(attempt);

					const delay =
						HISTORY_RETRY_DELAYS_MS[Math.min(attempt - 1, HISTORY_RETRY_DELAYS_MS.length - 1)];
					await wait(delay);

					if (!isActiveRun()) {
						return;
					}
				}
			}
		} finally {
			historyLoadInFlight.current = false;
		}
	}, [requestHistory]);

	useEffect(() => {
		void loadHistoryWithRetry();
	}, [loadHistoryWithRetry]);

	const onClearHistory = async () => {
		try {
			await clearHistory();
			await loadHistoryWithRetry();
		} catch {
			return;
		}
	};

	return (
		<main className="demo-page">
			<div className="demo-shell">
				<header className="demo-header">
					<h1 className="demo-title">Agentuity + Next.js Integration</h1>
					<p className="demo-subtitle">Run your frontend in Next.js and your AI backend in Agentuity.</p>
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
							disabled={
								isLoading ||
								isClearing ||
								!history.length ||
								historyLoadStatus === 'loading' ||
								historyLoadStatus === 'retrying'
							}
							onClick={onClearHistory}
							type="button"
						>
							{isClearing ? 'Clearing...' : 'Clear'}
						</button>
					</div>

					{historyLoadStatus === 'loading' ? (
						<p className="demo-history-empty">Loading recent history...</p>
					) : historyLoadStatus === 'retrying' ? (
						<p className="demo-history-empty">
							Backend is starting up. Retrying history load ({historyRetryCount}/{HISTORY_MAX_ATTEMPTS - 1})...
						</p>
					) : historyLoadStatus === 'error' ? (
						<div>
							<div className="demo-error">{historyLoadError}</div>
							<button className="demo-button demo-button-secondary" onClick={loadHistoryWithRetry} type="button">
								Retry history
							</button>
						</div>
					) : history.length ? (
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

export default function TranslateDemo() {
	return (
		<AgentuityProvider baseUrl={process.env.NEXT_PUBLIC_AGENTUITY_BASE_URL}>
			<TranslateDemoInner />
		</AgentuityProvider>
	);
}
