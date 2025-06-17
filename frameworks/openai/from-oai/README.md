<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
</div>

# 🤖 Python Agent Project

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## 🔗 OpenAI Agent Framework Integration

This project demonstrates how to seamlessly integrate [OpenAI's Agent SDK](https://openai.github.io/openai-agents-python/) with Agentuity. The OpenAI Agent Framework provides powerful tools for building AI agents, and Agentuity makes it incredibly easy to deploy and scale them in production.

With just a simple wrapper function, you can take any OpenAI Agent Framework workflow and deploy it to Agentuity's cloud platform:

```python
from agentuity import AgentRequest, AgentResponse, AgentContext
from agents import Agent, Runner

# Define your OpenAI agents
math_tutor = Agent(
    name="Math Tutor",
    instructions="You help students with math problems step by step."
)

# Agentuity handler - wraps your OpenAI Agent workflow
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get user input from Agentuity
    user_question = await request.data.text()
    
    # Run your OpenAI Agent
    result = await Runner.run(math_tutor, user_question)
    
    # Return response through Agentuity
    return response.text(str(result.final_output))
```

This integration gives you the best of both worlds: OpenAI's powerful agent framework combined with Agentuity's enterprise-grade deployment, monitoring, and scaling capabilities.

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
├── agents/             # Agent definitions and implementations
├── .venv/              # Virtual environment (created by UV)
├── pyproject.toml      # Project dependencies and metadata
├── server.py           # Server entry point
└── agentuity.yaml      # Agentuity project configuration
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
