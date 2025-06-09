<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🔍 Grok Live Search Agent

Welcome to the Grok Live Search Agent! This agent provides real-time search capabilities powered by Grok's advanced AI technology, seamlessly integrated with Agentuity's deployment platform.

## 🎯 What This Agent Does

The Grok Live Search Agent enables:
- Real-time search across your data using Grok's powerful search capabilities
- Natural language understanding for better search results
- Context-aware searching that understands user intent
- Intelligent ranking and sorting of search results

## 🔗 How It Works

The agent processes search queries by:
1. Receiving user input through Agentuity's interface
2. Processing the query using Grok's advanced search capabilities
3. Returning relevant, ranked results in real-time

Example implementation:

```python
from agentuity import AgentRequest, AgentResponse, AgentContext
from grok_search import GrokSearchClient  # You'll need to implement this

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the search query
    search_query = await request.data.text()
    
    # Log the search request
    context.logger.info(f"Processing search query: {search_query}")
    
    # Initialize Grok search client
    grok_client = GrokSearchClient()
    
    # Perform the search
    search_results = await grok_client.search(search_query)
    
    # Return formatted results
    return response.json({
        "status": "success",
        "query": search_query,
        "results": search_results
    })
```

## 📋 Prerequisites

Before you begin, ensure you have:
- Python 3.10 or higher
- UV 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- Grok API access and credentials
- Agentuity account and CLI

## 🚀 Getting Started

1. **Authentication**
   ```bash
   agentuity login
   ```

2. **Configure Grok Credentials**
   ```bash
   agentuity env set --secret GROK_API_KEY your_api_key
   ```

3. **Development Mode**
   ```bash
   agentuity dev
   ```

## 📚 Project Structure

```
├── agents/
│   └── GrokSearch/
│       ├── __init__.py
│       ├── agent.py           # Main agent implementation
│       └── grok_client.py     # Grok API integration
├── tests/                     # Test cases
├── pyproject.toml            # Dependencies
└── agentuity.yaml           # Agent configuration
```

## 🔧 Configuration

In your `agentuity.yaml`, configure:
```yaml
agents:
  GrokSearch:
    settings:
      search_limit: 10
      include_metadata: true
      response_format: "detailed"
```

## 🛠️ Advanced Features

- **Query Processing**: Natural language understanding
- **Result Ranking**: Smart ranking based on relevance
- **Context Awareness**: Understanding search context
- **Custom Filters**: Filter results by various parameters

## 📖 Documentation

- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Grok API Documentation](https://grok.com/docs)

## 🆘 Support

Need help?
1. Check our [documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity)
3. Contact support@agentuity.dev

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
