# Storage Types

Demonstrates all three Agentuity storage backends in a single agent workflow: Object Storage for binary files, Vector Storage for semantic search, and KV Storage for query history.

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Agentuity CLI](https://agentuity.dev/cli/installation) installed and logged in (`agentuity login`)

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

The `storage-types` agent runs two modes depending on whether the input looks like a file or a query.

**Upload mode** — when the agent receives document content:

1. Writes the raw bytes to Object Storage via Bun's `S3Client`, generating a public URL
2. Splits the document into sections by header and upserts each section into Vector Storage as a separate embedding
3. Returns a structured receipt with bucket key, byte size, and the vector IDs created

**Search mode** — when the agent receives a plain query:

1. Searches Vector Storage for the top matching sections (similarity threshold: 0.5)
2. Appends the query to KV Storage under a running history key with timestamp and result count
3. Passes the top two sections as context to `generateText` (gpt-5-nano) and returns the answer

```typescript
// Upload: write binary to Object Storage
const binaryData = new TextEncoder().encode(textContent);
const file = s3.file(`${OBJECT_STORAGE_BUCKET}/${key}`);
await file.write(binaryData);

// Index each section into Vector Storage
const ids = await ctx.vector.upsert(VECTOR_STORAGE_NAME, {
  key: `${key}-section-${i}`,
  document: sectionContent,
  metadata: { source: key, sectionTitle, content: sectionContent },
});

// Search and retrieve relevant chunks
const searchResults = await ctx.vector.search(VECTOR_STORAGE_NAME, {
  query: textContent,
  limit: 3,
  similarity: 0.5,
});

// Track the query in KV Storage
const existing = await ctx.kv.get(KV_STORAGE_NAME, 'demo-user-queries');
const history = existing.exists ? (existing.data as any[]) : [];
history.push({ query: textContent, timestamp: new Date().toLocaleTimeString() });
await ctx.kv.set(KV_STORAGE_NAME, 'demo-user-queries', JSON.stringify(history, null, 2));
```

The output schema is a union: upload mode returns a structured object with `mode: 'upload'` and storage receipts; search mode returns a plain string answer from the LLM.

## Project Structure

```
src/
├── agent/storage-types/
│   ├── agent.ts      # Upload + search workflow across all three storage backends
│   └── index.ts
├── api/index.ts      # POST /api/hello
└── web/
    ├── App.tsx        # React frontend
    ├── frontend.tsx
    └── index.html
```

## Related

- [KV storage](https://agentuity.dev/services/storage/key-value)
- [Object storage](https://agentuity.dev/services/storage/object)
- [Vector storage](https://agentuity.dev/services/storage/vector)
- [AI SDK integration](https://agentuity.dev/agents/ai-sdk-integration)
- [Agentuity SDK](https://github.com/agentuity/sdk)
