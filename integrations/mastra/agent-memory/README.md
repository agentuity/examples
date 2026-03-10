# Mastra Agent Memory

Conversational memory using Mastra's `Agent` with Agentuity `ctx.thread.state` for persistent history.

## How It Works

**Mastra handles**: agent orchestration, LLM interaction via `agent.generate()`, and system instructions.

**Agentuity handles**: persistent conversation history via `ctx.thread.state.push()` (20-message sliding window), thread isolation via `ctx.thread.id`, preference extraction and storage, and deployment.

## Architecture

```
agent-memory/
├── src/
│   ├── agent/
│   │   └── memory/
│   │       └── index.ts      # Mastra Agent + ctx.thread.state history
│   ├── api/
│   │   └── index.ts          # Chat, history, clear endpoints
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
│       └── App.tsx           # Chat interface
├── app.ts
└── package.json
```

## Key Code Patterns

### Mastra Agent (no Memory class needed)

```typescript
import { Agent } from '@mastra/core/agent';

const memoryMastraAgent = new Agent({
  id: 'memory-agent',
  name: 'Memory Agent',
  instructions: 'You are a helpful assistant with memory...',
  model: 'openai/gpt-4o-mini',
});
```

### Loading history from thread state

```typescript
const history = (await ctx.thread.state.get<ChatMessage[]>('messages')) ?? [];
const messages = [
  ...history.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.content };
    return { role: 'assistant' as const, content: m.content };
  }),
  { role: 'user' as const, content: message },
];
const result = await memoryMastraAgent.generate(messages);
```

### Persisting messages with sliding window

```typescript
const now = new Date().toISOString();
await ctx.thread.state.push('messages', { role: 'user', content: message, timestamp: now }, 20);
await ctx.thread.state.push('messages', { role: 'assistant', content: result.text, timestamp: now }, 20);
```

## API Endpoints

```bash
# Send a chat message
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Alice"}'

# Get conversation history (from thread state)
curl http://localhost:3500/api/history

# Clear history
curl -X DELETE http://localhost:3500/api/history
```

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Agent Documentation](https://mastra.ai/docs/agents)
- [Agentuity Documentation](https://agentuity.dev)
