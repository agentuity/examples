# Feature Examples

Examples showcasing Agentuity platform capabilities: sandboxes, cron jobs, KV storage, durable streams, and port exposure.

| Example | Features | Description |
|---------|----------|-------------|
| [code-runner](./code-runner) | Sandbox, Evals | Parallel sandbox execution across runtimes with LLM-as-judge evals |
| [scheduled-digest](./scheduled-digest) | Cron, KV, Streams | Cron-powered content digest published to shareable URLs |
| [web-explorer](./web-explorer) | Sandbox (interactive), KV, Object Storage | Tool-calling web explorer with screenshots, KV visit memory, and in-process session resume |
| [opencode-assistant](./opencode-assistant) | Sandbox, SSE, KV | Ask questions about any GitHub repo via OpenCode in a sandbox |
| [research-agent](./research-agent) | Tool Calling | Autonomous research agent using the Anthropic SDK with Wikipedia |

## Getting Started

```bash
cd code-runner
bun install
bun run dev
```

Each example includes setup instructions in its README.

## More Examples

- Step-by-step tutorials: [training/](../training)
- Add agents to an existing app (e.g., Next.js, TanStack Start): [existing-apps/](../existing-apps)
- Integrations with other SDKs (e.g., Mastra, LangChain): [integrations/](../integrations)
