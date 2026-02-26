# Integrations

Build with Agentuity and another SDK. Each example shows how to use an external framework or library alongside the Agentuity runtime.

## Quick Start

```bash
# From repo root
cd integrations/mastra/agent-memory
cp .env.example .env
bun install
bun run typecheck
bun run build
bun run dev
```

## Common Environment Variables

All integration examples support this baseline set:

- `AGENTUITY_SDK_KEY`
- `OPENAI_API_KEY`

Optional runtime vars:

- `PORT` (default backend port)
- `VITE_PORT` (frontend dev server port)
- `AGENTUITY_LOG_LEVEL`
- `AGENTUITY_PUBLIC_WORKBENCH_PATH` (used by examples that include embedded web UIs)

## Examples

### Mastra

| Example | Pattern |
|---|---|
| `mastra/agent-memory` | Conversation memory + thread state |
| `mastra/structured-output` | Schema-driven structured output |
| `mastra/using-tools` | Tool/function calling |
| `mastra/network-agent` | Multi-agent network flow |
| `mastra/agent-approval` | Human approval pattern |
| `mastra/network-approval` | Network + human-in-the-loop approvals |
| `mastra/processors-agent` | Processor pipeline/moderation |

### LangChain

| Example | Pattern |
|---|---|
| `langchain/basic-agent` | ReAct basics + static tools |
| `langchain/system-prompt` | Static + dynamic system prompts |
| `langchain/dynamic-model` | Middleware model switching |
| `langchain/dynamic-tools` | Runtime tool selection |
| `langchain/streaming-agent` | Response/event streaming pattern |
| `langchain/structured-agent-output` | Typed structured responses |

### OpenAI Agents SDK

| Example | Pattern |
|---|---|
| `openai/tool-calling` | Tool calls + trace reconstruction |
| `openai/structured-context` | Typed run context |
| `openai/streaming-events` | Streaming event timelines |
| `openai/agent-handoffs` | Multi-agent handoffs |

### Chat SDK

| Example | Pattern |
|---|---|
| `chat-sdk` | Multi-platform chatbot (Slack, Discord) |

## More Examples

For step-by-step tutorials see [training/](../training).

For adding agents to an existing app (e.g., Next.js, TanStack Start) see [existing-apps/](../existing-apps).

For platform features (e.g., sandboxes, cron jobs) see [features/](../features).