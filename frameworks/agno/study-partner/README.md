# Agno Study Partner Agent

This example demonstrates how to convert an Agno study partner agent to run on the Agentuity platform. The agent helps users find learning resources, create personalized study plans, and provides explanations on various topics.

## Features

- **Multi-tool Integration**: Uses ExaTools for web research and YouTubeTools for video content discovery
- **Personalized Learning Support**: Creates customized study plans based on user constraints (time available, current knowledge level, daily study hours)
- **Resource Curation**: Searches and recommends high-quality learning materials including documentation, tutorials, research papers, and community discussions
- **Interactive Learning**: Provides step-by-step explanations, practical examples, and hands-on project suggestions
- **Progress Tracking**: Designs structured study plans with clear milestones and deadlines
- **Learning Strategy**: Offers tips on effective study techniques, time management, and motivation maintenance

## How to Run

1. **Install dependencies**:
   ```bash
   uv sync
   ```

2. **Set up environment variables** (optional - uses Agentuity AI Gateway by default):
   ```bash
   cp .env.example .env
   # Edit .env with your API keys if needed
   ```

3. **Run locally**:
   ```bash
   agentuity dev
   ```

4. **Test the agent**:
   - Visit the local development URL shown in the terminal
   - Try example prompts like:
     - "I want to learn about Postgres in depth. I know the basics, have 2 weeks to learn, and can spend 3 hours daily. Please share some resources and a study plan."
     - "Help me understand machine learning fundamentals with hands-on projects"
     - "Create a study plan for learning React.js from scratch in 1 month"

## Agent Architecture

This example follows the Agno-to-Agentuity bridge pattern:

- **`study_partner_agent.py`**: Contains the original Agno agent definition with tools and instructions
- **`agent.py`**: Agentuity wrapper that handles async execution and response formatting
- **Bridge Pattern**: Uses `asyncio.run_in_executor()` to run the synchronous Agno agent in an async context

## Dependencies

- **agno**: The original Agno framework for agent definition
- **exa_py**: Exa search tools for web research
- **openai**: OpenAI API client (routed through Agentuity AI Gateway)
- **agentuity**: Agentuity SDK for platform integration

## Deployment

Deploy to Agentuity Cloud:

```bash
agentuity deploy
```

The agent will be available at your Agentuity project URL and can be integrated into applications via the Agentuity API.
