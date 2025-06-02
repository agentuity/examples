import os
import logging
from openai import AsyncOpenAI
from textwrap import dedent
import json
import re

logger = logging.getLogger(__name__)

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = AsyncOpenAI() # Using OpenAI Python SDK - routed through Agentuity’s AI Gateway automatically

async def parse_user_query(user_query: str) -> dict[str, str | list[str]]:
    """Returns extracted company tickers and analysis intent using GPT-4o"""
    if not user_query or not user_query.strip():
        logger.warning("Empty or whitespace-only query provided")
        return {"tickers": ["AAPL"], "intent": "general financial analysis"}
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
            model="gpt-4o", # No API key needed here — routed by Agentuity AI Gateway
            temperature=0
        )
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("Empty response from OpenAI")

        text = response.choices[0].message.content.strip()

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                raise ValueError("No JSON found in response")
            parsed = json.loads(match.group(0))

        return parsed

    except (ValueError, json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Query parsing failed: {e}")
        return {"tickers": ["AAPL"], "intent": "general financial analysis"}

    except Exception as e:
        logger.error(f"Unexpected error in query parsing: {e}", exc_info=True)
        return {"tickers": ["AAPL"], "intent": "general financial analysis"}
