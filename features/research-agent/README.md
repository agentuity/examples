# Research Agent

An autonomous research agent that investigates any topic using Wikipedia. Built with the Anthropic SDK and native tool calling to demonstrate the agent loop pattern: plan, act, observe, repeat.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) to enter a topic and watch the agent research it.

LLM calls are routed through the [AI Gateway](https://agentuity.dev/agents/ai-gateway) automatically. If you prefer to use your own key, set `ANTHROPIC_API_KEY` in a `.env` file.

## What's Inside

This example shows how to build an agent loop from scratch using the Anthropic SDK directly (no AI SDK abstraction). The agent has three tools: `search_wikipedia`, `get_article`, and `finish_research`.

The core pattern is a simple for-loop. Each iteration sends messages to Claude, checks if it wants to call a tool, executes the tool, and feeds the result back:

```typescript
for (let step = 0; step < MAX_STEPS; step++) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });

  if (response.stop_reason !== 'tool_use') break;

  // Execute tool calls, check for finish_research
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'finish_research') {
      return block.input; // { summary, sourcesUsed }
    }
  }
}
```

The `finish_research` tool is the structured output mechanism: when the model has gathered enough information, it calls this tool with the final summary and source count. No post-processing needed.

## Project Structure

```
src/
├── agent/researcher/
│   ├── agent.ts      # Agent loop with Anthropic tool calling
│   └── index.ts      # Re-export
├── api/
│   └── index.ts      # POST /api/research route
├── lib/
│   └── types.ts      # ResearchInput, ResearchOutput schemas
└── web/
    ├── App.tsx        # Topic input + results display
    ├── App.css        # Agentuity brand theme
    └── frontend.tsx   # React entry point
```

## Related

- [Creating Agents](https://agentuity.dev/agents/creating-agents) — `createAgent()` API reference
- [AI Gateway](https://agentuity.dev/agents/ai-gateway) — How LLM calls are routed through Agentuity
- [Understanding Agents](https://agentuity.dev/cookbook/tutorials/understanding-agents) — The agent loop concept explained
