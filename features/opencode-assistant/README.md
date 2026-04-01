# OpenCode Assistant

Demonstrates Agentuity platform features using a chat interface for GitHub repositories:

- **Sandboxes**: Create, configure, and destroy isolated runtime environments
- **KV Storage**: Persist workspace state across stateless HTTP requests
- **SSE Streaming**: Proxy server-sent events from a sandbox to the browser
- **End-to-end Type Safety**: Valibot schemas flow from API routes to React hooks
- **AI Gateway**: Route LLM calls through Agentuity's gateway with a single SDK key

No agents are defined. All features are used directly from API routes.

## Getting Started

```bash
bun install
bun run dev
```

No separate provider API key needed. The `AGENTUITY_SDK_KEY` (set automatically by `agentuity auth login`) routes LLM calls through the Agentuity AI Gateway.

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the API directly.

## How It Works

1. Enter a GitHub repo URL (defaults to `https://github.com/agentuity/sdk`)
2. Click **Start**: a sandbox boots with `opencode:latest`, clones the repo, and starts the OpenCode server
3. Ask questions about the codebase: responses stream back via SSE with markdown rendering
4. Click **Stop** to destroy the sandbox

The backend creates the sandbox without a command (which returns immediately), then runs setup in a fire-and-forget execute call:

```typescript
// Create sandbox without command — returns in ~2s
const sbx = await sandbox.create({
  runtime: 'opencode:latest',
  network: { enabled: true, port: 4096 },
  resources: { memory: '2Gi', cpu: '1000m' },
  timeout: { idle: '30m' },
  env,
});

// Fire-and-forget: clone repo + start OpenCode with a watchdog loop
sbx.execute({
  command: ['bash', '-c', [
    'mkdir -p ~/.config/opencode',
    "echo '{\"model\":\"anthropic/claude-sonnet-4-6\"}' > ~/.config/opencode/opencode.json",
    'git clone --depth 1 $REPO_URL ~/project || true',
    'mkdir -p ~/project',
    "nohup bash -c 'while true; do cd ~/project && opencode serve --port 4096 --hostname 0.0.0.0 >> /tmp/opencode.log 2>&1; sleep 2; done' > /dev/null 2>&1 &",
  ].join('\n')],
}).catch((err) => logger.warn('execute() rejected', { error: String(err) }));
```

## Session Persistence

This example keeps one active workspace at a time. KV stores the current sandbox ID, server URL, repo URL, and OpenCode session ID with a 30-minute TTL. Refreshing the page reconnects to that same running workspace, and starting the same repo again reuses it instead of re-cloning.

If you start a different repo, the existing workspace is torn down and a fresh sandbox is created for the new repo. The OpenCode session persists only for the currently attached workspace, so the AI retains prior context across page refreshes but not across repo switches. The visual chat history still resets because it lives in React state.

## Project Structure

```
src/
├── api/index.ts        # API routes: start, status, ask, events (SSE), stop
├── lib/
│   ├── opencode.ts     # OpenCode HTTP helpers (health, session, prompt)
│   └── types.ts        # Shared schemas (AssistantState, request/response types)
└── web/
    ├── App.tsx          # Chat UI with repo input, markdown streaming, stop controls
    └── App.css          # Agentuity brand theme (cyan + zinc)
```

## Related

- [Sandbox docs](https://agentuity.dev/services/sandbox)
- [OpenCode](https://opencode.ai)
- [Agentuity SDK](https://github.com/agentuity/sdk)
