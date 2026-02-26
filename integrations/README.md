# Adding Agentuity to an Existing Frontend

These examples show how to add Agentuity agents to a frontend app you already have. Each one runs two processes side by side: your framework's dev server and the Agentuity backend.

| Example | Framework | What It Demonstrates |
|---------|-----------|----------------------|
| [nextjs](./nextjs) | Next.js App Router | Translate agent with history, evals, and rewrite proxy |
| [tanstack-start](./tanstack-start) | TanStack Start | Translate agent with history, evals, and Vite proxy |
| [turborepo](./turborepo) | Turborepo | Monorepo with shared schemas across frontend and agents |
| [chat-sdk](./chat-sdk) | Chat SDK | Multi-platform chatbot (Slack, Discord) with conversation memory |

## Getting Started

Pick an example and follow its README:

```bash
cd nextjs        # or tanstack-start, turborepo
bun install
bun run build:agent
bun run dev
```

For chat-sdk (standalone Agentuity project, no separate frontend build):

```bash
cd chat-sdk
bun install
bun run dev
```

Each example includes its own setup instructions, project layout, and deployment notes.

## New to Agentuity?

Start with the [training examples](../training) instead. They cover Agentuity fundamentals before you integrate with a framework.
