<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# Web Extraction Agent

An intelligent web scraper that extracts comprehensive, structured information from any webpage using Agno and Firecrawl.

## Overview

This agent demonstrates how to build an intelligent web scraper that can extract comprehensive, structured information from any webpage. Using OpenAI's GPT-4 model and the Firecrawl tool, it transforms raw web content into organized, actionable data.

## Key Capabilities

- **Page Metadata Extraction**: Captures title, description, and key features
- **Content Section Parsing**: Identifies and extracts main content with headings  
- **Link Discovery**: Finds important related pages and resources
- **Contact Information**: Locates contact details when available
- **Contextual Metadata**: Gathers additional site information for context

## Use Cases

- **Research & Analysis**: Quickly gather information from multiple web sources
- **Competitive Intelligence**: Monitor competitor websites and features
- **Content Monitoring**: Track changes and updates on specific pages
- **Knowledge Base Building**: Extract structured data for documentation
- **Data Collection**: Gather information for market research or analysis

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

This will start your project and open a new browser window connecting your agent to the Agentuity Console in DevMode, allowing you to test and debug your agent in real-time.

You can also start your project in development mode without connecting to the Agentuity Console:

```bash
uv run server.py
```

## Example Usage

The agent accepts URLs and natural language requests:

- "Extract information from https://www.agno.com"
- "Analyze the content and structure of https://docs.agno.com"
- "Get detailed information from https://github.com/agno-agi/agno"

## Output Format

The agent outputs structured data in a clean, organized format that makes web content easily digestible and actionable. It's particularly useful when you need to process large amounts of web content quickly and consistently.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agentuity_agents/WebExtractionAgent/  # Agent implementation
│   ├── web_extraction_agent.py          # Original Agno agent with Firecrawl tools
│   └── agent.py                         # Agentuity wrapper for async execution
├── .venv/                               # Virtual environment (created by UV)
├── pyproject.toml                       # Project dependencies and metadata
├── server.py                            # Server entry point
├── main.py                              # Simple standalone entry point
└── agentuity.yaml                       # Agentuity project configuration
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
