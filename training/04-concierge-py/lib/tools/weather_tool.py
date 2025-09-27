import httpx
from typing import Dict, Any, Union
import logging

logger = logging.getLogger(__name__)

# Constants
USER_AGENT = "SanFranLocalGuide/1.0 (Contact: your-email@example.com)"
# Hardcoded coordinates for central San Francisco
LATITUDE = 37.77
LONGITUDE = -122.42


class WeatherToolError(Exception):
    """Custom exception for weather tool errors"""
    pass

async def get_weather(location: str = "San Francisco") -> Union[Dict[str, Any], str]:
    """
    Get the current weather forecast for a specific location in or near San Francisco.

    Args:
        location: The location in San Francisco to get weather for

    Returns:
        Dict with weather information or error string
    """
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Get the grid points from coordinates
            points_url = f"https://api.weather.gov/points/{LATITUDE},{LONGITUDE}"

            points_response = await client.get(
                points_url,
                headers={"User-Agent": USER_AGENT}
            )

            if not points_response.is_success:
                raise WeatherToolError(
                    f"NWS points API request failed: {points_response.status_code} {points_response.reason_phrase}"
                )

            points_data = points_response.json()

            # Validate and extract grid properties
            grid_props = points_data.get("properties", {})
            grid_id = grid_props.get("gridId")
            grid_x = grid_props.get("gridX")
            grid_y = grid_props.get("gridY")

            if not all([grid_id, grid_x is not None, grid_y is not None]):
                raise WeatherToolError(
                    "Could not extract grid information from NWS points API response."
                )

            # Step 2: Get the forecast using the grid points
            forecast_url = f"https://api.weather.gov/gridpoints/{grid_id}/{grid_x},{grid_y}/forecast"

            forecast_response = await client.get(
                forecast_url,
                headers={"User-Agent": USER_AGENT}
            )

            if not forecast_response.is_success:
                raise WeatherToolError(
                    f"NWS forecast API request failed: {forecast_response.status_code} {forecast_response.reason_phrase}"
                )

            forecast_data = forecast_response.json()
            periods = forecast_data.get("properties", {}).get("periods", [])

            if not periods:
                raise WeatherToolError(
                    "Could not extract forecast data from NWS API response."
                )

            current_forecast = periods[0]

            # Return a simplified forecast object
            return {
                "location": f"San Francisco area (near {LATITUDE}, {LONGITUDE})",
                "temperature": current_forecast.get("temperature"),
                "unit": current_forecast.get("temperatureUnit"),
                "forecast": current_forecast.get("shortForecast"),
                "details": current_forecast.get("detailedForecast"),
            }

    except Exception as error:
        error_msg = f"Error fetching weather: {error}"
        logger.error(error_msg)
        return "Sorry, I couldn't retrieve the weather forecast right now. There might be a technical issue."