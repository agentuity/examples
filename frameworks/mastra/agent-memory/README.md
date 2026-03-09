# Mastra Agent Memory

Conversational memory using Mastra's `Memory` class with `LibSQLStore`, deployed on Agentuity with thread state mirroring for frontend display.

## How It Works

**Mastra handles**: persistent conversation history (`Memory` with `lastMessages: 20` sliding window), automatic message storage on `agent.generate()`, and multi-turn recall via `memory: { resource, thread }`.

**Agentuity handles**: thread isolation via `ctx.thread.id`, mirroring messages to thread state for frontend access, preference extraction and storage, and deployment.

## Architecture

```
agent-memory/
├── src/
│   ├── agent/
│   │   └── memory/
│   │       └── index.ts      # Mastra Agent + Memory + LibSQLStore
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

### Mastra Agent with Memory

```typescript
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

const memoryMastraAgent = new Agent({
  id: 'memory-agent',
  name: 'Memory Agent',
  instructions: 'You are a helpful assistant with memory...',
  model: 'openai/gpt-4o-mini',
  memory: new Memory({
    storage: new LibSQLStore({ id: 'memory-agent-store', url: 'file:mastra.db' }),
    options: { lastMessages: 20 },
  }),
});
```

### Generating with memory context

```typescript
const result = await memoryMastraAgent.generate(message, {
  memory: {
    resource: ctx.thread.id,  // Scopes memory to this thread
    thread: ctx.thread.id,
  },
});
```

### Mirroring to Agentuity thread state

```typescript
// Mastra Memory stores messages internally for LLM recall.
// Mirror to thread state so the frontend can display conversation history.
const now = new Date().toISOString();
await ctx.thread.state.push('messages', { role: 'user', content: message, timestamp: now }, 40);
await ctx.thread.state.push('messages', { role: 'assistant', content: result.text, timestamp: now }, 40);
```

## API Endpoints

```bash
# Send a chat message (Mastra Memory auto-stores it)
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Alice"}'

# Get conversation history (from Agentuity thread state mirror)
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

- [Mastra: Agent Memory](https://mastra.ai/docs/agents/agent-memory)
- [Mastra: Working Memory](https://mastra.ai/docs/memory/working-memory)
- [Agentuity Documentation](https://agentuity.dev)
