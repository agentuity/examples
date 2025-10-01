<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# Agno Research Agent

A professional research agent that combines powerful web search (DuckDuckGo) with article extraction (Newspaper4k) to produce comprehensive, New York Times-style investigative reports on any topic.

**Ported from:** https://docs.agno.com/examples/use-cases/agents/research-agent

## Features

- 📰 Professional investigative journalism
- 🔍 Multi-source web search via DuckDuckGo
- 📄 Article extraction and analysis via Newspaper4k
- ✍️ NYT-style structured reporting
- 📊 Fact-checking and source verification
- 🌐 Balanced, objective analysis

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

## 🚀 Getting Started

### Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### Creating a New Agent

To create a new agent in your project:

```bash
agentuity agent new
```

Follow the interactive prompts to configure your agent.

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your agent to the Agentuity Console in DevMode, allowing you to test and debug your agent in real-time.

### Testing the Agent

Test the welcome endpoint:

```bash
curl http://localhost:3500/welcome
```

Example prompts to try:
- "Research the latest developments in quantum computing"
- "Investigate the impact of AI on healthcare delivery"
- "Analyze recent climate change policy changes globally"
- "Report on the latest breakthroughs in renewable energy"

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agentuity_agents/ResearchAgent/  # Agent implementation
│   ├── agent.py                     # Agentuity wrapper
│   └── research_agent.py            # Agno agent configuration
├── .venv/                           # Virtual environment (created by UV)
├── pyproject.toml                   # Project dependencies and metadata
├── server.py                        # Server entry point
└── agentuity.yaml                   # Agentuity project configuration
```

## How It Works

The agent uses the Agno framework to:
1. **Research Phase**: Search for 10+ authoritative sources using DuckDuckGo
2. **Analysis Phase**: Extract and verify critical information from articles
3. **Writing Phase**: Craft compelling, well-structured reports
4. **Quality Control**: Verify facts and ensure balanced reporting

The agent is powered by GPT-4o-mini and routes all API calls through Agentuity's AI Gateway automatically.

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🛠️ Advanced Usage

### Environment Variables

You can set environment variables for your project:

```bash
agentuity env set KEY VALUE
```

### Secrets Management

For sensitive information, use secrets:

```bash
agentuity env set --secret KEY VALUE
```

## 📖 Documentation

For comprehensive documentation on the Agentuity Python SDK, visit:
[https://agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
