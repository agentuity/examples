# Agno Study Partner

An AI-powered study partner that combines multiple information sources and tools to provide comprehensive learning support. This agent demonstrates how to create an AI-powered study partner that combines Exa search tools for web research and YouTube tools for video content discovery.

## Features

- **Multi-tool Integration**: Combines Exa search tools for web research and YouTube tools for video content discovery
- **Personalized Learning Support**: Creates customized study plans based on user constraints (time available, current knowledge level, daily study hours) and learning preferences
- **Resource Curation**: Searches and recommends high-quality learning materials including documentation, tutorials, research papers, and community discussions from reliable sources
- **Interactive Learning**: Provides step-by-step explanations, practical examples, and hands-on project suggestions to reinforce understanding
- **Progress Tracking**: Designs structured study plans with clear milestones and deadlines to help users stay on track with their learning goals
- **Learning Strategy**: Offers tips on effective study techniques, time management, and motivation maintenance for sustained learning success

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Run the development server:
   ```bash
   agentuity dev
   ```

4. Open your browser and navigate to the URL shown in the terminal to test your agent.

## Environment Variables

- `AGENTUITY_SDK_KEY` - Your Agentuity SDK key (required)
- `OPENAI_API_KEY` - OpenAI API key (routed through Agentuity Gateway)
- `EXA_API_KEY` - Exa API key (routed through Agentuity Gateway)

## Project Structure

- `agentuity_agents/StudyPartner/` - Contains the study partner agent implementation
- `server.py` - Development server entry point
- `main.py` - Production server entry point
- `agentuity.yaml` - Project configuration
- `pyproject.toml` - Python dependencies and project metadata

## Usage Examples

- "I want to learn Python programming from scratch. I have 4 weeks and can study 2 hours daily."
- "Help me understand machine learning concepts with practical examples and resources."
- "Create a study plan for learning web development with HTML, CSS, and JavaScript."
