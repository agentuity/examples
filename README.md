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

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

Examples for building agents with the [Agentuity SDK](https://github.com/agentuity/sdk).

## Examples

### [training/](./training)

Learn Agentuity from basics to advanced. Full-stack examples with React frontends.

| Example | Description |
|---------|-------------|
| [01-hello-world](./training/01-hello-world) | Your first agent |
| [02-weather-agent](./training/02-weather-agent) | External API integration |
| [03-concierge](./training/03-concierge) | Multi-agent orchestration |
| [04-storage-types](./training/04-storage-types) | Key-value, object store, vector search |
| [05-deep-research](./training/05-deep-research) | Complex agent workflows |

### [integrations/](./integrations)

Add Agentuity to your existing frontend app.

| Example | Framework | Description |
|---------|-----------|-------------|
| [nextjs](./integrations/nextjs) | Next.js App Router | API rewrites + useAPI hook |
| [tanstack-start](./integrations/tanstack-start) | TanStack Start | SSR with lazy-loaded components |
| [turborepo](./integrations/turborepo) | Turborepo | Monorepo with shared schemas |

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

For documentation, visit [agentuity.dev](https://agentuity.dev).

## v0 Examples

Looking for v0 SDK examples? Run `git checkout v0`.

## Contributing

Contributions are welcome! If you have an example you'd like to add, please submit a pull request.

## License

See the [LICENSE](LICENSE.md) file for details.
