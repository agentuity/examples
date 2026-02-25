# Web Explorer

AI-guided autonomous web exploration using the Agentuity sandbox with browser automation.

## Getting Started

```bash
cp .env.example .env   # add your API keys
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

An agent that uses the interactive sandbox lifecycle (`create` -> `execute` x N -> `readFile` -> `destroy`) instead of one-shot `ctx.sandbox.run()`. This gives full control over multi-step browser interactions:

```typescript
const sandbox = await ctx.sandbox.create({
  runtime: 'agent-browser:latest',
  network: { enabled: true },
  resources: { memory: '1Gi', cpu: '1000m' },
  timeout: { idle: '10m', execution: '30s' },
});

try {
  await exec(sandbox, ['agent-browser', 'open', input.url]);
  await exec(sandbox, ['agent-browser', 'screenshot', 'step-1.png']);
  const screenshot = await readFileAsBase64(sandbox, 'step-1.png');

  const snapshotExec = await exec(sandbox, ['agent-browser', 'snapshot', '-i']);
  const accessibilityTree = await getStdout(snapshotExec);
  // LLM analyzes the tree and picks elements to interact with...
} finally {
  await sandbox.destroy();
}
```

The agent opens a URL, reads the page's accessibility tree, and uses an LLM to decide what to click next. It repeats this for N steps (default: 4), taking screenshots at each step and returning a timeline with AI commentary.

The frontend lets users pick from preselected targets or enter a custom URL, then displays the exploration as a step-by-step timeline with screenshots.

## Project Structure

```
src/
├── agent/web-explorer/
│   ├── agent.ts      # LLM-driven browser exploration with interactive sandbox
│   └── index.ts
├── api/index.ts      # POST /api/explore
├── lib/
│   ├── types.ts      # Shared I/O schemas (ExplorationStep, AgentInput/Output)
│   └── targets.ts    # Preselected target URLs
└── web/
    ├── App.tsx        # React UI with timeline view
    └── ...
```

## Related

- [Sandbox docs](https://agentuity.dev/services/sandbox)
- [Agentuity SDK](https://github.com/agentuity/sdk)
