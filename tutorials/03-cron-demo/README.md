<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Scheduled News Digest Agent</strong> <br/>
    <strong>Tutorial 3: Cron Jobs and Scheduled Agents</strong> <br/>
<br />
</div>

# Scheduled News Digest Agent

Learn how to create agents that run on a schedule using Agentuity's cron functionality. This tutorial builds an AI-powered news digest agent that fetches top stories from Hacker News every 5 minutes and generates summaries.

## What You'll Learn

- Setting up cron-based scheduling for agents
- Fetching data from external APIs (Hacker News)
- Generating AI-powered summaries with the AI Gateway
- Storing and retrieving digest data using KV storage
- Building autonomous agents that run without user interaction

## Tech Stack

- **Runtime**: Bun with TypeScript
- **AI Provider**: Agentuity AI Gateway (no API key needed!)
- **Data Source**: Hacker News API
- **Storage**: Agentuity's Key-Value storage
- **Agent Platform**: Agentuity SDK with cron scheduling
- **Code Quality**: Biome for linting and formatting

## Prerequisites

Before you begin, ensure you have:

- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install globally with `npm install -g @agentuity/cli`

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

### 3. Deploy Your Agent

Deploy the agent to Agentuity cloud:

```bash
agentuity deploy
```

After deployment, configure the cron schedule in the Agentuity UI to run every 5 minutes. The agent will then automatically execute on schedule in the cloud.

### 4. Development Mode

Run the agent in development mode for testing:

```bash
agentuity dev
```

This will start your agent and open the Agentuity Console where you can:
- Manually trigger the agent with "test fetch"
- View stored digests with "show digest"

### 5. Testing Your Agent

The agent provides two test commands in the console:

- **"test fetch"**: Manually triggers a news fetch and summary generation
- **"show digest"**: Retrieves and displays the latest stored digest

The cron schedule (every 5 minutes) only runs in the deployed cloud environment, not in dev mode.

## Cron Configuration

After deploying your agent, configure the cron schedule in the Agentuity UI:

1. Go to your agent in the Agentuity Console
2. Set the cron expression to `*/5 * * * *` for every 5 minutes
3. Save the configuration

**Cron Expression Format**: `minute hour day month weekday`
- `*/5 * * * *` = Every 5 minutes
- `0 */1 * * *` = Every hour
- `0 9 * * 1-5` = 9 AM on weekdays
- `0 0 * * 0` = Midnight on Sundays

## How It Works

1. **Scheduled Execution**: Agent automatically runs based on cron schedule
2. **Data Fetching**: Retrieves top 5 stories from Hacker News API
3. **AI Summarization**: Uses AI Gateway to generate concise summaries
4. **Storage**: Saves digest to KV storage with timestamp
5. **Manual Access**: Users can retrieve digests on demand

## Project Structure

```
├── src/
│   └── agents/
│       └── my-scheduled-agent/
│           └── index.ts        # Agent logic with cron handling
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── biome.json                 # Code formatting rules
└── agentuity.yaml             # Agent configuration
```

## AI Gateway

This agent uses Agentuity's built-in AI Gateway, which provides:
- Access to multiple AI models (OpenAI, Anthropic, etc.)
- No API key management required
- Automatic rate limiting and error handling
- Cost tracking and optimization

Learn more about the [AI Gateway](https://agentuity.dev/Guides/ai-gateway)

## Monitoring Your Agent

After deployment, you can monitor your scheduled agent:

1. Check the Agentuity Console for execution logs
2. View stored digests to confirm successful runs
3. Monitor the agent's health and execution history

## Deployment

Your agent is deployed! Remember to configure the cron schedule in the Agentuity UI after deployment.

To redeploy after making changes:

```bash
agentuity deploy
```

## Next Steps

- Modify the cron schedule for different intervals
- Add email or webhook notifications for new digests
- Fetch from multiple news sources
- Implement digest categorization and filtering
- Add user preferences for topic selection

## Resources

- [Video Tutorial](https://www.youtube.com/playlist?list=PLnOYEHNTwKeOA0OKAphsqRfUEQuACOPA3)
- [Agentuity Documentation](https://agentuity.dev)
- [JavaScript SDK Reference](https://agentuity.dev/SDKs/javascript)
- [Cron Expression Guide](https://crontab.guru/)
- [AI Gateway Guide](https://agentuity.dev/Guides/ai-gateway)
- [Join our Discord](https://discord.gg/agentuity)