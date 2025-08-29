<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>GitHub Issue Responder Agent</strong> <br/>
    <strong>Tutorial 1: Building Your First AI Agent</strong> <br/>
<br />
</div>

# GitHub Issue Responder Agent

A beginner-friendly tutorial that demonstrates how to build an AI agent that automatically triages GitHub issues. This agent reads GitHub issues, uses AI to classify them, and responds with helpful comments and appropriate labels.

## What You'll Learn

- Setting up your first Agentuity agent
- Processing incoming HTTP requests
- Integrating with external APIs (GitHub API)
- Using OpenAI for intelligent classification
- Implementing agent logging and error handling

## Tech Stack

- **Runtime**: Bun with TypeScript
- **AI Provider**: OpenAI (GPT-4)
- **External API**: GitHub REST API
- **Agent Platform**: Agentuity SDK
- **Code Quality**: Biome for linting and formatting

## Prerequisites

Before you begin, ensure you have:

- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install globally with `npm install -g @agentuity/cli`

## Getting Started

### 1. Environment Setup

This agent requires a GitHub token for API access. Configure it as a secret:

```bash
# Set your GitHub token as a secret
agentuity env set --secret GITHUB_TOKEN your_github_token
```

**Getting the GitHub Token:**
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create new token with `repo` and `issues` permissions

**Note**: Agentuity's AI Gateway feature means no OpenAI API key is required! The platform handles access, routing, and billing all in one place.

### 2. Install Dependencies

```bash
bun install
```

### 3. Authentication

Authenticate with Agentuity:

```bash
agentuity login
```

### 4. Deploy Your Agent

Deploy the agent to Agentuity cloud:

```bash
agentuity deploy
```

This makes your agent available to receive webhooks and process requests.

### 5. Development Mode

Run the agent in development mode for testing:

```bash
agentuity dev
```

This will start your agent and open the Agentuity Console where you can test it.

### 6. Testing Your Agent

In the Agentuity Console, test your agent with a GitHub issue URL:

```
https://github.com/owner/repo/issues/123
```

The agent will:
1. Fetch the issue details from GitHub
2. Analyze the issue content with AI
3. Classify it (bug, feature-request, question, or documentation)
4. Post a helpful comment
5. Apply the appropriate label

## Project Structure

```
├── src/
│   └── agents/
│       └── issue-responder/
│           └── index.ts        # Main agent logic
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── biome.json                 # Code formatting rules
└── agentuity.yaml             # Agent configuration
```

## How It Works

1. **Request Processing**: The agent receives a GitHub issue URL
2. **URL Parsing**: Validates and extracts owner, repo, and issue number
3. **API Integration**: Fetches issue data from GitHub API
4. **AI Analysis**: Uses OpenAI to classify the issue and generate a response
5. **Action Execution**: Posts comment and applies label via GitHub API
6. **Response**: Returns success/failure status to the user

## Deployment

Your agent is already deployed! The `agentuity deploy` command in step 4 deployed your agent to the Agentuity cloud.

To redeploy after making changes:

```bash
agentuity deploy
```

## Next Steps

- Try modifying the classification categories
- Add more sophisticated issue analysis
- Implement issue assignment based on labels
- Add support for pull requests
- Explore the [02-storage-types](../02-storage-types/) tutorial to learn about data persistence

## Resources

- [Video Tutorial](https://www.youtube.com/watch?v=Z9QAdFO2LYE)
- [Agentuity Documentation](https://agentuity.dev)
- [JavaScript SDK Reference](https://agentuity.dev/SDKs/javascript)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Join our Discord](https://discord.gg/agentuity)