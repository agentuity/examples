# Integrations

Build with Agentuity and another SDK. Each example shows how to use an external framework or library alongside the Agentuity runtime.

## Quick Start

```bash
# From repo root
cd integrations/langchain/basic-agent
bun install
bun run typecheck
bun run build
bun run dev
```

## Examples

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

### Claude Agent SDK

| Example | Pattern |
|---|---|
| `claude-code` | Conversational code intelligence + sandbox execution |

## More Examples

- Step-by-step tutorials: [training/](../training)
- Add agents to an existing app (e.g., Next.js, TanStack Start): [existing-apps/](../existing-apps)
- Agentuity platform features (e.g., cron jobs, KV storage): [features/](../features)
