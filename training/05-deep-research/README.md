# Deep Research

Run a recursive multi-agent research pipeline that searches the web, evaluates sources, extracts learnings, and generates a structured markdown report.

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Agentuity CLI](https://agentuity.dev/cli/installation) installed and logged in (`agentuity login`)

## Getting Started

You need an [Exa API key](https://exa.ai) to run web searches.

```bash
bun install
EXA_API_KEY=your_key_here bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to call the orchestrator directly.

## What's Inside

Four agents collaborate to answer a research query:

- **`orchestrator`**: entry point. Validates `depth`, `breadth`, and `maxResults` parameters, then delegates to `researcher` and `author` in sequence.
- **`researcher`**: drives the research loop. Generates search queries with Claude, calls `web-search` for each query, extracts learnings, and recurses with reduced depth until the result limit is reached.
- **`web-search`**: executes a single Exa search, deduplicates URLs against accumulated sources, and uses Claude to evaluate each result as `relevant` or `irrelevant`.
- **`author`**: takes the full research object and generates a markdown report with `generateText`.

The recursive loop inside `researcher` halves the breadth at each depth level, using follow-up questions extracted from previous learnings to refine the prompt:

```typescript
async function deepResearch(
  prompt: string,
  currentDepth: number,
  currentBreadth: number,
): Promise<void> {
  if (currentDepth === 0 || research.searchResults.length >= inputs.maxResults) {
    return;
  }

  const queries = await generateSearchQueries(prompt, currentBreadth);

  for (const query of queries) {
    const webSearchResult = await webSearchAgent.run({
      query,
      accumulatedSources: research.searchResults,
    });

    research.searchResults.push(...webSearchResult.searchResults);
    research.completedQueries.push(query);

    for (const result of webSearchResult.searchResults) {
      const learning = await extractLearning(query, result);
      research.learnings.push(learning);
    }

    if (research.searchResults.length >= inputs.maxResults) return;
  }

  // Recurse: reduce depth by 1, halve breadth, refine with follow-up questions
  const newBreadth = Math.ceil(currentBreadth / 2);
  if (currentDepth > 1 && newBreadth > 0) {
    const refinedPrompt =
      research.learnings.length > 0
        ? `${prompt}. Follow-up: ${research.learnings.at(-1)!.followUpQuestions.join(', ')}`
        : prompt;

    await deepResearch(refinedPrompt, currentDepth - 1, newBreadth);
  }
}
```

Default parameters: `depth=2`, `breadth=3`, `maxResults=20`. Both depth and breadth are capped at 5.

## Project Structure

```
src/
├── agent/
│   ├── orchestrator/
│   │   ├── agent.ts      # Parameter validation, sequences researcher → author
│   │   └── index.ts
│   ├── researcher/
│   │   ├── agent.ts      # Recursive research loop, query generation, learning extraction
│   │   └── index.ts
│   ├── web-search/
│   │   ├── agent.ts      # Exa search, duplicate detection, LLM relevance evaluation
│   │   └── index.ts
│   └── author/
│       ├── agent.ts      # Markdown report generation from research data
│       └── index.ts
├── api/index.ts           # POST routes for each agent
├── lib/
│   ├── exa.ts             # Exa client wrapper (searchAndContents with livecrawl)
│   ├── prompts.ts         # System, evaluation, and author prompt templates
│   └── types.ts           # Shared types: Research, SearchResult, Learning
└── web/
    ├── App.tsx             # React frontend
    └── ...
```

## Related

- [Calling other agents](https://agentuity.dev/agents/calling-other-agents)
- [Creating agents](https://agentuity.dev/agents/creating-agents)
- [AI SDK integration](https://agentuity.dev/agents/ai-sdk-integration)
- [Schema libraries](https://agentuity.dev/agents/schema-libraries)
- [Agentuity SDK](https://github.com/agentuity/sdk)
