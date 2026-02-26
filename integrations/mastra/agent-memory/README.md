# Agent Memory with Agentuity

This example demonstrates how to port Mastra's [Agent Memory](https://mastra.ai/docs/agents/agent-memory) pattern to the Agentuity platform.

## Overview

Agents use memory to maintain context across interactions. LLMs are stateless, so agents need memory to track message history and recall relevant information. This example shows how Agentuity's `ctx.thread.state` API provides the same capabilities as Mastra's memory system.

## Mastra to Agentuity Mapping

| Mastra Feature | Mastra API | Agentuity Equivalent |
|---------------|------------|---------------------|
| Initialize Memory | `new Memory({ options: { lastMessages: 20 }})` | `ctx.thread.state.push(key, value, 20)` |
| Get History | `memory.recall({ threadId })` | `ctx.thread.state.get('messages')` |
| Store Message | Auto on `agent.generate()` | `ctx.thread.state.push('messages', msg, limit)` |
| Thread ID | `thread: { id: "conversation-123" }` | Auto via cookie (`thrd_xxx`) |
| Resource ID | `resource: "user-123"` | `ctx.thread.state.set('userId', ...)` |
| Clear History | Not built-in | `ctx.thread.state.delete('messages')` |
| Working Memory | `workingMemory` field | `ctx.thread.state.set('preferences', {...})` |

## Features Demonstrated

### 1. Message History with Sliding Window

```typescript
// Store with max 20 messages (like Mastra's lastMessages option)
await ctx.thread.state.push('messages', userMessage, 20);
await ctx.thread.state.push('messages', assistantMessage, 20);
```

### 2. Thread Isolation

Each browser session automatically gets a unique thread ID stored in cookies. Different browsers = different conversations, just like Mastra's `thread` parameter.

### 3. User Preferences (Working Memory)

```typescript
// Store user preferences (like Mastra's working memory)
await ctx.thread.state.set('preferences', {
  name: 'Alice',
  interests: ['hiking', 'photography']
});

// Retrieve later
const preferences = await ctx.thread.state.get('preferences');
```

### 4. Multi-Turn Recall

The agent builds context from previous messages to answer questions like "What's my name?" or "What did we talk about?"

## Project Structure

```
agent-memory/
├── src/
│   ├── agent/
│   │   └── memory/
│   │       └── index.ts    # Memory agent with conversation recall
│   ├── api/
│   │   └── index.ts        # Chat, history, clear endpoints
│   └── web/
│       └── App.tsx         # Chat interface
├── app.ts
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- OpenAI API key (set as `OPENAI_API_KEY` environment variable)

### Development

```bash
bun dev
```

The server starts at `http://localhost:3500`

### Testing the Memory

1. **Share your name**: "My name is Alice"
2. **Ask about it later**: "What's my name?"
3. **Share interests**: "I love hiking and photography"
4. **Recall everything**: "What do you know about me?"
5. **Clear and start fresh**: Click "Clear History"

### API Endpoints

```bash
# Send a chat message
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Alice"}'

# Get conversation history
curl http://localhost:3500/api/history

# Clear history
curl -X DELETE http://localhost:3500/api/history
```

## Key Code Patterns

### Building Context from History

```typescript
// Retrieve existing messages
const messages = await ctx.thread.state.get<ChatMessage[]>('messages') ?? [];
const preferences = await ctx.thread.state.get<UserPreferences>('preferences') ?? {};

// Build system prompt with context
const systemPrompt = `You are a helpful assistant with memory.
Known user: ${preferences.name ?? 'Unknown'}
Previous conversation: ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}`;
```

### Extracting and Storing Preferences

```typescript
// Extract user info from messages
if (message.match(/my name is (\w+)/i)) {
  await ctx.thread.state.set('preferences', { ...prefs, name: match[1] });
}
```

## Learn More

- [Agentuity Documentation](https://agentuity.dev)
- [Mastra Agent Memory](https://mastra.ai/docs/agents/agent-memory)
- [Mastra Working Memory](https://mastra.ai/docs/memory/working-memory)
