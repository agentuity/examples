# OpenCode Server

Run [OpenCode](https://opencode.ai) as a server in an Agentuity sandbox, then attach from your terminal to start coding with AI.

This project uses Agentuity platform services (sandboxes, KV storage) directly from API routes, without defining any agents. Not every project on Agentuity needs agents: the platform's first-class primitives are available to any route or handler.

## Getting Started

```bash
cp .env.example .env   # add your OPENAI_API_KEY (forwarded to the sandbox)
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the API directly.

## What's Inside

A sandbox with the `opencode:latest` runtime, network access, and port 4096 exposed. The API creates the sandbox, polls for readiness, and stores connection details in KV:

```typescript
const sbx = await sandbox.create({
  runtime: 'opencode:latest',
  command: {
    exec: ['/varty/bin/opencode', 'serve', '--port', '4096', '--hostname', '0.0.0.0'],
    mode: 'interactive',
  },
  network: { enabled: true, port: 4096 },
  resources: { memory: '2Gi', cpu: '1000m' },
  timeout: { idle: '30m' },
  env,
});

const info = await sandbox.get(sbx.id);
// info.url -> public URL for the OpenCode server
```

Once the server is running, attach from your terminal:

```bash
export OPENCODE_SERVER_PASSWORD=<password from UI>
opencode attach <server-url>
```

The frontend provides start/stop controls and displays the server URL, attach command, and password. Server state persists in KV so refreshing the page reconnects to a running instance.

## Project Structure

```
src/
├── api/index.ts      # Sandbox lifecycle: start, status, stop + KV persistence
├── lib/types.ts      # Shared schemas (ServerState, responses)
└── web/
    ├── App.tsx        # Start/stop UI with connection details
    └── ...
```

## Related

- [Sandbox docs](https://agentuity.dev/services/sandbox)
- [OpenCode](https://opencode.ai)
- [Agentuity SDK](https://github.com/agentuity/sdk)
