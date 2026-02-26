# Chat SDK + Agentuity

A multi-platform AI chatbot with conversation memory, using Vercel's [Chat SDK](https://chat-sdk.dev) with Agentuity agents. Handles Slack and Discord from a single codebase.

> Looking for detailed setup instructions? See [SETUP.md](./SETUP.md).

## Quick Start

```bash
bun install
cp .env.example .env
# Edit .env with your platform credentials
bun run dev
```

## How It Works

When a user @mentions the bot, Chat SDK receives the webhook, verifies the platform signature, and normalizes the event into a unified message format. 

The Agentuity agent loads conversation history from KV storage (keyed by thread ID), calls Claude (Haiku 4.5) via the AI Gateway, and saves the updated history with a sliding window and 24-hour TTL. 

Finally, Chat SDK posts the response back to the originating platform. As a result, one `handleMessage` function serves *both* Slack and Discord.

## Architecture

```
chat-sdk/
├── app.ts                    # Agentuity app + Discord Gateway setup
├── src/
│   ├── agent/chat/
│   │   ├── index.ts          # Module entry (re-exports agent)
│   │   └── agent.ts          # AI chat agent with conversation memory
│   ├── lib/
│   │   └── bot.tsx           # Chat SDK setup (adapters + handlers)
│   └── api/
│       └── index.ts          # Webhook routes + health check
├── agentuity.json
└── package.json
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build the project |
| `bun run deploy` | Deploy to Agentuity cloud |
| `bun run typecheck` | Run TypeScript type checking |

## Platform Setup

You only need to configure the platforms you want to use: set the environment variables for a platform to enable its adapter. See [SETUP.md](./SETUP.md) for step-by-step instructions.

**Slack:** `SLACK_BOT_TOKEN` + `SLACK_SIGNING_SECRET`

**Discord:** `DISCORD_BOT_TOKEN` + `DISCORD_PUBLIC_KEY` + `DISCORD_APPLICATION_ID`

Chat SDK also supports [GitHub, Teams, Google Chat, and Linear](https://chat-sdk.dev/docs/adapters) adapters.

## Related

- [Chat SDK Documentation](https://chat-sdk.dev/docs)
- [Agentuity Documentation](https://agentuity.dev) — [AI Gateway](https://agentuity.dev/agents/ai-gateway), [KV Storage](https://agentuity.dev/agents/storage/keyvalue)
- [More Agentuity examples](https://agentuity.dev/cookbook)
