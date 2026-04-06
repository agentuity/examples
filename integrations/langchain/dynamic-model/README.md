# Dynamic Model

Demonstrates [LangChain's dynamic model selection](https://docs.langchain.com/oss/javascript/langchain/agents#dynamic-model) ported to Agentuity. Shows how middleware can swap between models at runtime based on conversation complexity.

## What This Example Shows

### 1. Dynamic Model Selection Middleware

Use `createMiddleware()` with `wrapModelCall` to select between models based on conversation state:

```ts
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, createMiddleware } from "langchain";

const basicModel = new ChatOpenAI({ model: "gpt-5-mini" });
const advancedModel = new ChatOpenAI({ model: "gpt-5" });

const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: (request, handler) => {
    const messageCount = request.messages.length;
    return handler({
      ...request,
      model: messageCount > 10 ? advancedModel : basicModel,
    });
  },
});
```

### 2. Two-Tier Model Strategy

- **gpt-5-mini** — Fast and cost-effective for simple, short conversations
- **gpt-5** — More capable model activated when conversation complexity grows (>10 messages)

### 3. Middleware Integration

The middleware hooks into the agent's execution pipeline via `createAgent({ middleware: [...] })`, intercepting each model call to apply routing logic.

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Request

```bash
# Simple request (uses gpt-5-mini)
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in Tokyo?"}'

# Complex request with history (uses gpt-5 if >10 messages)
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize our discussion",
    "conversationHistory": [
      {"role": "user", "content": "msg 1"},
      {"role": "assistant", "content": "reply 1"},
      {"role": "user", "content": "msg 2"},
      {"role": "assistant", "content": "reply 2"},
      {"role": "user", "content": "msg 3"},
      {"role": "assistant", "content": "reply 3"},
      {"role": "user", "content": "msg 4"},
      {"role": "assistant", "content": "reply 4"},
      {"role": "user", "content": "msg 5"},
      {"role": "assistant", "content": "reply 5"}
    ]
  }'
```

### Response

```json
{
  "response": "The weather in Tokyo is 80°F, sunny and humid.",
  "modelUsed": "gpt-5-mini",
  "messageCount": 1,
  "threadId": "...",
  "sessionId": "..."
}
```

## LangChain Pattern Mapping

| LangChain Pattern                       | Implementation                                |
| --------------------------------------- | --------------------------------------------- |
| `createMiddleware({ wrapModelCall })`   | `dynamicModelSelection` middleware             |
| `new ChatOpenAI({ model: "..." })`      | `basicModel` and `advancedModel` instances     |
| `request.messages.length`               | Message count drives model selection           |
| `handler({ ...request, model })`        | Swaps model in the middleware handler          |
| `createAgent({ middleware: [...] })`    | Middleware passed to agent at creation          |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
dynamic-model/
├── src/
│   ├── agent/
│   │   └── dynamic-model/
│   │       └── index.ts      # Agent + dynamic model middleware
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Chat UI with model indicator
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
