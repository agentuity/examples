<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" />
        </a>
    <br />
</div>

# Module 7: Deep Research Multi-Agent System (TypeScript)

A sophisticated multi-agent system that conducts comprehensive research on any topic and generates detailed reports. The system uses multiple specialized AI agents working together to search the web, analyze information, and produce high-quality research reports.

**Training Module**: This example demonstrates a sophisticated multi-agent research workflow and report generation system built with TypeScript and the Vercel AI SDK.

## 📚 What You'll Learn

- Multi-agent orchestration with specialized roles
- Iterative research workflows with configurable depth/breadth
- Web search integration with Exa API
- Content evaluation and relevance filtering
- Report synthesis from distributed research findings
- Agent-to-agent communication patterns
- Structured data validation with Zod schemas

## 🏗️ Architecture

The system employs a multi-agent architecture with four specialized agents:

- **🎯 Orchestrator Agent**: Coordinates the entire workflow and manages agent communication
- **🔬 Researcher Agent**: Conducts deep, iterative research with configurable depth and breadth
- **🌐 Web Search Agent**: Performs intelligent web searches with relevance evaluation using the Exa API
- **✍️ Author Agent**: Synthesizes research findings into comprehensive, well-structured reports

## 🛠️ Tech Stack

- **Runtime**: Node.js 22+ with TypeScript
- **AI Framework**: Vercel AI SDK with Anthropic Claude 4 Sonnet
- **Web Search**: Exa API for high-quality web search and content extraction
- **Agent Platform**: Agentuity SDK for agent orchestration and deployment
- **Validation**: Zod for runtime type safety
- **Code Quality**: Biome for linting and formatting
- **Build System**: Agentuity CLI for bundling and deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22 or higher
- **Agentuity CLI**: Install globally with `npm install -g @agentuity/cli`

## 🚀 Getting Started

### 1. Environment Setup

First, copy the environment template and configure your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:

```env
AGENTUITY_SDK_KEY=your_agentuity_sdk_key
AGENTUITY_PROJECT_KEY=your_agentuity_project_key
EXA_API_KEY=your_exa_api_key
```

**Required API Keys:**
- **Agentuity Keys**: Get from the [Agentuity dashboard](https://app.agentuity.com/)
- **Exa API Key**: Sign up at [Exa.ai](https://exa.ai) for web search capabilities

### 2. Install Dependencies

```bash
npm install
```

### 3. Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

### 4. Development Mode

Run the project in development mode:

```bash
npm run dev
```

This will start the development server and open the Agentuity Console where you can test your agents in real-time.

### 5. Testing the System

Send a research request to the orchestrator agent with the following parameters:

```json
{
  "query": "The impact of artificial intelligence on healthcare",
  "depth": 2,
  "breadth": 3
}
```

- **query**: The research topic (required)
- **depth**: How many rounds of follow-up research to conduct (1-5, default: 2)
- **breadth**: How many search queries to generate per round (1-5, default: 3)

## 🌐 Deployment

Deploy your agents to the Agentuity Cloud:

```bash
agentuity deploy
```

## 📁 Project Structure

```
├── src/
│   ├── agents/
│   │   ├── orchestrator/     # Main workflow coordinator
│   │   ├── researcher/       # Deep research logic
│   │   ├── web-search/       # Web search with evaluation
│   │   └── author/           # Report generation
│   └── common/
│       ├── types.ts          # Shared TypeScript types
│       └── prompts.ts        # System prompts
├── .env.example              # Environment variables template
├── agentuity.yaml           # Agentuity project configuration
├── package.json             # Dependencies and scripts
└── biome.json              # Code formatting configuration
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Bundle and start locally
npm run start
```

## 🎯 How It Works

1. **Research Request**: Submit a query with optional depth and breadth parameters
2. **Query Generation**: The researcher generates multiple search queries related to the topic
3. **Web Search**: Each query is processed by the web search agent using Exa API
4. **Relevance Evaluation**: Claude evaluates search results for relevance and quality
5. **Iterative Research**: The system conducts multiple rounds of research, building on previous findings
6. **Report Generation**: The author agent synthesizes all findings into a comprehensive report
7. **Delivery**: The final report is returned in Markdown format

## 📖 Documentation

- [Agentuity JavaScript SDK](https://agentuity.dev/SDKs/javascript)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Exa API Documentation](https://docs.exa.ai)

## 🆘 Support

If you encounter any issues:

1. Check the [Agentuity documentation](https://agentuity.dev)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Review the project logs in development mode

## 📝 License

This project is licensed under the terms specified in the LICENSE file.