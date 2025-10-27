<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" />
        </a>
    <br />
</div>

# Module 7: Deep Research Multi-Agent System (Python)

A sophisticated multi-agent system that conducts comprehensive research on any topic and generates detailed reports. The system uses multiple specialized AI agents working together to search the web, analyze information, and produce high-quality research reports.

**Training Module**: This example demonstrates a sophisticated multi-agent research workflow and report generation system built with Python.

## 📚 What You'll Learn

- Multi-agent orchestration with specialized roles
- Iterative research workflows with configurable depth/breadth
- Web search integration with Exa API
- Content evaluation and relevance filtering
- Report synthesis from distributed research findings
- Agent-to-agent communication patterns
- Structured data validation with Python type hints

## 🏗️ Architecture

The system employs a multi-agent architecture with four specialized agents:

- **🎯 Orchestrator Agent**: Coordinates the entire workflow and manages agent communication
- **🔬 Researcher Agent**: Conducts deep, iterative research with configurable depth and breadth
- **🌐 Web Search Agent**: Performs intelligent web searches with relevance evaluation using the Exa API
- **✍️ Author Agent**: Synthesizes research findings into comprehensive, well-structured reports

## 🛠️ Tech Stack

- **Runtime**: Python 3.10+ with UV package manager
- **AI Framework**: Anthropic Python SDK with Claude 4 Sonnet
- **Web Search**: Exa API (exa-py) for high-quality web search and content extraction
- **Agent Platform**: Agentuity Python SDK for agent orchestration and deployment
- **Type Safety**: Python type hints for runtime safety
- **Package Management**: UV for fast, reliable dependency management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher (up to 3.12)
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- **Agentuity CLI**: Install globally with `pip install agentuity-cli` or `npm install -g @agentuity/cli`

## 🚀 Getting Started

### 1. Environment Setup

First, create a `.env` file in the project root with your API keys:

```env
AGENTUITY_SDK_KEY=your_agentuity_sdk_key
AGENTUITY_PROJECT_KEY=your_agentuity_project_key
EXA_API_KEY=your_exa_api_key
```

**Required API Keys:**
- **Agentuity Keys**: Get from the [Agentuity dashboard](https://app.agentuity.com/)
- **Exa API Key**: Sign up at [Exa.ai](https://exa.ai) for web search capabilities

### 2. Install Dependencies

UV will automatically create a virtual environment and install dependencies:

```bash
uv sync
```

### 3. Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

### 4. Development Mode

Run the project in development mode:

```bash
agentuity dev
```

This will start the development server and open the Agentuity Console where you can test your agents in real-time.

You can also run without the console:

```bash
uv run server.py
```

### 5. Testing the System

Send a research request to the orchestrator agent with the following parameters:

```json
{
  "query": "The impact of artificial intelligence on healthcare",
  "depth": 2,
  "breadth": 3,
  "maxResults": 20
}
```

- **query**: The research topic (required)
- **depth**: How many rounds of follow-up research to conduct (1-5, default: 2)
- **breadth**: How many search queries to generate per round (1-5, default: 3)
- **maxResults**: Maximum number of search results per query (default: 20)

## 🌐 Deployment

Deploy your agents to the Agentuity Cloud:

```bash
agentuity deploy
```

## 📁 Project Structure

```
├── agentuity_agents/
│   ├── orchestrator/      # Main workflow coordinator
│   ├── researcher/        # Deep research logic
│   ├── web_search/        # Web search with evaluation
│   └── author/            # Report generation
├── common/
│   └── prompts.py         # Shared system prompts
├── .env                   # Environment variables (create this)
├── agentuity.yaml        # Agentuity project configuration
├── pyproject.toml        # Python dependencies
├── server.py             # Server entry point
└── uv.lock              # Dependency lock file
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

### Agent Naming Convention

This project uses the following agent naming mapping:

| Directory Name | Agent Name (in agentuity.yaml) | Used in context.get_agent() |
|----------------|--------------------------------|----------------------------|
| `agentuity_agents/orchestrator/` | `orchestrator` | `{"name": "orchestrator"}` |
| `agentuity_agents/researcher/` | `researcher` | `{"name": "researcher"}` |
| `agentuity_agents/web_search/` | `web-search` | `{"name": "web-search"}` |
| `agentuity_agents/author/` | `author` | `{"name": "author"}` |

**Note**: The web_search directory uses underscores, but the agent name in the configuration uses hyphens (`web-search`).

## 🎯 How It Works

1. **Research Request**: Submit a query with optional depth and breadth parameters
2. **Query Generation**: The researcher generates multiple search queries related to the topic
3. **Web Search**: Each query is processed by the web search agent using Exa API
4. **Relevance Evaluation**: Claude evaluates search results for relevance and quality
5. **Iterative Research**: The system conducts multiple rounds of research, building on previous findings
6. **Report Generation**: The author agent synthesizes all findings into a comprehensive report
7. **Delivery**: The final report is returned in Markdown format

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

- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Anthropic Python SDK](https://docs.anthropic.com/en/api/client-sdks)
- [Exa API Documentation](https://docs.exa.ai)
- [UV Package Manager](https://docs.astral.sh/uv/)

## 🆘 Support

If you encounter any issues:

1. Check the [Agentuity documentation](https://agentuity.dev)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Review the project logs in development mode

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
