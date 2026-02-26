# Framework Examples

Agentuity examples organized by AI framework.

## Quick Start

```bash
# From repo root
cd agent-frameworks/mastra/agent-memory
cp .env.example .env
bun install
bun run typecheck
bun run build
bun run dev
```

## Common Environment Variables

All framework examples support this baseline set:

- `AGENTUITY_SDK_KEY`
- `OPENAI_API_KEY`

Optional runtime vars:

- `PORT` (default backend port)
- `VITE_PORT` (frontend dev server port)
- `AGENTUITY_LOG_LEVEL`
- `AGENTUITY_PUBLIC_WORKBENCH_PATH` (used by examples that include embedded web UIs)

## Framework Matrix

### Mastra

| Example | Pattern | Primary API Surface |
|---|---|---|
| `mastra/agent-memory` | Conversation memory + thread state | `POST /api/chat`, `GET/DELETE /api/history` |
| `mastra/structured-output` | Schema-driven structured output | `POST /api/plan`, `GET/DELETE /api/plan/history` |
| `mastra/using-tools` | Tool/function calling | `POST /api/weather`, `POST /api/activities` |
| `mastra/network-agent` | Multi-agent network flow | `POST /api/network`, `POST /api/research`, `POST /api/writing` |
| `mastra/agent-approval` | Human approval pattern | `POST /api/translate`, `GET/DELETE /api/translate/history` |
| `mastra/network-approval` | Network + human-in-the-loop approvals | `POST /api/network/*`, `GET /api/network/*` |
| `mastra/processors-agent` | Processor pipeline/moderation | `POST /api/moderated`, `POST /api/translate` |

### LangChain

| Example | Pattern | Primary API Surface |
|---|---|---|
| `langchain/basic-agent` | ReAct basics + static tools | `POST /api/chat` |
| `langchain/system-prompt` | Static + dynamic system prompts | `POST /api/chat` |
| `langchain/dynamic-model` | Middleware model switching | `POST /api/chat` |
| `langchain/dynamic-tools` | Runtime tool selection | `POST /api/chat` |
| `langchain/streaming-agent` | Response/event streaming pattern | `POST /api/chat` |
| `langchain/structured-agent-output` | Typed structured responses | `POST /api/chat` |

### OpenAI Agents SDK

| Example | Pattern | Primary API Surface |
|---|---|---|
| `openai/tool-calling` | Tool calls + trace reconstruction | `POST /api/chat` |
| `openai/structured-context` | Typed run context | `POST /api/chat` |
| `openai/streaming-events` | Streaming event timelines | `POST /api/chat` |
| `openai/agent-handoffs` | Multi-agent handoffs | `POST /api/chat` |

## Known Limitations

- Most examples focus on framework behavior and do not include full auth hardening by default.
- Many examples use thread-scoped state and demo data rather than durable, multi-tenant persistence.
- External API/tool implementations are intentionally simplified in several examples.
