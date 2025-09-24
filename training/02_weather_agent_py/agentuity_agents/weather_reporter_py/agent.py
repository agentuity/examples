import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import aiohttp
from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI

# Initialize OpenAI client
client = AsyncOpenAI()

# San Francisco coordinates for NWS API
SF_LATITUDE = 37.77
SF_LONGITUDE = -122.42
USER_AGENT = "AgentuityWeatherAgent/1.0 (Contact: your-email@example.com)"  # NWS requires a User-Agent

# Pre-defined cities for cron jobs (hardcoded coordinates for demo)
MONITORED_CITIES = [
    {"name": "San Francisco", "lat": 37.77, "lon": -122.42},
    {"name": "New York", "lat": 40.71, "lon": -74.01},
    {"name": "Los Angeles", "lat": 34.05, "lon": -118.24},
    {"name": "Chicago", "lat": 41.88, "lon": -87.63}
]

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Weather agent demonstrating how to use agents in Agentuity (trigger-based behaviors).

    Uses National Weather Service API for real weather data, with some simple caching.
    """
    context.logger.info(f"Weather agent triggered via: {request.trigger}")

    # Cron jobs run automatically, and are configurable in the UI
    if request.trigger == "cron":
        return await handle_cron_trigger(response, context)
    # Manual triggers allow you to test your agent from Dev Mode, even if you have a cron job set up
    elif request.trigger == "manual":
        return await handle_manual_trigger(request, response, context)
    else:
        context.logger.warn(f"Unknown trigger type: {request.trigger}")
        return response.json({
            "error": f"Unsupported trigger: {request.trigger}",
            "supportedTriggers": ["cron", "manual"]
        })


async def handle_cron_trigger(response: AgentResponse, context: AgentContext):
    """
    CRON TRIGGER: Bulk weather updates for monitoring
    Behavior: Fetch weather for multiple cities and cache for alerts
    """
    context.logger.info(f"Cron job: Fetching weather for {len(MONITORED_CITIES)} cities")

    weather_data = {}
    errors = []

    # Process each monitored city
    for city in MONITORED_CITIES:
        try:
            weather = await fetch_nws_weather(city["lat"], city["lon"], city["name"], context)
            weather_data[city["name"]] = weather

            # Cache individual city data for 1 hour
            await context.kv.set("weather", f"city_{city['name'].lower()}", weather, {"ttl": 3600})

            context.logger.info(f"Cached weather for {city['name']}: {weather['temperature']}°{weather['temperatureUnit']}")

        except Exception as e:
            error_msg = f"Failed to fetch weather for {city['name']}: {e}"
            context.logger.error(error_msg)
            errors.append(error_msg)

    # Store bulk report
    bulk_report = {
        "cities": weather_data,
        "updated": datetime.now(timezone.utc).isoformat(),
        "successCount": len(weather_data),
        "errorCount": len(errors),
        "errors": errors if errors else None
    }

    await context.kv.set("weather", "bulk_report", bulk_report, {"ttl": 3600})

    return response.json({
        "source": "cron_trigger",
        "message": f"Weather updated for {len(weather_data)} cities",
        "cities": list(weather_data.keys()),
        "errors": errors if errors else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "nextUpdate": "in 1 hour"
    })


async def handle_manual_trigger(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    MANUAL TRIGGER: On-demand weather lookup with caching
    Behavior: Get specific location weather, check cache first, shorter TTL
    """
    # Parse location from request
    try:
        location_query = await request.data.text() or "San Francisco"
    except:
        location_query = "San Francisco"

    context.logger.info(f"Manual request for weather in: {location_query}")

    # Get coordinates for location
    coordinates = get_coordinates_for_location(location_query)
    if not coordinates:
        return response.json({
            "error": "Location not supported",
            "message": f"Weather data is only available for: San Francisco, New York, Los Angeles, and Chicago. You requested: {location_query}",
            "supported_cities": ["San Francisco", "New York", "Los Angeles", "Chicago"]
        })

    cache_key = f"city_{location_query.lower().replace(' ', '_')}"

    # Check if we have recent data (5 minutes)
    cached = await context.kv.get("weather", cache_key)
    if cached.exists:
        cached_weather = await cached.data.json()
        context.logger.info(f"Returning cached weather for {location_query}")
        return response.json(cached_weather)

    # Fetch fresh weather data
    try:
        weather = await fetch_nws_weather(
            coordinates["lat"],
            coordinates["lon"],
            location_query,
            context
        )

        # Cache for 5 minutes
        await context.kv.set("weather", cache_key, weather, {"ttl": 300})

        return response.json(weather)

    except Exception as e:
        context.logger.error(f"Failed to fetch weather for {location_query}: {e}")
        return response.json({
            "error": "Weather data unavailable",
            "message": f"Could not fetch weather for {location_query}. Please try again later.",
            "location": location_query
        })


async def fetch_nws_weather(latitude: float, longitude: float, location_name: str, context: AgentContext) -> Dict[str, Any]:
    """
    Fetch weather data from National Weather Service API
    This demonstrates external API integration with proper error handling
    """
    context.logger.info(f"Fetching NWS weather for {location_name} ({latitude}, {longitude})")

    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Get grid points from coordinates
            points_url = f"https://api.weather.gov/points/{latitude},{longitude}"

            async with session.get(points_url, headers={"User-Agent": USER_AGENT}, timeout=aiohttp.ClientTimeout(total=10)) as points_response:
                if points_response.status != 200:
                    raise Exception(f"NWS points API error: {points_response.status}")

                points_data = await points_response.json()
                grid_props = points_data.get("properties", {})

                grid_id = grid_props.get("gridId")
                grid_x = grid_props.get("gridX")
                grid_y = grid_props.get("gridY")

                if not all([grid_id, grid_x, grid_y]):
                    raise Exception("Invalid grid data from NWS points API")

            # Step 2: Get forecast using grid points
            forecast_url = f"https://api.weather.gov/gridpoints/{grid_id}/{grid_x},{grid_y}/forecast"

            async with session.get(forecast_url, headers={"User-Agent": USER_AGENT}, timeout=aiohttp.ClientTimeout(total=10)) as forecast_response:
                if forecast_response.status != 200:
                    raise Exception(f"NWS forecast API error: {forecast_response.status}")

                forecast_data = await forecast_response.json()
                periods = forecast_data.get("properties", {}).get("periods", [])

                if not periods:
                    raise Exception("No forecast data available")

                current_forecast = periods[0]

                # Generate AI weather interpretation
                try:
                    ai_result = await client.chat.completions.create(
                        model="gpt-5-nano",
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful weather assistant. Create a conversational, one-sentence summary of weather conditions for users."
                            },
                            {
                                "role": "user",
                                "content": f"Weather in {location_name}: {current_forecast['temperature']}°{current_forecast['temperatureUnit']}, {current_forecast['shortForecast']}. {current_forecast['detailedForecast']}"
                            }
                        ],
                    )

                    ai_summary = ai_result.choices[0].message.content.strip()
                    context.logger.info(f"Generated AI summary for {location_name}")

                except Exception as e:
                    context.logger.error(f"AI generation failed: {e}")
                    ai_summary = None # Fallback

                result = {
                    "location": location_name,
                    "temperature": current_forecast["temperature"],
                    "forecast": current_forecast["shortForecast"],
                    "ai_summary": ai_summary # AI-generated interpretation
                }

                context.logger.info(f"Successfully fetched weather for {location_name}: {result['temperature']}°F")
                return result

        except Exception as e:
            context.logger.error(f"NWS API error for {location_name}: {e}")
            raise Exception(f"Weather service unavailable: {e}")


def get_coordinates_for_location(location: str) -> Optional[Dict[str, float]]:
    """
    Simple coordinate mapping for demo purposes
    Typically, you'd use a proper geocoding service
    """
    location_lower = location.lower()

    if "san francisco" in location_lower or "sf" in location_lower:
        return {"lat": 37.77, "lon": -122.42}
    elif "new york" in location_lower or "nyc" in location_lower:
        return {"lat": 40.71, "lon": -74.01}
    elif "los angeles" in location_lower or "la" in location_lower:
        return {"lat": 34.05, "lon": -118.24}
    elif "chicago" in location_lower:
        return {"lat": 41.88, "lon": -87.63}
    else:
        return None  # Unsupported location


def welcome():
    """Welcome message for weather agent."""
    return {
        "welcome": """🌤️ **Real Weather Agent** - National Weather Service Integration

I demonstrate **agent anatomy** through different trigger behaviors:

📅 **Cron Trigger**: Bulk updates for monitoring multiple cities
🔍 **Manual Trigger**: On-demand weather with smart caching for single requests

I use the National Weather Service API (no API key required) and intelligent caching strategies for optimal performance.

⚠️ **Note**: I currently support weather for: San Francisco, New York, Los Angeles, and Chicago. Please use one of these cities for accurate weather data.""",
        "prompts": [
            {
                "data": "San Francisco",
                "contentType": "text/plain"
            },
            {
                "data": "New York",
                "contentType": "text/plain"
            },
            {
                "data": "Chicago",
                "contentType": "text/plain"
            }
        ]
    }
