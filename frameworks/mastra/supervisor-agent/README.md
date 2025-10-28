<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🤖 Mastra Supervisor Agent

This is a Mastra supervisor agent example that demonstrates a multi-agent system where a publisher agent supervises a copywriter and editor to create polished blog posts. The publisher coordinates the workflow: first calling the copywriter to draft content, then the editor to refine it.

## Overview

This example showcases the supervisor pattern in Mastra, featuring:

- **Copywriter Agent**: Writes initial blog post content based on a given topic
- **Editor Agent**: Refines and edits the content for quality and readability
- **Publisher Agent (Supervisor)**: Coordinates the entire workflow by calling the copywriter first, then the editor

The supervisor agent demonstrates how to build complex multi-agent systems where one agent orchestrates the work of specialized sub-agents.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install with `npm install -g @agentuity/cli`

## 🔑 Required Dependencies

This example uses the following key dependencies:

- `@mastra/core`: Multi-agent orchestration framework
- `@ai-sdk/openai`: OpenAI model provider for AI SDK
- `zod`: Schema validation for tool inputs/outputs
- `@agentuity/sdk`: Agentuity platform integration

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

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agents/             # Agent definitions and implementations
├── node_modules/       # Dependencies
├── package.json        # Project dependencies and scripts
└── agentuity.yaml      # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🛠️ Advanced Usage

### Environment Variables

This example requires access to OpenAI models through the Agentuity AI Gateway. When running locally with `agentuity dev`, the platform handles API keys automatically. No additional environment variables are needed for local development.

For production deployments, the Agentuity platform manages all API credentials securely through the AI Gateway.

### Example Usage

Once running, you can test the supervisor agent with prompts like:

- "Write a blog post about React JavaScript frameworks"
- "Create a blog post about artificial intelligence and machine learning"
- "Write a blog post about sustainable energy solutions"

The publisher agent will coordinate the copywriter to draft content and the editor to refine it, returning the final polished blog post.

## 📖 Documentation

For comprehensive documentation on the Agentuity JavaScript SDK, visit:
[https://agentuity.dev/SDKs/javascript](https://agentuity.dev/SDKs/javascript)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/javascript)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
