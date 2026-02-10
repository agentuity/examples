# Streaming

Demonstrates [LangChain's streaming](https://docs.langchain.com/oss/javascript/langchain/agents#streaming) ported to Agentuity. Shows how to stream agent responses and capture intermediate tool calls as they happen.

## What This Example Shows

### agent.stream() with streamMode: "values"

Stream the agent execution and iterate over state snapshots:

```ts
const stream = await agent.stream(
  { messages: [new HumanMessage(message)] },
  { streamMode: "values" },
);

for await (const chunk of stream) {
  const lastMessage = chunk.messages[chunk.messages.length - 1];
  const type = lastMessage._getType(); // "ai" | "tool" | ...

  if (type === "ai" && lastMessage.tool_calls?.length > 0) {
    // Tool call in progress
  } else if (type === "tool") {
    // Tool result received
  } else if (type === "ai") {
    // Final AI response
  }
}
```

### Timeline Visualization

Each streaming step is captured with a timestamp, building a real-time view of the agent's ReAct loop:

- **tool_call** — Agent decides to call a tool
- **tool_result** — Tool returns data
- **ai_message** — Agent produces text response

## Tools Available

| Tool | Description |
|------|-------------|
| `search` | Search for current information |
| `calculate` | Evaluate math expressions |
| `get_time` | Get current time in a timezone |

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Request

```bash
# Multi-tool query to see streaming timeline
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather, what time is it in New York, and calculate 15% of 85"}'
```

## LangChain Pattern Mapping

| LangChain Pattern | Implementation |
|---|---|
| `agent.stream()` | Streams execution, receives chunks as they arrive |
| `streamMode: "values"` | Full state snapshots at each step |
| Intermediate steps | Tool calls, tool results, AI messages tracked in timeline |
| Chunk processing | `for await (const chunk of stream)` iterates over steps |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
streaming-agent/
├── src/
│   ├── agent/
│   │   └── streaming/
│   │       └── index.ts      # Agent + streaming + timeline capture
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Chat UI with stream timeline visualization
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
