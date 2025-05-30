import yfinance as yf
from datetime import datetime
import re

class YFinanceTools:
    def __init__(
        self,
        stock_price=True,
        analyst_recommendations=True,
        stock_fundamentals=True,
        historical_prices=True,
        company_info=True,
        company_news=True,
    ):
        self.stock_price = stock_price
        self.analyst_recommendations = analyst_recommendations
        self.stock_fundamentals = stock_fundamentals
        self.historical_prices = historical_prices
        self.company_info = company_info
        self.company_news = company_news

    def extract_tickers(self, text):
        return list(set(re.findall(r"\b[A-Z]{1,5}\b", text)))

    def format_number(self, num):
        try:
            if abs(num) >= 1e9:
                return f"${num / 1e9:.2f}B"
            elif abs(num) >= 1e6:
                return f"${num / 1e6:.2f}M"
            else:
                return f"${num:.2f}"
        except(TypeError, ValueError):
            return "N/A"

    def get_analyst_summary(self, info):
        try:
            return f"""
            - **Buy**: {info.get('recommendationKey', 'N/A').capitalize()}
            - **Target Mean Price**: {self.format_number(info.get('targetMeanPrice', 0))}
            - **Number of Analysts**: {info.get('numberOfAnalystOpinions', 'N/A')}
            - **Rating Change Date**: {info.get('upgradeDowngradeDate', 'N/A')}
            """
        except(KeyError, TypeError, AttributeError):
            return "- Analyst summary unavailable."

    async def run(self, tickers, context=None):
        if not tickers:
            tickers = ["AAPL"]

        reports = []
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                hist = stock.history(period="1y")

                section = [f"# 📊 {info.get('longName', ticker)} ({ticker})\n"]

                if self.company_info:
                    section.append(f"- **Sector**: {info.get('sector', 'N/A')}")
                    section.append(f"- **Industry**: {info.get('industry', 'N/A')}")

                if self.stock_price:
                    section.append(f"- **Current Price**: {info.get('currentPrice', 'N/A')}")
                    section.append(f"- **52-Week Low/High**: {info.get('fiftyTwoWeekLow', 'N/A')} – {info.get('fiftyTwoWeekHigh', 'N/A')}")

                if self.stock_fundamentals:
                    section.append(f"- **Market Cap**: {self.format_number(info.get('marketCap', 0))}")
                    section.append(f"- **P/E Ratio**: {info.get('trailingPE', 'N/A')}")
                    section.append(f"- **EPS**: {info.get('trailingEps', 'N/A')}")

                if self.analyst_recommendations:
                    section.append("\n**🔍 Analyst Ratings:**")
                    section.append(self.get_analyst_summary(info))

                if self.historical_prices:
                    recent = hist.tail(5)[["Close"]].to_markdown()
                    section.append("\n**📈 Last 5 Close Prices (1yr range):**\n")
                    section.append(f"```markdown\n{recent}\n```")

                if self.company_news:
                    section.append("\n**📰 Latest News:**")
                    try:
                        news_items = stock.news[:3]
                        for article in news_items:
                            title = article.get("title")
                            link = article.get("link")
                            if title and link:
                                section.append(f"- [{title}]({link})")
                    except Exception as e:
                        if context:
                            context.logger.warning(f"News error: {e}")
                        section.append("- News unavailable.")

                reports.append("\n".join(section))

            except Exception as e:
                if context:
                    context.logger.error(f"Error fetching {ticker}: {e}")
                reports.append(f"## ⚠️ Could not retrieve data for {ticker}")

        return "\n\n---\n\n".join(reports)