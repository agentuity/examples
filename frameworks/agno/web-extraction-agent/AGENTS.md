# Agents

This project contains the following agents:

## WebExtractionAgent

An intelligent web scraper that extracts comprehensive, structured information from any webpage using the Agno framework with OpenAI GPT-4 and Firecrawl tools.

### Usage

Send a URL or web extraction request to the agent and it will return structured data including:
- Page metadata (title, description, features)
- Content sections with headings
- Important links and resources
- Contact information
- Contextual metadata

### Configuration

- Model: OpenAI GPT-4o via Agno framework
- Tools: FirecrawlTools for web scraping and crawling
- Output: Structured PageInformation schema with Pydantic models
- Instructions: Expert web researcher focused on comprehensive content extraction
