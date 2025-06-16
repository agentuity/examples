<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🧠 Mem0 Demo Agent - Best Buy Electronics Assistant

Welcome to the Mem0 Demo Agent! This intelligent assistant demonstrates the power of **persistent memory** in AI agents by acting as a personalized Best Buy electronics expert that remembers your preferences across conversations.

## 🎯 What This Agent Does

This agent is a **Best Buy customer service assistant** that:

- 🛍️ **Provides personalized product recommendations** for laptops, TVs, and phones
- 🧠 **Remembers your preferences** using Mem0's memory capabilities
- 💰 **Considers your budget** and specific use cases
- 🔍 **Explains WHY** each product fits your needs
- 📊 **Compares products** with detailed pros and cons
- 💬 **Maintains conversation context** across multiple interactions

### Key Features:
- **Persistent Memory**: Remembers your past conversations, preferences, and requirements
- **Product Database**: Access to curated electronics with detailed specs and pricing
- **Smart Recommendations**: AI-powered suggestions based on your specific needs
- **Budget-Aware**: Finds options within your price range
- **Use Case Matching**: Matches products to your intended use (gaming, work, student, etc.)

## 🧠 How Memory Works

The agent uses **Mem0** to create a persistent memory layer that:

1. **Stores Conversations**: Every interaction is saved for future reference
2. **Learns Preferences**: Remembers your budget ranges, brand preferences, and use cases
3. **Provides Context**: Uses past conversations to give better recommendations
4. **Personalizes Experience**: Tailors responses based on your history

Example memory scenarios:
- "I remember you mentioned you're a college student with a $800 budget"
- "Based on our previous conversation about gaming, here are some updated options"
- "You preferred laptops with good battery life last time, so I've prioritized that"

## 📋 Prerequisites

Before you begin, ensure you have:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- **OpenAI API Key**: For AI responses
- **Mem0 API Key**: For memory functionality

## 🚀 Getting Started

### 1. Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### 2. Set Up Environment Variables

Create a `.env` file with your API keys:
```bash
# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
MEM0_API_KEY=your_mem0_api_key_here

# Optional: Customize the user ID for memory storage
USER_ID=mem0-demo-agent
```

Or set them using Agentuity:
```bash
agentuity env set --secret OPENAI_API_KEY your_openai_api_key
agentuity env set --secret MEM0_API_KEY your_mem0_api_key
```

### 3. Install Dependencies
```bash
uv sync
```

### 4. Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode, allowing you to test and debug your agent in real-time.

You can also start your project in development mode without connecting to the Agentuity Console:

```bash
uv run server.py
```

Test the agent with sample prompts like:
- "I need a laptop for college under $800"
- "What's the best TV for gaming?"
- "Recommend a phone with great camera under $700"

### 5. Creating Additional Agents

To create a new agent in your project:

```bash
agentuity agent new
```

Follow the interactive prompts to configure your agent.

## 🛍️ Available Products

The agent has knowledge of current Best Buy inventory:

### 💻 Laptops
- **MacBook Air M3** ($1,099) - Premium, lightweight, excellent battery
- **Dell XPS 13** ($899) - Business-focused, compact design
- **ASUS ROG Strix G15** ($1,299) - Gaming powerhouse with RTX 4060
- **HP Pavilion 15** ($549) - Budget-friendly for basic tasks

### 📺 TVs
- **Sony BRAVIA XR A95L OLED** ($2,499) - Premium OLED with perfect blacks
- **Samsung QN90C Neo QLED** ($1,799) - Bright display, great for gaming
- **LG C3 OLED** ($1,499) - Excellent gaming TV with 120Hz
- **TCL 6-Series** ($699) - Budget 4K with good value

### 📱 Phones
- **iPhone 15 Pro** ($999) - Premium with excellent cameras
- **Samsung Galaxy S24** ($799) - Android flagship with AI features
- **Google Pixel 8** ($699) - Best Android cameras, clean software
- **iPhone SE** ($429) - Affordable iPhone option

## 💬 Example Conversations

**First Interaction:**
```
User: "I need a laptop for college under $800"
Agent: "Great! For college under $800, I'd recommend the Dell XPS 13 at $899 (slightly over) or HP Pavilion 15 at $549. What's your major? Are you doing any specific tasks like coding, design, or just general coursework?"
```

**Follow-up Conversation (with memory):**
```
User: "What about gaming laptops?"
Agent: "I remember you mentioned you're a college student with an $800 budget. For gaming, the HP Pavilion 15 won't handle modern games well. You might want to consider stretching to the ASUS ROG Strix G15 at $1,299 - it has an RTX 4060 perfect for gaming. Would you like me to find some alternatives in your original budget range?"
```

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

The agent will be available via API endpoints and can be integrated into:
- Web applications
- Mobile apps
- Customer service platforms
- E-commerce sites

## 📚 Project Structure

```
├── agentuity-agents/
│   └── mem0DemoAgent/
│       ├── __init__.py
│       └── agent.py          # Main agent with memory integration
├── .venv/                    # Virtual environment (created by UV)
├── .env                      # API keys (create this)
├── pyproject.toml           # Dependencies (agentuity, openai, mem0ai)
├── agentuity.yaml          # Agentuity project configuration
└── server.py               # Development server
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

### Memory Settings
The agent uses a consistent `USER_ID` for memory storage. You can customize this in the code or environment variables.

### Product Database
Products are stored in `PRODUCT_DATABASE` with:
- Detailed specifications
- Use case categories
- Pros and cons
- Price information

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

### Memory Features

#### Memory Search
The agent searches previous conversations for relevant context:
```python
relevant_memories = memory_client.search(user_question, user_id=user_id)
```

#### Product Filtering
Smart product matching based on:
- Budget constraints
- Use case requirements
- Category preferences
- Feature priorities

#### Conversation Continuity
Each interaction is stored for future reference:
```python
memory_client.add(messages=new_interaction, user_id=user_id)
```

## 📖 Documentation

For comprehensive documentation:
- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Mem0 Documentation](https://docs.mem0.ai/)
- [OpenAI API Reference](https://platform.openai.com/docs)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [Agentuity documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Visit [Mem0 Discord](https://discord.gg/mem0ai) for memory-specific questions
4. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
