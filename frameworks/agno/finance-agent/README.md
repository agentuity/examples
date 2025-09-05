# Agno Finance Agent (Original Implementation)

This is the original Agno Finance Agent from [https://docs.agno.com/examples/agents/finance-agent](https://docs.agno.com/examples/agents/finance-agent) wrapped with Agentuity's framework.

## Overview

This agent provides comprehensive financial analysis using web search and news data through DuckDuckGo. It differs from the existing YFinance-based implementation by using the original Agno framework with DuckDuckGo tools for real-time web search and financial news analysis.

## Features

- **Real-time Financial News**: Uses DuckDuckGo to search for the latest company news and market developments
- **Market Analysis**: Provides comprehensive financial analysis with market sentiment and trends
- **Professional Reporting**: Delivers structured reports with executive summaries, data tables, and forward-looking analysis
- **Original Agno Framework**: Preserves all original Agno framework functionality and patterns

## Example Prompts

- "What's the latest news and market sentiment around Apple?"
- "Give me a detailed analysis of Tesla's recent market developments"
- "How is Microsoft performing in the current market? Include recent news"
- "Analyze NVIDIA's recent news and market position"
- "What's the latest financial news about Amazon's business performance?"

## Technical Details

This implementation uses:
- **Agno Agent Framework**: Original framework with Agent class and OpenAIChat model
- **DuckDuckGo Tools**: For web search and news retrieval
- **GPT-4o**: For financial analysis and report generation
- **Agentuity Wrapper**: Proper integration with Agentuity's request/response system

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- **OpenAI API Key**: Set as `OPENAI_API_KEY` environment variable

## Installation

1. Install dependencies:
```bash
uv sync
```

2. Set up environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

3. Run the development server:
```bash
uv run server.py
```

## Usage

The agent accepts natural language queries about financial analysis and returns comprehensive market reports with:

- Executive summaries
- Latest news and developments
- Market sentiment analysis
- Professional insights and commentary
- Forward-looking market analysis

## Differences from YFinance Implementation

This implementation differs from the existing YFinance-based FinanceAgent in several ways:

- **Data Source**: Uses DuckDuckGo web search instead of Yahoo Finance API
- **Real-time News**: Focuses on current news and market sentiment rather than historical data
- **Analysis Style**: Emphasizes news-driven analysis and market commentary
- **Framework**: Uses original Agno framework patterns and tools

## Documentation

For comprehensive documentation on the Agentuity Python SDK, visit:
[https://agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)

## License

This project is licensed under the terms specified in the LICENSE file.
