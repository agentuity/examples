# Scheduled Digest

A cron-powered agent that fetches content from Hacker News and GitHub, generates an LLM-summarized digest, and publishes it to a permanent shareable URL.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

Three Agentuity platform services working together:

- **Cron Jobs**: A route runs on schedule (`0 * * * *`, every hour) to trigger the digest pipeline
- **KV Storage**: Stores digest metadata (title, summary, stream URL) with 30-day TTL and a history index
- **Durable Streams**: Publishes each HTML digest to a permanent, shareable URL that anyone can access

The cron route fetches content from two sources (Hacker News top stories, GitHub trending repos), passes it to the `digest-generator` agent, and the agent uses an LLM to produce a formatted HTML digest:

```typescript
api.post(
  '/digest',
  cron('0 * * * *', { auth: true }, async (c) => {
    const sourceData = await fetchAllSources();
    const digest = await digestGenerator.run({
      sources: sourceData,
      date: new Date().toISOString(),
    });

    // Publish to a permanent URL
    const stream = await c.var.stream.create('digest', {
      contentType: 'text/html',
      compress: true,
      ttl: null, // permanent
    });
    await stream.write(digest.htmlContent);
    await stream.close();

    // Store metadata in KV for the frontend
    await c.var.kv.set('digests', 'latest', {
      title: digest.title,
      summary: digest.summary,
      streamUrl: stream.url,
      date: new Date().toISOString(),
    });

    return c.text('OK');
  }),
);
```

The frontend shows the latest digest with a "Share" button (copies the durable stream URL), a history list, and a "Run Now" button for manual triggering. Cron schedules don't auto-trigger locally, so use the "Run Now" button or `curl -X POST http://localhost:3500/api/digest/now` during development.

## Project Structure

```
src/
├── agent/digest-generator/
│   ├── agent.ts      # LLM summarization with generateObject
│   └── index.ts
├── api/index.ts      # Cron route + GET endpoints for frontend
├── lib/
│   ├── types.ts      # Shared schemas
│   └── sources.ts    # HN + GitHub fetchers
└── web/
    ├── App.tsx        # Dashboard with digest display + history
    └── ...
```

## Related

- [Cron docs](https://agentuity.dev/routes/cron)
- [KV Storage docs](https://agentuity.dev/services/storage/key-value)
- [Durable Streams docs](https://agentuity.dev/services/storage/durable-streams)
- [Agentuity SDK](https://github.com/agentuity/sdk)
