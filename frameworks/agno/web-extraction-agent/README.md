# Web Extraction Agent

This agent demonstrates how to build an intelligent web scraper that can extract comprehensive, structured information from any webpage using the Agno framework with OpenAI GPT-4 and Firecrawl tools.

## Key Capabilities

- **Page Metadata Extraction**: Captures title, description, and key features
- **Content Section Parsing**: Identifies and extracts main content with headings  
- **Link Discovery**: Finds important related pages and resources
- **Contact Information**: Locates contact details when available
- **Contextual Metadata**: Gathers additional site information for context

## Use Cases

- **Research & Analysis**: Quickly gather information from multiple web sources
- **Competitive Intelligence**: Monitor competitor websites and features
- **Content Monitoring**: Track changes and updates on specific pages
- **Knowledge Base Building**: Extract structured data for documentation
- **Data Collection**: Gather information for market research or analysis

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

3. Run the agent locally:
   ```bash
   agentuity dev
   ```

4. Test the agent by sending a web extraction request to the local endpoint.

## Environment Variables

- `OPENAI_API_KEY` - Required for OpenAI GPT-4 model access
- `FIRECRAWL_API_KEY` - Required for Firecrawl web scraping tools
- `AGENTUITY_SDK_KEY` - Required for Agentuity platform integration

## Structure

- `agentuity_agents/WebExtractionAgent/agent.py` - Main agent implementation with Agno framework
- `server.py` - Server entry point
- `main.py` - CLI entry point  
- `pyproject.toml` - Project dependencies and configuration
- `agentuity.yaml` - Agentuity project configuration

## Example Usage

Send a request with a URL to extract structured information:

```
Extract all information from https://www.example.com
```

The agent will return structured data including page title, content sections, links, and metadata in JSON format.
