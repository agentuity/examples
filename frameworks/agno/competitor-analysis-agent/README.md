# Competitor Analysis Agent

This agent demonstrates how to build a sophisticated competitor analysis agent that combines powerful search and scraping capabilities with advanced reasoning tools to provide comprehensive competitive intelligence.

## Key Capabilities

- **Company discovery using Firecrawl search**: Find competitors and industry information
- **Website scraping and content analysis**: Extract detailed information from competitor websites  
- **Competitive intelligence gathering**: Analyze market positioning and strategies
- **SWOT analysis with reasoning**: Conduct structured competitive analysis
- **Strategic recommendations**: Provide actionable insights and recommendations
- **Structured thinking and analysis**: Use reasoning tools for deep analysis

## Example Queries

- "Analyze OpenAI's main competitors in the LLM space"
- "Compare Uber vs Lyft in the ride-sharing market"  
- "Research fintech competitors to Stripe"
- "Analyze Tesla's competitive position vs traditional automakers"
- "Research Nike vs Adidas in the athletic apparel market"

## How It Works

1. **Initial Research & Discovery**: Uses search tools to find information about the target company and identify competitors
2. **Competitor Identification**: Searches for each identified competitor and maps the competitive landscape
3. **Website Analysis**: Scrapes competitor websites to extract product information, pricing, and value propositions
4. **Deep Competitive Analysis**: Compares features, pricing, and market positioning across competitors
5. **Strategic Synthesis**: Conducts SWOT analysis and develops strategic recommendations

## Prerequisites

- Python 3.10+
- Agentuity CLI
- Required API keys (automatically managed by Agentuity AI Gateway)

## Installation

```bash
cd frameworks/agno/competitor-analysis-agent
uv sync
```

## Usage

```bash
agentuity dev
```

Then visit the local development URL and interact with the agent through the Agentuity Console.

## Ported From

This agent was ported from: https://docs.agno.com/examples/use-cases/agents/competitor_analysis_agent

The original Agno agent functionality is preserved while being wrapped in the Agentuity framework for seamless deployment and management.
