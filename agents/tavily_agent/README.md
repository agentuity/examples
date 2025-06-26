# Tavily Research Agent

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>AI-Powered Hybrid Research Agent</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

## What This Agent Does

The **Tavily Research Agent** is a powerful hybrid research system that combines:

- **Real-time web search** using Tavily's advanced search, extract, and crawl tools
- **Internal vector search** through your company's CRM data 
- **LangGraph ReAct workflow** for intelligent multi-step research
- **Comprehensive responses** with proper citations and sources

Perfect for **business intelligence**, **competitive analysis**, and **research tasks** that need both public web information and internal enterprise knowledge.

## Quick Start Guide

### Step 1: Prerequisites

Before you begin, ensure you have:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Install UV](https://docs.astral.sh/uv/getting-started/installation/))
- **Agentuity CLI**: ([Install Agentuity CLI](https://agentuity.com/))

### Step 2: Get API Keys

#### 1. **Tavily API Key** 
- Go to [Tavily](https://tavily.com)
- Sign up for an account
- Get your API key from the dashboard

### Step 3: Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

This opens a browser for you to log in to your Agentuity account.

### Step 4: Install Dependencies

The project uses UV for dependency management:

```bash
# Install all dependencies automatically
uv sync
```

This installs all required packages including:
- `agentuity` - Agentuity Python SDK
- `langchain` - LangChain framework  
- `langchain-openai` - OpenAI integration
- `langchain-tavily` - Tavily search tools
- `langchain-chroma` - Vector database for CRM data
- `langgraph` - ReAct agent framework

### Step 6: Run in Development Mode

Start the agent in development mode:

```bash
agentuity dev
```

This will:
- Start the agent server on `http://localhost:3500`
- Open the **Agentuity DevMode** in your browser
- Provide a public URL for testing

## How to Use

### Via DevMode (Recommended)

1. After running `agentuity dev`, click the **DevMode URL**
2. In the web interface, type your research question:
   ```
   What's Apple's latest AI strategy?
   ```
3. Hit **Send** and watch the agent work!

### Via API

You can also test via direct API calls:

```bash
curl -X POST http://localhost:3500/agents/tavily_agent \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the latest developments in Microsoft Azure AI services?"}'
```

### Example Research Queries

Try these example queries to see the agent in action:

- **"What's Apple's latest AI strategy?"**
- **"Find recent earnings reports for Microsoft and check our internal notes"**
- **"Research Amazon's cloud revenue growth trends"**
- **"What are Google's recent enterprise AI announcements?"**
- **"Compare Tesla's autonomous driving progress with competitors"**

## How It Works

### Research Workflow

1. **Input Processing**: Accepts natural language research questions
2. **Web Search**: Uses Tavily to find current web information
3. **Internal Search**: Queries CRM vector database for company data
4. **Analysis**: LangGraph ReAct agent processes and synthesizes information
5. **Response**: Returns comprehensive answer with citations

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  User Question  │───▶│  Research Agent  │───▶│  Final Response │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌──────────┐ ┌──────┐ ┌─────────┐
              │ Tavily   │ │ CRM  │ │ LangGraph│
              │ Web      │ │ Vector│ │ ReAct   │
              │ Search   │ │ Store │ │ Agent   │
              └──────────┘ └──────┘ └─────────┘
```

## Project Structure

```
tavily_agent/
├── agentuity-agents/           # Agent implementations
│   └── tavilyAgent/
│       └── agent.py           # Main agent code                 
├── .env                      # Environment variables (create this)
├── pyproject.toml           # Python dependencies
├── agentuity.yaml          # Agentuity configuration
├── server.py               # Server entry point
└── README.md              # This file
```


### Changing the AI Model

To use a different OpenAI model:

```python
# In agent.py, change the model:
model = ChatOpenAI(
    model="gpt-4o-mini",   # or "gpt-3.5-turbo", etc.
    temperature=0
)
```

## Deployment

When ready to deploy to production:

```bash
agentuity deploy
```

This deploys your agent to the Agentuity Cloud, making it accessible via:
- REST API endpoints
- Agentuity Console
- Integration with other services

### Getting Help

If you encounter issues:

1. Check the [Agentuity Documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord Community](https://discord.gg/agentuity)
3. Contact Agentuity support

## Monitoring & Logs

### Development Logs

When running `agentuity dev`, you'll see detailed logs:

```
[INFO] Received text input: What's Apple's latest AI strategy?
[INFO] Processing research request: What's Apple's latest AI strategy?
[INFO] Starting research agent execution...
[INFO] Agent step: HumanMessage
[INFO] Agent step: AIMessage  
[INFO] Research completed successfully
```

### Production Monitoring

Once deployed, monitor your agent through the Agentuity Console:
- Request/response logs
- Performance metrics
- Error tracking
- Usage analytics

## Next Steps

- **Customize the prompts** to match your specific research needs
- **Add more data sources** to the vector store
- **Integrate with your existing systems** via API
- **Deploy to production** for team access

---

## 📖 Additional Resources

- [Agentuity Python SDK Docs](https://agentuity.dev/SDKs/python)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Tavily API Documentation](https://docs.tavily.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Built with ❤️ using Agentuity - Build Agents, Not Infrastructure**
