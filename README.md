<div align="center">
    <img src=".github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Agentuity Examples</strong> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
    
<a href="https://github.com/agentuity/examples"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-Examples-blue"></a>
<a href="https://github.com/agentuity/examples/blob/main/LICENSE.md"><img alt="License" src="https://badgen.now.sh/badge/license/Apache-2.0"></a>
<a href="https://discord.gg/agentuity"><img alt="Join the community on Discord" src="https://img.shields.io/discord/1332974865371758646.svg?style=flat"></a>
</div>
</div>


# Agentuity Examples

Examples for building agents with the [Agentuity SDK](https://github.com/agentuity/sdk).

## Examples

| Folder | Purpose |
|--------|---------|
| `training/` | Learn Agentuity step by step |
| `existing-apps/` | Add Agentuity agents to an existing app (e.g., Next.js, TanStack Start) |
| `integrations/` | Use Agentuity with another library, framework, or SDK |
| `features/` | See what the platform can do |

### [training/](./training)

| Example | Description |
|---------|-------------|
| [01-hello-world](./training/01-hello-world) | Your first agent |
| [02-weather-agent](./training/02-weather-agent) | External API integration |
| [03-concierge](./training/03-concierge) | Multi-agent orchestration |
| [04-storage-types](./training/04-storage-types) | Key-value, object store, vector search |
| [05-deep-research](./training/05-deep-research) | Complex agent workflows |

### [existing-apps/](./existing-apps)

| Example | Framework | Description |
|---------|-----------|-------------|
| [nextjs](./existing-apps/nextjs) | Next.js App Router | Brownfield translate/history + evals with rewrite or baseUrl modes |
| [tanstack-start](./existing-apps/tanstack-start) | TanStack Start | Brownfield translate/history + evals with proxy or baseUrl modes |
| [turborepo](./existing-apps/turborepo) | Turborepo | Monorepo with shared schemas |

### [integrations/](./integrations)

| Integration | Description |
|-------------|-------------|
| [langchain](./integrations/langchain) | Dynamic models/tools, prompts, streaming, structured output |
| [openai](./integrations/openai) | OpenAI Agents SDK handoffs, tool calling, streaming, context |
| [chat-sdk](./integrations/chat-sdk) | Multi-platform chatbot (Slack, Discord) with conversation memory |

### [features/](./features)

| Example | Description |
|---------|-------------|
| [scheduled-digest](./features/scheduled-digest) | Cron jobs + KV storage + durable streams |

## Getting Started

```bash
# Clone this repo
git clone https://github.com/agentuity/examples
cd examples

# Pick an example
cd training/01-hello-world

# Install and run
bun install
bun run dev
```

New to Agentuity? Try the [SDK Explorer](https://agentuity.dev) in the docs to learn key features and services with interactive examples. Or, start with [training/01-hello-world](./training/01-hello-world) for a more structured, course-like walkthrough.

## Contributing

Contributions are welcome! If you have an example you'd like to add, please submit a [pull request](https://github.com/agentuity/examples/pulls).

## License

See the [LICENSE](LICENSE.md) file for details.
