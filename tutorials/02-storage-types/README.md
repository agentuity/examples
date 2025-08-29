<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Documentation Storage Agent</strong> <br/>
    <strong>Tutorial 2: Working with Storage Types</strong> <br/>
<br />
</div>

# Documentation Storage Agent

Learn how to use Agentuity's three storage types by building a documentation agent that can store, search, and retrieve information. This tutorial demonstrates Key-Value storage, Vector storage for semantic search, and Object storage for files.

## What You'll Learn

- Using Key-Value storage for simple data and query history
- Implementing Vector storage for semantic search capabilities
- Working with Object storage for file uploads and retrieval
- Building a documentation search agent with AI-powered responses
- Combining multiple storage types in a single agent

## Tech Stack

- **Runtime**: Bun with TypeScript
- **AI Provider**: Agentuity AI Gateway (no API key needed!)
- **Storage**: Agentuity's built-in KV, Vector, and Object storage
- **Agent Platform**: Agentuity SDK
- **Code Quality**: Biome for linting and formatting

## Prerequisites

Before you begin, ensure you have:

- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install globally with `npm install -g @agentuity/cli`

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

### 3. Deploy Your Agent

Deploy the agent to Agentuity cloud:

```bash
agentuity deploy
```

This makes your agent available with persistent storage capabilities.

### 4. Development Mode

Run the agent in development mode for testing:

```bash
agentuity dev
```

This will start your agent and provide a link to the Agentuity Console where you can test it.

### 5. Testing Your Agent

To start using the agent:

1. **Upload the documentation**: In the DevMode UI, upload the `llms.txt` file (included in the project) as an attachment. The agent will process and store it in object storage.

2. **Search documentation**: After uploading, ask questions like:
   - "What is Agentuity?"
   - "What is the AI gateway?"
   - "Are there any blogs covering agent to agent communication?"

3. **Upload more content**: You can upload additional text files to expand the knowledge base

4. **View query history**: All your queries are tracked in KV storage

## Storage Types Explained

### Key-Value Storage
- **Purpose**: Store simple data like user preferences, query history, counters
- **Example**: Tracking user query history
```typescript
await ctx.storage.kv(KV_STORAGE_NAME).set('query_123', {
  query: userQuery,
  timestamp: new Date().toISOString()
});
```

### Vector Storage
- **Purpose**: Enable semantic search across text documents
- **Example**: Storing document chunks for similarity search
```typescript
await ctx.storage.vector(VECTOR_STORAGE_NAME).upsert([{
  id: 'chunk_1',
  content: 'Document text here',
  metadata: { source: 'llms.txt' }
}]);
```

### Object Storage
- **Purpose**: Store files and binary data
- **Example**: Storing uploaded documents
```typescript
await ctx.storage.object(OBJECT_STORAGE_BUCKET).set(
  'docs/llms.txt',
  binaryData
);
```

## Project Structure

```
├── src/
│   └── agents/
│       └── docs-agent/
│           └── index.ts        # Main agent logic with storage
├── llms.txt                   # Sample documentation file
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── biome.json                 # Code formatting rules
└── agentuity.yaml             # Agent configuration
```

## How It Works

1. **File Upload**: When you upload llms.txt (or any text file), the agent detects it's a file
2. **Document Processing**: 
   - Stores full document in Object storage
   - Chunks document for Vector storage
   - Updates metadata in KV storage
3. **Query Processing**:
   - Searches Vector storage for relevant chunks
   - Uses AI to generate contextual responses
   - Stores query history in KV storage
4. **Response Generation**: Returns AI-powered answers based on stored documentation

## AI Gateway

This agent uses Agentuity's built-in AI Gateway, which provides:
- Access to multiple AI models (OpenAI, Anthropic, etc.)
- No API key management required
- Automatic rate limiting and error handling
- Cost tracking and optimization

Learn more about the [AI Gateway](https://agentuity.dev/Guides/ai-gateway)

## Deployment

Your agent is already deployed! The `agentuity deploy` command in step 3 deployed your agent with persistent storage.

To redeploy after making changes:

```bash
agentuity deploy
```

## Next Steps

- Add support for multiple file formats (PDF, Markdown, etc.)
- Implement document versioning
- Add user-specific storage contexts
- Build a document categorization system
- Explore the [03-cron-demo](../03-cron-demo/) tutorial to learn about scheduled agents

## Resources

- [Video Tutorial](https://www.youtube.com/playlist?list=PLnOYEHNTwKeOA0OKAphsqRfUEQuACOPA3)
- [Agentuity Documentation](https://agentuity.dev)
- [JavaScript SDK Reference](https://agentuity.dev/SDKs/javascript)
- [Storage Documentation](https://agentuity.dev/SDKs/javascript#storage)
- [AI Gateway Guide](https://agentuity.dev/Guides/ai-gateway)
- [Join our Discord](https://discord.gg/agentuity)