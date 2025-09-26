<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# Agno Research Agent for Agentuity

This example demonstrates how to convert an [Agno Research Agent](https://docs.agno.com/examples/agents/research-agent) to work with the Agentuity platform while preserving all original framework functionality.

## Overview

The Research Agent is a sophisticated AI journalist that combines web search capabilities with advanced content analysis to produce professional-grade investigative reports. It performs comprehensive research using multiple sources, fact-checks information, and delivers polished, New York Times-style articles on any topic.

**Original Agno Agent**: https://docs.agno.com/examples/agents/research-agent

## Key Features

- **Advanced Web Search**: Uses DuckDuckGo for comprehensive topic research
- **Content Analysis**: Leverages Newspaper4k for article extraction and analysis  
- **Professional Reporting**: Generates NYT-style investigative articles
- **Multi-source Verification**: Cross-references facts across multiple sources
- **Structured Output**: Delivers well-formatted reports with sections for findings, analysis, and sources

## Architecture

This implementation follows the Agentuity framework wrapper pattern:

1. **Original Agno Agent** (`research_agent.py`): Preserves the complete original Agno implementation
2. **Agentuity Wrapper** (`agent.py`): Provides the Agentuity interface while calling the original agent
3. **Framework Integration**: Maintains all Agno tools, models, and configurations

## Example Usage

```python
# The agent accepts research topics and generates comprehensive reports
"Analyze the impact of AI on healthcare delivery and patient outcomes"
"Report on the latest breakthroughs in quantum computing"  
"Investigate the global transition to renewable energy sources"
```

## Dependencies

- **Agno**: Core framework for the research agent
- **DuckDuckGo Search**: Web search capabilities
- **Newspaper4k**: Content extraction and analysis
- **Agentuity SDK**: Platform integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Set up environment variables (create `.env` file):
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the development server:
   ```bash
   agentuity dev
   ```

4. Test the agent in the Agentuity Console or deploy to production:
   ```bash
   agentuity deploy
   ```

## 📖 Documentation

For comprehensive documentation on the Agentuity Python SDK, visit:
[https://agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
