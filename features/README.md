# Feature Examples

Examples showcasing Agentuity platform capabilities: sandboxes, cron jobs, KV storage, durable streams, and port exposure.

| Example | Features | Description |
|---------|----------|-------------|
| [code-runner](./code-runner) | Sandbox, Evals | Parallel sandbox execution across runtimes with LLM-as-judge evals |
| [scheduled-digest](./scheduled-digest) | Cron, KV, Streams | Cron-powered content digest published to shareable URLs |
| [web-explorer](./web-explorer) | Sandbox (interactive), agent-browser | AI-guided web exploration with screenshots |
| [opencode-server](./opencode-server) | Sandbox, Port Exposure, KV | OpenCode IDE running in a sandbox, attach from your terminal |

## Getting Started

```bash
cd code-runner
cp .env.example .env   # add your API keys
bun install
bun run dev
```

Each example includes setup instructions in its README.

If you're new to Agentuity, start with the [training examples](../training) first.
