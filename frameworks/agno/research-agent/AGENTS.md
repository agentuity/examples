# Research Agent

This document describes the Research Agent in this project.

## Overview

A professional investigative journalism agent that produces comprehensive, New York Times-style reports on any topic using web search and article extraction.

**Source:** https://docs.agno.com/examples/use-cases/agents/research-agent

## Entry Point

`agentuity_agents/ResearchAgent/agent.py`

## Features

- **Multi-source research**: Searches 10+ authoritative sources via DuckDuckGo
- **Article extraction**: Uses Newspaper4k to extract and analyze article content
- **Professional reporting**: Generates structured, well-researched reports
- **Fact verification**: Cross-references information across multiple sources
- **Objective analysis**: Maintains balanced perspective and ethical journalism practices

## Tools

- **DuckDuckGoTools**: Web search across multiple sources
- **Newspaper4kTools**: Article extraction and content analysis

## Model

- GPT-4o-mini via Agentuity AI Gateway (automatically routed)

## Usage

Send a research topic to the agent and it will return a comprehensive investigative report with:
- Executive Summary
- Background & Context
- Key Findings
- Impact Analysis
- Future Outlook
- Expert Insights
- Sources & Methodology

## Example Prompts

- "Research the latest developments in quantum computing"
- "Investigate the impact of AI on healthcare delivery"
- "Analyze recent climate change policy changes globally"
- "Explore the evolution of cybersecurity threats and defenses"

## Implementation Details

The agent implementation consists of two files:

1. **agent.py** - Agentuity wrapper that implements:
   - `welcome()` function returning welcome message and example prompts
   - `async run(request, response, context)` function that:
     - Extracts user prompt from request
     - Executes the Agno research agent in a thread executor
     - Returns formatted text response

2. **research_agent.py** - Agno agent configuration with:
   - GPT-4o-mini model via OpenAIChat
   - DuckDuckGoTools for web search
   - Newspaper4kTools for article extraction
   - Detailed journalist persona and instructions
   - Expected output format for NYT-style reports

## Dependencies

- `agno>=0.1.50` - Agno framework
- `openai>=1.107.3` - OpenAI client for GPT models
- `duckduckgo-search>=7.0.0` - Web search functionality
- `newspaper4k>=0.9.3` - Article extraction
- `lxml_html_clean>=0.4.1` - HTML cleaning for article extraction
