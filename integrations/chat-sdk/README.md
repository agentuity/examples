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

### Why Agentuity KV for Conversation History?

Chat SDK provides built-in thread state and platform message history, so you might wonder why this example manages history manually with Agentuity KV. Two reasons:

- **Observability.** Every conversation is browsable in the Agentuity dashboard under Key Value Stores, keyed by platform and thread ID. You can inspect what the bot remembers without logging into Discord or Slack. Chat SDK's state adapters don't provide an inspection UI.
- **Context control.** The agent keeps a 20-message sliding window (10 turns) with a 24-hour TTL, keeping the LLM token budget bounded rather than pulling full platform history.

Agentuity's `ctx.thread.state` could handle the multi-turn conversation itself (it even has a built-in sliding window via `push()`), but thread IDs are normally assigned via browser cookies, which webhook-based bots don't have. A custom `ThreadIDProvider` could solve that, but thread state has a 1-hour TTL and isn't browsable in the dashboard. KV gives us longer retention, dashboard visibility, and works with any request source.

### Subscriptions vs. Conversation History

This example has two separate persistence layers, and it's important to understand the difference:

- **Conversation history** (Agentuity KV) is durable. It survives restarts, and you can browse it in the dashboard. This is what the agent uses to "remember" prior messages.
- **Thread subscriptions** (Chat SDK in-memory state) are ephemeral. They control whether the bot *listens* to a thread. With `createMemoryState()`, subscriptions are lost on every restart.

After a restart, the bot still has the conversation history in KV, but it no longer knows which threads it was subscribed to. Users need to @mention the bot again to re-subscribe. For persistent subscriptions, switch to `@chat-adapter/state-redis`.

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
