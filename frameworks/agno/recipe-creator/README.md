<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
</div>

# 🍳 Agno Recipe Creator

A recipe-finding agent that demonstrates how to integrate the Agno framework with Agentuity. This agent uses semantic search to find recipes based on available ingredients or cooking preferences.

**Ported from**: https://docs.agno.com/examples/agents/recipe-creator

### How It Works

The agent takes user input about ingredients they have or the type of dish they want to make, uses Exa's semantic search to find relevant recipes, and provides detailed cooking instructions with ingredients lists and helpful tips.

This example demonstrates:
- Agno framework integration with Agentuity
- Semantic search using ExaTools
- Recipe recommendation and cooking guidance
- Preserving original framework functionality within Agentuity's structure

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

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

## 📚 Project Structure

```
├── agents/
│   └── RecipeCreator/
│       ├── recipe_creator.py    # Original Agno agent code
│       └── agent.py            # Agentuity wrapper
├── pyproject.toml              # Project dependencies
├── server.py                   # Server entry point
├── agentuity.yaml             # Agentuity project configuration
└── README.md                  # This file
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
