# REMEMBER TO INSTALL ALL DEPENDENCIES IN REQUIREMENTS.TXT

# Agents added from Agno

# This project includes fully functional agents ported from the official Agno examples.
# These agents were ported directly from Agno's official examples and added into the Agentuity framework. Each one was easy to integrate inside Agentuity by just dropping in the files, adding it to `agentuity.yaml`, and running the server. All agents are async and route requests through the Agentuity AI Gateway—no API keys or manual config needed.

## Finance Agent  
Ported from: https://docs.agno.com/examples/agents/finance-agent  
This agent first uses a query parser to understand the user’s request and extract relevant stock tickers and intent, then pulls real-time pricing, fundamentals, analyst ratings, and news from Yahoo! Finance, and finally feeds all of that into GPT-4o to produce a structured, up-to-date market analysis.

## YouTube Agent  
Ported from: https://docs.agno.com/examples/agents/youtube-agent  
This agent fetches YouTube video transcripts, inspects video metadata and structure, generates precise, meaningful timestamps for key segments, groups related content, and leverages GPT-4o to produce comprehensive video breakdowns, summaries, and highlight notes—perfect for content creators, researchers, and viewers.

## Recipe Agent  
Ported from: https://docs.agno.com/examples/agents/recipe-creator  
This agent takes in ingredient lists or recipe preferences, performs a semantic search to find relevant recipes, and uses GPT-4o to generate a fully formatted, easy-to-follow recipe with instructions, ingredients, and cooking tips. It’s ideal for home cooks, meal planners, or anyone looking to create a dish from what they have on hand.

## Movie Agent  
Ported from: https://docs.agno.com/examples/agents/movie-recommender  
This agent takes user preferences (genres, favorite movies, desired themes), performs a semantic search using Exa, and leverages GPT-4o to generate personalized movie recommendations. It returns titles with release dates, genres, ratings, summaries, and more—ideal for film lovers, casual viewers, and anyone planning their next movie night.

## Book Agent  
Ported from: https://docs.agno.com/examples/agents/books-recommender  
This agent takes in favorite books, genres, and reading preferences, uses Exa for a semantic search of literary databases, and calls GPT-4o to deliver personalized book recommendations. Each suggestion includes title, author, rating, plot summary, and content tags—great for avid readers, book clubs, or anyone searching for their next great read.

## Travel Agent  
Ported from: https://docs.agno.com/examples/agents/travel-planner  
This agent takes in a user’s travel goals—like destination, group size, trip type, and budget—and generates a detailed, multi-day itinerary using GPT-4o and Exa. It provides curated accommodation suggestions, activity planning, transportation logistics, and local tips. Ideal for individuals, families, or teams planning anything from vacations to offsites.

## Research Agent
Ported from: https://docs.agno.com/examples/agents/research-agent
This agent combines powerful web search (DuckDuckGo + Newspaper4k) with GPT-4o to produce professional, New York Times-style investigative reports. It performs multi-source research, cross-verifies facts, and delivers polished, objective long-form articles on any topic. Ideal for researchers, journalists, analysts, or anyone who needs in-depth reporting and synthesis.

## Academic Research Agent  
Ported from: https://docs.agno.com/examples/agents/research-agent-exa
This agent is designed for scholarly research and academic reporting. It uses Exa’s academic search tools to find the latest peer-reviewed literature, synthesize insights across disciplines, and produce well-structured, citation-rich reports. It’s ideal for researchers, students, and professionals seeking rigorous academic analysis.

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
