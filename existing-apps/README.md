# Existing Apps

Add Agentuity agents to an app you already have. Each one runs two processes side by side: your framework's dev server and the Agentuity backend.

| Example | Framework | What It Demonstrates |
|---------|-----------|----------------------|
| [nextjs](./nextjs) | Next.js App Router | Translate agent with history, evals, and rewrite proxy |
| [tanstack-start](./tanstack-start) | TanStack Start | Translate agent with history, evals, and Vite proxy |
| [turborepo](./turborepo) | Turborepo | Monorepo with shared schemas across frontend and agents |

## Getting Started

```bash
cd nextjs        # or tanstack-start, turborepo
bun install
bun run build:agent
bun run dev
```

Each example includes its own setup instructions and project layout.

## More Examples

For step-by-step tutorials see [training/](../training).

For integrations with other SDKs (e.g., Mastra, LangChain) see [integrations/](../integrations).

For platform features (e.g., sandboxes, cron jobs) see [features/](../features).