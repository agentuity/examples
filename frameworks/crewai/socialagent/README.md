# 🧠 CrewAI Social Agent

This project is adapted from [MxMnr/crew-ai-simple-social-template](https://github.com/MxMnr/crew-ai-simple-social-template) and restructured to work with [Agentuity](https://agentuity.com).

The **CrewAI Social Agent** is a multi-agent app that takes a topic and generates LinkedIn-ready social media content. It uses a structured CrewAI workflow with three roles: researcher, writer, and editor.

## What It Does

- Takes in a user-defined topic (e.g., "Why small teams outperform incumbents")
- Searches for relevant articles using web tools
- Summarizes insights and extracts key quotes
- Generates polished LinkedIn posts in a consistent format
- Each run includes:
  - A few complete LinkedIn posts
  - A summary of each article
  - Reference links

## 🔧 Requirements

To run this agent, you’ll need:

- Python 3.10+
- [Agentuity CLI](https://agentuity.dev/Introduction/getting-started)
- API Key from [Serper.dev](https://serper.dev/) (used for Google Search)
- The following Python packages installed:
  - `crewai`
  - `crewai-tools`
  - `python-dotenv`

You can install them manually with:
```bash
pip install crewai crewai-tools python-dotenv
```

## 🔑 Environment Setup

In your `.env` file in the project root and add your Serper API key:

```
SERPER_API_KEY=your-key-here
```

## 🚀 Run the Agent

agentuity dev

When prompted in the UI, enter a topic like:

"How small teams out-execute large incumbents"

The agent will output a markdown file in the `outputs/` directory with everything you need.

To make your agent available in the cloud, use:

agentuity deploy


<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🤖 Python Agent Project

Welcome to your Agentuity Python Agent project! This README provides essential information to help you get started with developing, testing, and deploying your AI agents.

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

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode, allowing you to test and debug your agent in real-time.

You can also start your project in development mode without connecting to the Agentuity Console:

```bash
uv run server.py
```

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
