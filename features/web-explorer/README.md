# Web Explorer

An agent that explores websites using tool-calling: it browses, captures screenshots, stores findings in KV and vector storage, and recalls past visits across sessions.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

The agent runs a `generateText` loop with three tools: `browser` (screenshot, click, fill, scroll, and other actions via a single action-dispatch tool), `store_finding` (saves discoveries to KV and vector storage), and `finish_exploration` (signals the loop to stop):

```typescript
const result = await generateText({
  model: openai('gpt-5-nano'),
  system: buildSystemPrompt(options.url, hints),
  prompt: pastVisits
    ? `Begin exploring ${options.url}. Past visits:\n${pastVisits}\nExplore different areas.`
    : `Begin exploring ${options.url}. Start with browser({ action: "screenshot" }).`,
  tools,
  stopWhen: [stepCountIs(steps), hasToolCall('finish_exploration')],
  abortSignal: options.abortSignal,
});
```

The sandbox uses `agent-browser:latest` and stays open across steps (create once, execute N times, destroy). Past visits are loaded from vector storage before the loop starts and injected as prompt context, so the model explores different areas on repeat visits.

The frontend lets users pick from preselected targets or enter a custom URL, then displays the run as a real-time tool-call timeline with screenshots inline. Sessions persist: **Explore More** reuses the same sandbox for additional steps, and **End Session** destroys it.

## Project Structure

```
src/
├── agent/web-explorer/
│   ├── agent.ts      # Agent handler (calls explore, returns AgentOutput)
│   └── index.ts
├── api/index.ts      # SSE streaming + session management + POST endpoint
├── lib/
│   ├── explorer.ts   # 3 tools + generateText loop + system prompt
│   ├── types.ts      # Stream events + I/O schemas (@agentuity/schema)
│   ├── storage.ts    # S3 screenshot upload via Bun native s3
│   ├── targets.ts    # Preselected target URLs with hints
│   └── url.ts        # URL normalization + screenshot key generation
└── web/
    ├── App.tsx        # React UI with tool-call timeline + session controls
    └── App.css        # Agentuity brand theme
```

## Related

- [Sandbox docs](https://agentuity.dev/services/sandbox)
- [KV Storage docs](https://agentuity.dev/services/storage/key-value)
- [Vector Storage docs](https://agentuity.dev/services/storage/vector)
- [Object Storage docs](https://agentuity.dev/services/storage/object)
- [Agentuity SDK](https://github.com/agentuity/sdk)
