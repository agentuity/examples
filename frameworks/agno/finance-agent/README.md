<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

## Agno Finance Agent

This agent is a direct port of the Agno Finance Agent from the official Agno documentation, wrapped for use with the Agentuity platform.

**Original Source**: https://docs.agno.com/examples/agents/finance-agent

### Description

This example shows how to create a sophisticated financial analyst that provides comprehensive market insights using real-time data. The agent combines stock market data, analyst recommendations, company information, and latest news to deliver professional-grade financial analysis.

### Features

- **Real-time Stock Data**: Latest pricing, 52-week highs/lows, and market metrics
- **Financial Analysis**: P/E ratios, market cap, EPS, and other key fundamentals
- **Analyst Insights**: Professional recommendations and rating changes
- **Market Context**: Industry trends, competitive analysis, and sentiment indicators
- **News Integration**: Latest company news and market developments

### Example Prompts

- "What's the latest news and financial performance of Apple (AAPL)?"
- "Give me a detailed analysis of Tesla's (TSLA) current market position"
- "How are Microsoft's (MSFT) financials looking? Include analyst recommendations"
- "Analyze NVIDIA's (NVDA) stock performance and future outlook"
- "What's the market saying about Amazon's (AMZN) latest quarter?"

### Framework Preservation

This implementation preserves ALL original Agno framework functionality:
- Uses `agno.agent.Agent` for the core agent logic
- Leverages `agno.models.openai.OpenAIChat` for AI model integration
- Utilizes `agno.tools.yfinance.YFinanceTools` for financial data retrieval
- Maintains all original instructions, configurations, and behavior

The Agentuity wrapper simply provides the interface layer while keeping the Agno agent intact.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   uv install
   ```

2. Set up environment variables (create `.env` file):
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the development server:
   ```bash
   uv run server.py
   ```

4. Test the agent with financial queries about public companies.

## 📖 Documentation

For comprehensive documentation on the Agentuity Python SDK, visit:
[https://agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)

For the original Agno framework documentation, visit:
[https://docs.agno.com/](https://docs.agno.com/)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [Agentuity documentation](https://agentuity.dev/SDKs/python)
2. Check the [Agno documentation](https://docs.agno.com/)
3. Join our [Discord community](https://discord.gg/agentuity) for support
4. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
