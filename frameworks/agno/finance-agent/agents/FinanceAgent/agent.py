from agentuity import AgentRequest, AgentResponse, AgentContext
from textwrap import dedent
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

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
        "welcome": "💼 I'm your financial analyst! Ask me about any company's market performance, recent news, or financial developments.",
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_input = await request.data.text()
        context.logger.info(f"Received financial analysis request: {user_input}")
        
        result = finance_agent.run(user_input)
        
        return response.text(str(result))
        
    except Exception as e:
        context.logger.error(f"FinanceAgent Error: {e}")
        return response.text("❌ Sorry, I encountered an error processing your financial analysis request. Please try again.")
