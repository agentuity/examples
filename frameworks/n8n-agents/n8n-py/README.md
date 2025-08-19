<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🤖 Agentuity Workflow Examples

This project demonstrates how Agentuity can replace complex workflow tools with simple Python agents. It includes three example agents that showcase different use cases and integrations.

## 🎯 Example Agents

### 1. YouTube to Blog Agent (`youtube-to-blog`)

Converts YouTube videos into well-structured blog posts using AI.

**What it does:**

- Extracts video ID from YouTube URLs
- Fetches video transcripts
- Uses OpenAI GPT-4 to convert transcripts into engaging blog posts
- Creates compelling titles, organized content, and summaries

**Setup required:** None - works out of the box!

### 2. Shopify Order SMS Agent (`shopify-order-sms`)

Processes Shopify orders and generates personalized SMS notifications for customers.

**What it does:**

- Receives Shopify webhook data
- Stores order data in Pinecone vector database
- Uses RAG (Retrieval-Augmented Generation) to personalize messages for returning customers
- Generates SMS text with greeting, loyalty recognition, and itemized receipt

**Setup required:**

1. **Pinecone API Key**: Set `PINECONE_API_KEY` environment variable
2. **Shopify Webhooks**: Configure Shopify to send order webhooks to your agent
3. **SMS Outbound**: Connect Agentuity's SMS Outbound IO for actual SMS delivery

### 3. Email Digest Agent (`email_digest`)

Processes incoming emails and generates intelligent daily digests using AI-powered filtering and summarization.

**What it does:**

- Receives emails via Agentuity's Email IO input
- Filters out promotional emails, spam, and automated notifications using AI
- Stores relevant emails in Agentuity's vector database
- Generates comprehensive daily digests with key topics, action items, and summaries
- Can be triggered via cron jobs for automated digest generation
- Supports email output for delivering digests directly to your inbox

**Setup options:**

1. **Email Input**: Configure Agentuity's Email IO to forward emails to your agent
2. **Cron Jobs**: Set up automated digest generation on a schedule (daily, weekly, etc.)
3. **Email Output**: Use Agentuity's Email IO output to receive digests in your email
4. **Custom Output**: Code your own output method using any supported Agentuity IO connector

**Setup required:** None - works out of the box with Email IO!

## 📋 Prerequisites

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

## 🚀 Getting Started

### 1. Authentication

```bash
agentuity login
```

### 2. Environment Setup

For the Shopify SMS agent, set your Pinecone API key:

```bash
agentuity env set PINECONE_API_KEY your_pinecone_api_key_here
```

### 3. Development Mode

Run your project in development mode:

```bash
agentuity dev
```

This opens the Agentuity Console where you can test all three agents:

- **YouTube to Blog**: Paste any YouTube URL and get an instant blog post
- **Shopify SMS**: Send sample Shopify order JSON to see the SMS output
- **Email Digest**: Type "digest" to generate a daily email summary or test with sample email data

## 🌐 Production Setup

### Deploy to Agentuity Cloud

```bash
agentuity deploy
```

### Connect External Services

**For Shopify SMS Agent:**

1. **Shopify Webhooks**: In your Shopify admin, configure order webhooks to point to your deployed agent URL
2. **SMS Outbound**: In the Agentuity Console, add SMS Outbound IO to your agent for actual SMS delivery
3. **Pinecone**: Your API key is automatically available in the production environment

**For Email Digest Agent:**

1. **Email Input**: Configure Email IO to forward emails to your deployed agent
2. **Cron Jobs**: Set up scheduled triggers in the Agentuity Console for automated digest generation
3. **Email Output**: Add Email IO output to send digests directly to your email
4. **Custom Scheduling**: Use external cron services or schedulers to trigger digest generation

## 📚 Project Structure

```
├── agentuity_agents/
│   ├── youtube_to_blog/    # YouTube to blog conversion agent
│   │   └── agent.py
│   ├── shopify_order_sms/  # Shopify order SMS notification agent
│   │   └── agent.py
│   └── email_digest/       # Email digest generation agent
│       └── agent.py
├── references/             # Original workflow references
├── pyproject.toml          # Dependencies (anthropic, pinecone, etc.)
├── server.py              # Server entry point
└── agentuity.yaml         # Project configuration
```

## 💡 How It Works

These agents demonstrate key Agentuity concepts:

- **Simple Python Functions**: No complex frameworks - just `async def run()`
- **Built-in AI Integration**: Direct access to OpenAI and Anthropic models
- **Vector Database**: Pinecone integration for RAG workflows
- **IO Connectors**: Easy webhook handling and SMS sending
- **Environment Management**: Secure API key handling

Compare this to traditional workflow tools that require visual editors, custom nodes, and complex configurations!

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
