<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🐦 Tweet Analysis Agent

An Agentuity agent that analyzes tweets and provides comprehensive brand monitoring and sentiment analysis using the Agno framework.

## ✨ Features

- Real-time tweet analysis and sentiment classification
- Engagement metrics analysis (likes, retweets, replies)
- Brand health monitoring and competitive intelligence
- Strategic recommendations and response strategies
- Executive-ready intelligence reports

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

You can also start your project in development mode without connecting to the Agentuity Console:

```bash
uv run server.py
```

## 💬 Usage

The agent accepts natural language queries about social media analysis:

- "Analyze sentiment around [brand] on X for the past 10 tweets"
- "Monitor competitor mentions and compare sentiment vs our brand"
- "Generate a brand health report from recent social media activity"

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agentuity_agents/           # Agent definitions and implementations
│   └── TweetAnalysisAgent/     # Tweet analysis agent
│       ├── agent.py            # Agentuity wrapper
│       └── tweet_analysis_agent.py  # Original Agno agent
├── .venv/                      # Virtual environment (created by UV)
├── pyproject.toml              # Project dependencies and metadata
├── server.py                   # Server entry point
└── agentuity.yaml              # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

The agent uses:
- **Agno framework** for agent orchestration
- **XTools** for Twitter/X integration
- **OpenAI gpt-5-mini** for analysis and report generation

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
