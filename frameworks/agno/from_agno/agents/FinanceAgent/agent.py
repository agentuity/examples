from textwrap import dedent
from agentuity import AgentRequest, AgentResponse, AgentContext
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
import traceback

finance_agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        DuckDuckGoTools(
            search=True,
            news=True,
        )
    ],
    instructions=dedent("""\
        You are a seasoned financial analyst with deep expertise in market analysis and financial research! 📊
        
        Follow these steps for comprehensive financial analysis:
        1. Market Overview
           - Search for latest company news and developments
           - Current market sentiment and trends
        
        2. Financial Deep Dive
           - Key financial developments and announcements
           - Recent earnings or business updates
        
        3. Professional Analysis
           - Expert opinions and market commentary
           - Recent news impact assessment
        
        4. Financial Context
           - Industry trends and competitive positioning
           - Comparative market analysis
           - Current investor sentiment and market indicators
        
        Your reporting style:
        - Begin with an executive summary
        - Use tables for data presentation when available
        - Include clear section headers
        - Add emoji indicators for trends (📈 📉)
        - Highlight key insights with bullet points
        - Compare findings to industry benchmarks when possible
        - Include technical term explanations
        - End with a forward-looking market analysis
        
        Financial Disclosure:
        - Always highlight news sources and dates
        - Note data limitations and availability
        - Mention this is based on publicly available information
        - This analysis is for educational purposes only
    """),
    add_datetime_to_instructions=True,
    show_tool_calls=True,
    markdown=True,
)

def welcome():
    return {
        "welcome": "💼 Ask about any public company—I'll give you comprehensive financial analysis with latest news, market sentiment, and expert insights.",
        "prompts": [
            "What's the latest news and market sentiment around Apple?",
            "Give me a detailed analysis of Tesla's recent market developments",
            "How is Microsoft performing in the current market? Include recent news",
            "Analyze NVIDIA's recent news and market position",
            "What's the latest financial news about Amazon's business performance?"
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_input = (await request.data.text()).strip()
        context.logger.info(f"Received finance analysis request: {user_input}")
        
        result = await finance_agent.arun(user_input)
        
        if not result or not result.content:
            context.logger.error("Empty response from Agno finance agent")
            return response.text("⚠️ No analysis could be generated. Please try again.")
        
        return response.text(result.content)
        
    except Exception as e:
        context.logger.error(f"FinanceAgent Error: {e}")
        context.logger.debug(traceback.format_exc())
        msg = str(e).lower()
        if "rate limit" in msg:
            return response.text("❌ API rate limit exceeded. Please try again later.")
        if "network" in msg:
            return response.text("❌ Network error. Please check your internet connection and try again later.")
        return response.text("❌ Unexpected error. Please try again later.")
