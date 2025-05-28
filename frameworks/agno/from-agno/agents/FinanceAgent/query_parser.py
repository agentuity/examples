from openai import AsyncOpenAI
from textwrap import dedent
import json
import re

client = AsyncOpenAI()

async def parse_user_query(user_query: str):
    """Returns extracted company tickers and analysis intent using GPT-4o"""
    system_prompt = dedent("""\
    You are an intelligent parser designed to extract structured info from financial queries.

    Given a user request, return a JSON object with:
    - "tickers": list of stock tickers (max 5 characters, all caps, valid U.S. tickers)
    - "intent": short phrase describing the type of analysis requested (e.g., 'financials', 'analyst outlook', 'performance comparison')

    If no ticker is clearly mentioned, return ["AAPL"] as a fallback.
    Return only valid JSON. No commentary or explanation.
    """)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0
        )

        text = response.choices[0].message.content
        json_text = re.search(r'\{.*\}', text, re.DOTALL)[0]
        parsed = json.loads(json_text)
        return parsed

    except Exception as e:
        print(f"Parsing error: {e}")
        return {"tickers": ["AAPL"], "intent": "general financial analysis"}
