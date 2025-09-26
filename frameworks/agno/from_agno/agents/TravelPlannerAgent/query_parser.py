"""
Travel Planner query parser module for extracting structured data from natural language queries.

Uses OpenAI GPT-4o to parse user travel requests into structured JSON format
containing destination, dates, budget, and other travel details.
"""

import asyncio
import json
import logging
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
            "trip_style": "fun",
            "preferred_activities": ["local food", "sightseeing"]
        }

    system_prompt = dedent("""\
        You are an intelligent travel planner that extracts key structured details from natural language travel requests.

        Your goal is to return a JSON object with the following keys:
        - "destination": string (city or country name, or null)
        - "dates": string (when they want to travel, or null)
        - "duration_days": integer (how many days, default 5)
        - "group_size": integer (number of people, default 2)
        - "group_type": string (friends, family, colleagues, solo, etc.)
        - "budget_total": integer (total budget in USD, default 2000)
        - "trip_style": string (adventure, luxury, cultural, business, romantic, etc.)
        - "preferred_activities": array of strings (what they want to do)

        Examples:
        Input: "Plan a romantic weekend in Paris for $1500"
        Output: {"destination": "Paris", "dates": null, "duration_days": 2, "group_size": 2, "group_type": "couple", "budget_total": 1500, "trip_style": "romantic", "preferred_activities": []}

        Input: "I want to go to Japan with 3 friends for 10 days in March, we love food and temples"
        Output: {"destination": "Japan", "dates": "March", "duration_days": 10, "group_size": 4, "group_type": "friends", "budget_total": 2000, "trip_style": "cultural", "preferred_activities": ["food", "temples"]}

        Return ONLY the JSON object, no other text.
        """)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ],
            temperature=0.1,
            max_tokens=300
        )

        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)
        logger.info("Successfully parsed travel query: %s", parsed)
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
        "trip_style": "fun",
        "preferred_activities": ["local food", "sightseeing"]
    }
