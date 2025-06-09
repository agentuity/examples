<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
</div>

# 🤖 LLM as Jury System

This project uses Agentuity to create a multi-agent system where one AI agent (ContentWriter) creates blog posts, and another AI agent (Jury) evaluates them on multiple criteria using different AI models.

## Overview

- **ContentWriter Agent**: Takes a topic as input and generates a well-structured blog post about that topic
- **Jury Agent**: Evaluates blog posts across multiple criteria (readability, technical accuracy, engagement) using multiple AI models for balanced assessment

## How It Works

1. The ContentWriter agent receives a topic and uses OpenAI to generate a high-quality blog post
2. The Jury agent receives the blog post and evaluates it using multiple specialized "judge" LLMs
3. Each judge evaluates the blog post on specific criteria and provides scores out of 10
4. The Jury agent combines all evaluations and returns a comprehensive assessment

## 🚀 Quick Start

### Prerequisites
- **Bun**: Version 1.2.4 or higher

### Setup
1. Install dependencies: `bun install`
2. Authenticate with Agentuity: `agentuity login`
3. Start development mode: `agentuity dev`

## 🎯 Using the Agents

### Via DevMode UI
1. Open the DevMode URL provided when you start `agentuity dev`
2. **Generate Content**: Select ContentWriter agent → Enter a topic → Get blog post
3. **Evaluate Content**: Select Jury agent → Paste blog post → Get detailed evaluation

### Via CLI Test Client
```bash
# Generate a blog post on a topic
bun run index.ts ContentWriter "artificial intelligence"

# Evaluate a blog post
bun run index.ts Jury "Your blog post content here..."

# Run the full workflow (ContentWriter -> Jury)
bun run index.ts workflow "technology trends"
```

## 🔧 Agent Details

### ContentWriter
Uses the Mastra framework with OpenAI's gpt-4o-mini model to generate blog posts with:
- Engaging titles
- Clear introductions
- Well-organized body paragraphs with subheadings
- Strong conclusions

### Jury
A multi-model evaluation system that provides balanced assessment using:

**Default Models:**
- **GPT-4o Mini**: Precise and thorough evaluator
- **GPT-4o**: Critical and detailed evaluator focused on technical merits
- **Claude**: Pretty cool model I can't lie

**Evaluation Criteria:**
- Clarity
- Structure 
- Engagement
- Technical accuracy


To add other models (Grok, Llama, Mistral), install the appropriate SDK and update the Jury agent code.

## 📁 Project Structure

```
├── agents/             # Agent implementations
├── node_modules/       # Dependencies
├── package.json        # Project dependencies
├── agentuity.yaml      # Agentuity configuration
└── index.ts           # CLI test client
```

## 🌐 Development & Deployment

### Development Mode
```bash
agentuity dev
```
Opens browser with Agentuity Console in Live Mode for real-time testing.

### Creating New Agents
```bash
agentuity agent new
```

### Deployment
```bash
agentuity deploy
```

### Environment Variables
```bash
agentuity env set KEY=VALUE
agentuity env set --secret KEY=VALUE  # for sensitive data
```

## 📖 Documentation

For comprehensive Agentuity SDK documentation: [https://agentuity.dev/SDKs/javascript](https://agentuity.dev/SDKs/javascript)

## 🆘 Support

- [Documentation](https://agentuity.dev/SDKs/javascript)
- [Discord Community](https://discord.com/invite/vtn3hgUfuc)
- Agentuity Support Team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
