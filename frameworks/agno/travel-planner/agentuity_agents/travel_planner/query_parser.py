"""
Travel query parser module for extracting structured data from natural language queries.

Uses OpenAI GPT-4o to parse user travel requests into structured JSON format
containing destination, dates, budget, and other travel details.
"""

import asyncio
import json
import logging
import os
import re
from textwrap import dedent

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

client = AsyncOpenAI()

async def parse_user_query(user_query: str) -> dict:
    """Extracts destination, dates, group size, budget, trip style, and activities from travel-related queries."""
    if not user_query or not user_query.strip():
        logger.warning("Empty or whitespace-only query provided")
        return {
            "destination": "Mexico",
            "dates": "June 2025",
            "duration_days": 5,
            "group_size": 2,
            "group_type": "friends",
            "budget_total": 2000,
            "trip_style": "general",
            "preferred_activities": []
        }

    system_prompt = dedent("""\
        You are an intelligent travel planner that extracts key structured details from natural language travel requests.

        Your goal is to return a JSON object with the following keys:
        - "destination": string (city or country name, or null)
        - "dates": string (month/year or specific dates mentioned, or null)
        - "duration_days": integer (length of trip in days, required)
        - "group_size": integer (how many people total, required)
        - "group_type": string (e.g., 'friends', 'family', 'couple', 'solo')
        - "budget_total": float (approximate total budget for the group in USD)
        - "trip_style": short phrase summarizing the tone of the trip (e.g. 'luxury', 'adventurous', 'relaxed', 'cultural')
        - "preferred_activities": list of strings (e.g., 'beach', 'hiking', 'food', 'historical sites')

        If any value is not clearly mentioned, use your best guess based on tone and context. Return only valid JSON. No commentary.
    """)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]

    try:
        if not os.getenv("OPENAI_API_KEY"):
            logger.warning("OPENAI_API_KEY not set, returning default travel info")
            return {
                "destination": "Mexico",
                "dates": "June 2025",
                "duration_days": 5,
                "group_size": 2,
                "group_type": "friends",
                "budget_total": 2000,
                "trip_style": "general",
                "preferred_activities": []
            }

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"}
        )

        text = response.choices[0].message.content.strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*?\}", text, re.DOTALL)
            if not match:
                raise ValueError("No JSON found in response") from None
            parsed = json.loads(match.group(0))

        return parsed

    except json.JSONDecodeError as exc:
        logger.error("Travel query parsing failed: %s", exc, exc_info=True)
    except Exception:
        logger.exception("Unexpected failure while parsing travel query")
    
    return {
        "destination": "Mexico",
        "dates": "June 2025",
        "duration_days": 5,
        "group_size": 2,
        "group_type": "friends",
        "budget_total": 2000,
        "trip_style": "general",
        "preferred_activities": []
    }
