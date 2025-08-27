<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
</div>

# 🧙‍♂️ Mastra System Prompt Example

A Harry Potter character agent that demonstrates dynamic system prompt usage with the Mastra framework and Agentuity. This example shows how to change an agent's personality and behavior based on user input by modifying the system prompt.

### How It Works

The agent analyzes the user's input to detect which Harry Potter character they want to interact with. Based on keywords in the request, it dynamically sets the appropriate system prompt and character name:

- **Harry Potter**: The brave, loyal protagonist with his characteristic courage and occasional impulsiveness
- **Hermione Granger**: The brilliant, logical witch who values knowledge and rules
- **Ron Weasley**: The loyal best friend with humor and occasional insecurity
- **Albus Dumbledore**: The wise headmaster who speaks with wisdom and gentle riddles

If no specific character is mentioned, the agent defaults to Harry Potter's personality.

This example demonstrates:
- Dynamic system prompt modification based on user input
- Character-specific personality traits and speaking styles
- How the same Mastra Agent can embody different personas
- Integration with Agentuity's logging and error handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: Version 1.2.4 or higher
- **OpenAI API Key**: Set as `OPENAI_API_KEY` environment variable

## 🚀 Getting Started

### Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### Environment Setup

Set your OpenAI API key:

```bash
agentuity env set OPENAI_API_KEY your-api-key-here
```

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode, allowing you to test different character interactions in real-time.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── src/
│   └── agents/
│       └── HarryPotterAgent/
│           └── index.ts        # Main agent implementation
├── package.json                # Project dependencies and scripts
└── agentuity.yaml             # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🎭 Character Examples

Try these example prompts to interact with different characters:

- "Talk to me as Harry Potter about Quidditch"
- "I want to speak with Hermione Granger about spells"
- "Can I talk to Professor Dumbledore about wisdom?"
- "Let me chat with Ron Weasley about his family"

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

For comprehensive documentation on the Agentuity JavaScript SDK, visit:
[https://agentuity.dev/SDKs/javascript](https://agentuity.dev/SDKs/javascript)

For Mastra framework documentation, visit:
[https://mastra.ai](https://mastra.ai)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/javascript)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
