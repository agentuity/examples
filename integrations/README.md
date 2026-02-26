# Integrations

Connect Agentuity agents to existing apps, frameworks, and platforms.

### Frontend

Add agents to an app you already have. Each one runs two processes side by side: your framework's dev server and the Agentuity backend.

| Example | Framework | What It Demonstrates |
|---------|-----------|----------------------|
| [nextjs](./nextjs) | Next.js App Router | Translate agent with history, evals, and rewrite proxy |
| [tanstack-start](./tanstack-start) | TanStack Start | Translate agent with history, evals, and Vite proxy |
| [turborepo](./turborepo) | Turborepo | Monorepo with shared schemas across frontend and agents |

### Platforms

Standalone Agentuity projects that integrate with external services.

| Example | Platform | What It Demonstrates |
|---------|----------|----------------------|
| [chat-sdk](./chat-sdk) | Chat SDK | Multi-platform chatbot (Slack, Discord) with conversation memory |

## Getting Started

Frontend examples:

```bash
cd nextjs        # or tanstack-start, turborepo
bun install
bun run build:agent
bun run dev
```

Platform examples:

```bash
cd chat-sdk
bun install
bun run dev
```

Each example includes its own setup instructions and project layout.

## New to Agentuity?

Try the [SDK Explorer](https://agentuity.dev) in the Agentuity docs to learn key features and services with interactive examples. Or, start with the [training examples](../training) for a more structured, course-like walkthrough.
