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

Example implementation (As seen in agent.py):

```python
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):  
    try:  
        if not XAI_API_KEY:  
            context.logger.error("XAI_API_KEY environment variable not set")  
            return response.text("Error: XAI_API_KEY not configured")  
          
        # Get user input from request  
        user_content = await request.data.text() or "Provide me a digest of world news in the last 24 hours."  
        # X.AI API configuration  
        url = "https://api.x.ai/v1/chat/completions"  
        headers = {  
            "Content-Type": "application/json",  
            "Authorization": f"Bearer {XAI_API_KEY}"  
        }  
          
        # Create payload with user input  
        payload = {  
            "messages": [  
                {  
                    "role": "user",  
                    "content": user_content  
                }  
            ],  
            "search_parameters": {  
                "mode": "auto",  
                "return_citations": True  
            },  
            "model": "grok-3-latest"  
        }  
          
        # Send request to X.AI  
        api_response = requests.post(url, headers=headers, json=payload)  
        api_response.raise_for_status()  
          
        result = api_response.json()  
          
        # Extract the response content  
        if 'choices' in result and len(result['choices']) > 0:  
            content = result['choices'][0]['message']['content']  
            return response.text(content)  
        else:  
            return response.text("No response received from X.AI API")  
              
    except Exception as e:  
        context.logger.error(f"Error running X.AI agent: {e}")  
        return response.text("Sorry, there was an error processing your request.")
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
│   └── grokLiveSearch/
│       ├── __init__.py
│       ├── agent.py           # Main agent implementation
├── pyproject.toml            # Dependencies
└── agentuity.yaml           # Agent configuration
```

## 🛠️ Advanced Features

- **Query Processing**: Natural language understanding
- **Result Ranking**: Smart ranking based on relevance
- **Context Awareness**: Understanding search context
- **Custom Filters**: Filter results by various parameters

## 📖 Documentation

- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Grok API Documentation]([https://grok.com/docs](https://docs.x.ai/docs/guides/live-search))

## 🆘 Support

Need help?
1. Check our [documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity)
3. Contact support@agentuity.dev

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
