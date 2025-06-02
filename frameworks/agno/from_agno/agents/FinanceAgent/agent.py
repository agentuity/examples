from textwrap import dedent
from openai import AsyncOpenAI
from datetime import datetime
import traceback
from agentuity import AgentRequest, AgentResponse, AgentContext
from agents.FinanceAgent.yfinance_tools import YFinanceTools
from agents.FinanceAgent.query_parser import parse_user_query

import re

class FinanceAgent:
    def __init__(self):
        self.model = AsyncOpenAI()
        self.tools = YFinanceTools(
            stock_price=True,
            analyst_recommendations=True,
            stock_fundamentals=True,
            historical_prices=True,
            company_info=True,
            company_news=True,
        )
        self.instructions = dedent("""\
            You are a seasoned Wall Street analyst with deep expertise in market analysis! 📊

            Follow these steps for comprehensive financial analysis:
            1. Market Overview
               - Latest stock price
               - 52-week high and low
            2. Financial Deep Dive
               - Key metrics (P/E, Market Cap, EPS)
            3. Professional Insights
               - Analyst recommendations breakdown
               - Recent rating changes
            4. Market Context
               - Industry trends and positioning
               - Competitive analysis
               - Market sentiment indicators

            Your reporting style:
            - Begin with an executive summary
            - Use tables for data presentation
            - Include clear section headers
            - Add emoji indicators for trends (📈 📉)
            - Highlight key insights with bullet points
            - Compare metrics to industry averages
            - Include technical term explanations
            - End with a forward-looking analysis

            Risk Disclosure:
            - Always highlight potential risk factors
            - Note market uncertainties
            - Mention relevant regulatory concerns
        """)

        self.add_datetime_to_instructions = True
        self.show_tool_calls = True
        self.markdown = True
    
    @staticmethod
    def sanitize_markdown(text) -> str:
        # strip any *italic*/**bold** tokens that slipped through
        text = re.sub(r'(?<!#)(\*{1,3}|_{1,3})([^*_]+?)\1', r'\2', text)

        # insert a newline if a heading and body ran together: "## Heading --- 1." → put newline
        text = re.sub(r'(## .+?)\s*[-–]{2,}\s*', r'\1\n\n', text)

        # fix joins (WeekHigh -> Week High)
        text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)

        # collapse any 2+ spaces
        text = re.sub(r'[ ]{2,}', ' ', text)

        return text.strip()

    async def run(self, request: AgentRequest, response: AgentResponse, context: AgentContext):
        try:
            user_input = (await request.data.text()).strip() # Agentuity provides the request data as an async text stream
            context.logger.info(f"Received input: {user_input}") # Agentuity logger for structured logging
            
            parsed = await parse_user_query(user_input)
            if not isinstance(parsed, dict):
                context.logger.error("Query parser returned invalid type")
                parsed = {"tickers": ["AAPL"], "intent": "general financial analysis"}
            raw_tickers = parsed.get("tickers", ["AAPL"])
            # basic validation: must be non-empty strings ≤10 chars
            validated = [
                t.strip().upper()
                for t in raw_tickers
                if isinstance(t, str) and 0 < len(t.strip()) <= 10
            ]
            tickers = validated or ["AAPL"]

            # Append date to instructions
            date_note = f"(Date: {datetime.now().strftime('%B %d, %Y')})\n\n"
            full_instructions = date_note + self.instructions if self.add_datetime_to_instructions else self.instructions

            # Tool call
            tool_output = await self.tools.run(tickers, context=context)

            prompt = dedent(f"""\
                {full_instructions}

                🧾 **User Request**:
                {user_input}

                📊 **Structured Market Data**:
                {tool_output}

                ✏️ **Formatting rules (must-follow)**
                1. Use markdown level-2 headings for each section, e.g. `## 1. Market Overview`.
                2. Put *exactly one blank line* after every heading.
                3. Show metrics in a table **only**; put narrative / commentary **below the table** as normal paragraphs or bullets.
                4. Never join narrative to a heading or a table row – always leave a blank line before narrative begins.
                5. Do **not** use bold or italic anywhere in the body text.
            """)

            result = await self.model.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": full_instructions},
                    {"role": "user", "content": prompt}
                ]
            )
            if not result.choices or not result.choices[0].message.content:
                context.logger.error("Empty response from OpenAI")
                return response.text("⚠️ No analysis could be generated. Please try again.")

            raw_output = result.choices[0].message.content
            safe_output = FinanceAgent.sanitize_markdown(raw_output)
            return response.text(safe_output)

        except Exception as e:
            context.logger.error(f"FinanceAgent Error: {e}")
            context.logger.debug(traceback.format_exc())
            msg = str(e).lower()
            if "rate limit" in msg:
                return response.text("❌ API rate limit exceeded. Please try again later.")
            if "network" in msg:
                return response.text("❌ Network error. Please check your internet connection and try again later.")
            return response.text("❌ Unexpected error. Please try again later.")

def welcome():
    return {
        "welcome": "💼 Ask about any public company—I'll give you a full market breakdown with news, financials, analyst insights, and more.",
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    agent = FinanceAgent()
    return await agent.run(request, response, context)