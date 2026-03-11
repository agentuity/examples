# Claude Code Agent

An Agentuity agent that demonstrates **Claude Agent SDK** integration with **Agentuity Sandboxes** for conversational code intelligence and safe code execution.

## What It Does

- **Code Intelligence** — Uses [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) (`@anthropic-ai/claude-agent-sdk`) to read, analyze, and generate code in a local workspace seeded with sample Python and TypeScript files.
- **Sandbox Execution** — Runs user code safely in isolated Agentuity Sandboxes (`ctx.sandbox.run()`) using the Bun runtime.
- **Conversation History** — Maintains multi-turn conversations via Agentuity thread state, so the agent remembers prior context.
- **Chat Frontend** — A React-based chat UI for interacting with the agent conversationally.

## Quick Start

1. Import the project: `agentuity project import`
2. Add `ANTHROPIC_API_KEY=...` to `.env`
3. Install dependencies: `bun install`
4. Start the dev server: `bun run dev`
5. Open `http://localhost:3500` and start chatting about code.

## Project Structure

```
claude-code/
├── src/
│   ├── agent/claude-code/
│   │   ├── index.ts         # Agent handler (Claude Agent SDK + Sandbox)
│   │   └── sample-files.ts  # Sample Python/TS files for the workspace
│   ├── api/
│   │   └── index.ts         # Chat API routes
│   └── web/
│       ├── App.tsx           # Chat UI
│       ├── App.css           # Tailwind theme
│       ├── frontend.tsx      # React entry point
│       └── index.html        # HTML template
├── app.ts                    # Application entry point
├── agentuity.config.ts       # Vite config (React + Tailwind)
└── package.json
```

## How It Works

1. The frontend sends a prompt via `POST /api/chat`.
2. The agent initializes a workspace with sample files and calls Claude Agent SDK's `query()`.
3. Claude Code reads, writes, and analyzes files using built-in tools (Read, Write, Edit, Glob, Grep).
4. When the user asks to run code, the agent ships workspace files to an Agentuity Sandbox for execution.
5. Results (analysis + execution output) are returned to the chat UI.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send a chat message |
| GET | `/api/chat/history` | Get conversation history |
| DELETE | `/api/chat/history` | Clear conversation history |

## Sample Files

The agent workspace includes these reference files:

- `fibonacci.ts` — Recursive, iterative, and generator Fibonacci implementations
- `math-tricks.ts` — Prime checking, factorial, GCD, LCM utilities
- `class-example.ts` — Animal/Dog/Cat class hierarchy with inheritance
- `hello.ts` — Greeting and Fibonacci example

## Requirements

- [Bun](https://bun.sh/) v1.0+
- [Agentuity CLI](https://agentuity.sh)
- `ANTHROPIC_API_KEY` in local `.env` for the Claude Agent SDK

## Environment

This example calls `@anthropic-ai/claude-agent-sdk` directly, so `ANTHROPIC_API_KEY` is the main manual local setup step.

Agentuity services such as dev mode, thread state, and sandboxes use `AGENTUITY_SDK_KEY` through the normal project setup from `agentuity project import`.

Minimal local `.env`:

```bash
ANTHROPIC_API_KEY=...
```

## Resources

- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
