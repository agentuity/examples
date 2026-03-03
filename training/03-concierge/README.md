# Concierge

A multi-agent orchestration example where a concierge agent classifies user intent and delegates to specialist agents, with conversation history persisted across turns in KV.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test agents directly.

## What's Inside

The `concierge` agent is the entry point. It classifies each incoming message with OpenAI, then calls the appropriate specialist agent via `.run()`:

```typescript
// Classify intent
const intentResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'system', content: `Classify as: sanfrancisco, conference, agentuity, or other` },
             { role: 'user', content: prompt }],
  temperature: 0,
});

// Route to specialist
if (intent === 'conference') {
  const result = await conferenceAgent.run({
    prompt,
    conversationHistory: conversationHistory.slice(-10),
  });
} else if (intent === 'sanfrancisco') {
  const result = await sanfranciscoAgent.run({ prompt, conversationHistory });
} else if (intent === 'agentuity') {
  const result = await developerAgent.run({ prompt, conversationHistory });
}
```

After routing, the concierge appends both sides of the exchange to conversation history and saves it to KV with a 24-hour TTL:

```typescript
await ctx.kv.set('conversations', convId, { messages: conversationHistory }, { ttl: 86400 });
```

On the next request, the same `conversationId` reloads the prior messages so each specialist agent receives the last 10 turns as context.

The three specialist agents each use a different provider and knowledge source:

- **`conference`**: answers questions about AI Engineer World Fair 2025 using content loaded from `src/content/conference/llms.txt` via `Bun.file()`. Uses OpenAI (`gpt-4o-mini`) via the AI SDK. Content is cached in KV after the first load.
- **`sanfrancisco`**: local SF guide backed by Perplexity (`sonar-pro`) for live web search. Fetches current weather via `src/lib/weather.ts` when the query mentions weather keywords, and appends sources extracted from Perplexity's response.
- **`developer`**: Agentuity platform expert using documentation loaded from `src/content/agentuity/llms.txt`. Uses OpenAI (`gpt-4o-mini`) and caches the doc content in KV.

## Project Structure

```
src/
├── agent/
│   ├── concierge/
│   │   ├── agent.ts        # Orchestrator: intent classification + routing
│   │   └── index.ts
│   ├── conference/
│   │   ├── agent.ts        # AI Engineer World Fair expert (OpenAI)
│   │   └── index.ts
│   ├── sanfrancisco/
│   │   ├── agent.ts        # SF local guide (Perplexity + weather)
│   │   └── index.ts
│   └── developer/
│       ├── agent.ts        # Agentuity platform expert (OpenAI)
│       └── index.ts
├── api/
│   └── index.ts            # API routes for direct agent access
├── content/
│   ├── conference/
│   │   └── llms.txt        # Conference knowledge base
│   └── agentuity/
│       └── llms.txt        # Agentuity documentation
├── lib/
│   └── weather.ts          # Reusable weather fetch function
└── web/
    ├── App.tsx             # React frontend
    ├── frontend.tsx
    └── index.html
```

## Related

- [Calling other agents](https://agentuity.dev/agents/calling-other-agents)
- [State management](https://agentuity.dev/agents/state-management)
- [AI SDK integration](https://agentuity.dev/agents/ai-sdk-integration)
- [KV storage](https://agentuity.dev/services/storage/key-value)
- [Agentuity SDK](https://github.com/agentuity/sdk)
