# Web Explorer

AI-guided autonomous web exploration in a sandboxed headless browser.

## How It Works

The agent runs a `generateText` loop (AI SDK) with three tools:

```typescript
browser         // screenshot, click, fill, scroll, navigate, press, hover, eval, wait
store_finding   // saves a discovery to KV (url, title, observation, screenshot key)
finish_exploration  // stops the loop — no execute(), stopped via hasToolCall()
```

The tools form an **Exploration Cycle**: interact with a page using `browser`, call `store_finding` to checkpoint what you learned, navigate to the next section, repeat. `finish_exploration` ends the loop once findings have been stored. The `store_finding` return value nudges the model to move on or finish, keeping the cycle flowing.

Each `browser` call dispatches to a headless Chromium sandbox (`agent-browser:latest` runtime). Screenshots are captured, uploaded to object storage via `s3.file()` from Bun, and presigned URLs are returned to the frontend. Visit metadata is stored in KV under two keys: `visit:{normalizedUrl}` and `domain:{hostname}` (index).

On repeat visits to the same domain, past visits are loaded from KV and injected into the model's prompt so it explores different pages and interactions.

The frontend connects via SSE (`GET /explore/stream`) and renders a real-time tool-call timeline with inline screenshots. **Explore More** resumes the same sandbox with `skipNavigation: true` while the current server process is still holding that in-memory session and the sandbox has not idled out. **End Session** calls `DELETE /explore/session/:id` to destroy it.

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

## Customizing

Preset targets live in `src/lib/targets.ts`. Each target can include a `hints` string that gets injected into the system prompt to guide exploration for that specific site (e.g., "focus on one demo per session" for the SDK Explorer). The generic system prompt handles any URL — hints add site-specific strategy on top.

To add a new target, add an entry with `label`, `url`, `description`, and optionally `hints`.

## Setup

This example uses the OpenAI provider via the AI SDK for planning, screenshot observations, and fallback summaries, so local runs need OpenAI model access configured.

Screenshots require an S3-compatible storage bucket:

```bash
agentuity cloud storage create --name web-explorer-screenshots --region use
agentuity project add storage web-explorer-screenshots
```

This writes the S3 credentials to `.env` for local dev. On deploy, they're injected automatically. Without a bucket, screenshots fall back to inline base64 for the current run, but stored visit memory will not include durable screenshot links.

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
