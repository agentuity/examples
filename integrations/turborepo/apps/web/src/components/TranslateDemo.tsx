import { useState } from "react";
import { useAPI } from "@agentuity/react";
import "@tanstack-turborepo/agentuity/routes";
import {
  LANGUAGES,
  MODELS,
  type Language,
  type Model,
} from "@tanstack-turborepo/shared";

function AgentuityLogo() {
  return (
    <svg
      aria-hidden="true"
      aria-label="Agentuity Logo"
      fill="none"
      height="191"
      viewBox="0 0 220 191"
      width="220"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "auto", width: "3rem" }}
    >
      <path
        clipRule="evenodd"
        d="M220 191H0L31.427 136.5H0L8 122.5H180.5L220 191ZM47.5879 136.5L24.2339 177H195.766L172.412 136.5H47.5879Z"
        fill="#00FFFF"
        fillRule="evenodd"
      />
      <path
        clipRule="evenodd"
        d="M110 0L157.448 82.5H189L197 96.5H54.5L110 0ZM78.7021 82.5L110 28.0811L141.298 82.5H78.7021Z"
        fill="#00FFFF"
        fillRule="evenodd"
      />
    </svg>
  );
}

function TanStackLogo() {
  return (
    <img
      src="https://avatars.githubusercontent.com/u/72518640?s=200&v=4"
      alt="TanStack Logo"
      style={{ height: "2.5rem", width: "2.5rem", borderRadius: "0.5rem" }}
    />
  );
}

function TurboLogo() {
  return (
    <svg
      aria-label="Turborepo Logo"
      height="40"
      viewBox="0 0 32 32"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Turborepo Logo</title>
      <path
        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
        fill="#FF1E56"
      />
      <path
        d="M16 6c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6z"
        fill="#0A0A0A"
      />
      <path
        d="M16 10c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6z"
        fill="#FF1E56"
      />
    </svg>
  );
}

export function TranslateDemo() {
  const [text, setText] = useState("Hello, how are you today?");
  const [language, setLanguage] = useState<Language>("Spanish");
  const [model, setModel] = useState<Model>("gpt-5-nano");

  const { data, invoke, isLoading, error } = useAPI("POST /api/translate");

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex justify-center">
      <div className="flex flex-col gap-8 max-w-3xl w-full p-8 pt-16">
        <header className="flex flex-col items-center gap-2 text-center mb-8">
          <div className="flex items-center gap-4 mb-4">
            <AgentuityLogo />
            <span className="text-zinc-500 text-2xl font-light">+</span>
            <TanStackLogo />
            <span className="text-zinc-500 text-2xl font-light">+</span>
            <TurboLogo />
          </div>

          <h1 className="text-4xl font-extralight">
            Agentuity + TanStack + Turborepo
          </h1>
          <p className="text-zinc-400 text-lg">
            Type-safe AI translation with monorepo architecture
          </p>
        </header>

        <div className="bg-black border border-zinc-800 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
          <h2 className="text-xl font-normal text-zinc-400">
            Try the <span className="text-white">Translation Agent</span>
          </h2>

          <div className="flex flex-col gap-4">
            <textarea
              className="bg-zinc-900 border border-zinc-700 rounded-md text-white p-4 outline-none focus:border-cyan-400 resize-none h-32"
              disabled={isLoading}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate..."
              value={text}
            />

            <div className="flex gap-4">
              <select
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md text-white p-3 outline-none focus:border-cyan-400"
                disabled={isLoading}
                onChange={(e) => setLanguage(e.target.value as Language)}
                value={language}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md text-white p-3 outline-none focus:border-cyan-400"
                disabled={isLoading}
                onChange={(e) => setModel(e.target.value as Model)}
                value={model}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-medium py-3 px-6 rounded-md hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading || !text.trim()}
              onClick={() => invoke({ text, toLanguage: language, model })}
              type="button"
            >
              {isLoading ? "Translating..." : "Translate"}
            </button>
          </div>

          {error && (
            <div className="bg-red-950 border border-red-600 rounded-md p-4 text-red-300">
              Error: {error.message}
            </div>
          )}

          <div
            className={`bg-zinc-900 border border-zinc-700 rounded-md p-4 font-mono ${
              !data ? "text-zinc-500" : "text-cyan-300"
            }`}
          >
            {data ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg">{data.translation}</div>
                <div className="text-sm text-zinc-500 flex gap-4">
                  <span>Tokens: {data.tokens}</span>
                  <span>History: {data.translationCount} translations</span>
                </div>
              </div>
            ) : (
              "Translation will appear here..."
            )}
          </div>
        </div>

        {data && data.history.length > 0 && (
          <div className="bg-black border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-normal mb-4">Translation History</h3>
            <div className="flex flex-col gap-3">
              {data.history.map((entry) => (
                <div
                  key={`${entry.toLanguage}-${entry.model}-${entry.text}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm"
                >
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{entry.toLanguage}</span>
                    <span>{entry.model}</span>
                  </div>
                  <div className="text-zinc-300">{entry.text}</div>
                  <div className="text-cyan-400 mt-1">{entry.translation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
