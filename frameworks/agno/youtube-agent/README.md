<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🎬 YouTube Content Analyzer Agent

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## 🔗 Agno Framework Integration

This project demonstrates how to seamlessly integrate [Agno's YouTube Agent](https://docs.agno.com/examples/agents/youtube-agent) with Agentuity. The original Agno YouTube agent provides powerful YouTube content analysis capabilities, and Agentuity makes it incredibly easy to deploy and scale in production.

**Ported from:** https://docs.agno.com/examples/agents/youtube-agent

## 🎯 What This Agent Does

This intelligent YouTube content analyzer provides detailed video breakdowns, timestamps, and summaries. Perfect for content creators, researchers, and viewers who efficiently navigate video content.

### Key Features

- **Video Overview**: Analyzes video length, type, and basic metadata
- **Smart Timestamps**: Creates precise, meaningful timestamps for key segments
- **Content Organization**: Groups related segments and identifies main themes
- **Comprehensive Analysis**: Provides detailed summaries and highlight notes

### Example Prompts to Try

- "Analyze this tech review: [video_url]"
- "Get timestamps for this coding tutorial: [video_url]"
- "Break down the key points of this lecture: [video_url]"
- "Summarize the main topics in this documentary: [video_url]"
- "Create a study guide from this educational video: [video_url]"

## 🚀 How It Works

With just a simple wrapper function, you can take the original Agno YouTube agent and deploy it to Agentuity's cloud platform:

```python
from agentuity import AgentRequest, AgentResponse, AgentContext
from agents.YouTubeAgent.youtube_agent import youtube_agent

# Agentuity handler - wraps the original Agno YouTube agent
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get user input from Agentuity
    prompt = await request.data.text()
    
    # Run the original Agno YouTube agent
    raw = await loop.run_in_executor(None, lambda: youtube_agent.run(prompt))
    
    # Return response through Agentuity
    return response.text(output)
```

This integration gives you the best of both worlds: Agno's powerful YouTube analysis framework combined with Agentuity's enterprise-grade deployment, monitoring, and scaling capabilities.

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

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode, allowing you to test and debug your agent in real-time.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agents/
│   └── YouTubeAgent/
│       ├── agent.py           # Agentuity wrapper
│       ├── youtube_agent.py   # Original Agno agent (preserved)
│       └── __init__.py
├── .venv/                     # Virtual environment (created by UV)
├── pyproject.toml             # Project dependencies and metadata
├── server.py                  # Server entry point
└── agentuity.yaml            # Agentuity project configuration
```

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
