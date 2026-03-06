# Web Explorer

AI-guided autonomous web exploration in a sandboxed headless browser.

## How it works

The agent runs a `generateText` loop (AI SDK) with three tools:

```typescript
browser         // screenshot, click, fill, scroll, navigate, press, hover, eval, wait
store_finding   // saves a discovery to KV (url, title, observation, screenshot key)
finish_exploration  // stops the loop — no execute(), stopped via hasToolCall()
```

Each `browser` call dispatches to a headless Chromium sandbox (`agent-browser:latest` runtime). Screenshots are captured, uploaded to S3 via `s3.file()` from Bun, and presigned URLs are returned to the frontend. Visit metadata is stored in KV under two keys: `visit:{normalizedUrl}` and `domain:{hostname}` (index).

On repeat visits to the same domain, past visits are loaded from KV and injected into the model's prompt so it explores different pages and interactions.

The frontend connects via SSE (`GET /explore/stream`) and renders a real-time tool-call timeline with inline screenshots. Sessions persist after a run: **Explore More** resumes the same sandbox with `skipNavigation: true`, and **End Session** calls `DELETE /explore/session/:id` to destroy it.

## Services used

| Service | Purpose |
|---------|---------|
| KV | Visit memory — `visit:{url}` records + `domain:{hostname}` index |
| Object Storage (S3) | Screenshots — uploaded with `s3.file(key)` from Bun |
| Sandbox | `agent-browser:latest` — headless Chromium + Playwright CLI |

## Key files

```
src/
├── lib/
│   ├── explorer.ts          # 3 tools, BROWSER_DISPATCH table, generateText loop, KV memory, system prompt
│   ├── storage.ts           # uploadScreenshot() and screenshotPresignedUrl() via Bun s3
│   └── targets.ts           # Preselected URLs with site-specific hints
├── agent/web-explorer/
│   ├── types.ts             # StreamEvent union, AgentInput/Output, VisitRecord, MemoryVisit
│   └── agent.ts             # Agent handler — calls explore(), returns AgentOutput
├── api/index.ts             # SSE streaming, session map, POST /explore, DELETE /explore/session/:id
└── web/
    ├── App.tsx              # Tool-call timeline, batch collapsing, collapsed memory card, session controls
    └── App.css              # Agentuity brand theme
```

## Running locally

```bash
bun install
bun run dev
```

Frontend: [localhost:3500](http://localhost:3500)
Workbench (direct agent): [localhost:3500/workbench](http://localhost:3500/workbench)

```bash
bun run typecheck   # type check without building
```
