from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import re
import os
import json

from lib.tools.weather_tool import get_weather

# Initialize OpenAI client for Perplexity
perplexity_client = AsyncOpenAI(
    api_key=os.getenv("PERPLEXITY_API_KEY"),
    base_url="https://api.perplexity.ai"
)

# Initialize Claude client for tool handling
claude_client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Welcome to the San Francisco Local Guide! I can help you with San Francisco recommendations, weather, and local insights.",
        "prompts": [
            {
                "data": "What's a good restaurant in the Mission District?",
                "contentType": "text/plain"
            },
            {
                "data": "What's the weather like today in San Francisco?",
                "contentType": "text/plain"
            }
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Handle both plain text and JSON inputs
        if request.data.content_type == "text/plain":
            user_prompt = await request.data.text()
        elif request.data.content_type == "application/json":
            json_data = await request.data.json()
            user_prompt = json_data.get("prompt")
            if not user_prompt:
                return response.text("JSON must contain a 'prompt' property.")
        else:
            return response.text(
                "This agent accepts 'text/plain' or 'application/json' with a prompt field."
            )

        # Step 1: Use Claude to detect if weather information is needed
        tool_detection_prompt = f"""Analyze this user request and determine if weather information for San Francisco is needed to answer it properly.

User request: "{user_prompt}"

Respond with ONLY "yes" if weather information is needed, or "no" if it's not needed."""

        tool_detection_response = await claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=10,
            messages=[{"role": "user", "content": tool_detection_prompt}]
        )

        needs_weather = tool_detection_response.content[0].text.strip().lower() == "yes"

        # Step 2: Get weather data if needed
        weather_context = ""
        if needs_weather:
            weather_data = await get_weather("San Francisco")
            if isinstance(weather_data, dict):
                weather_context = f"\n\nCurrent San Francisco weather: {weather_data['forecast']} with temperature of {weather_data['temperature']}°{weather_data['unit']}. {weather_data['details']}"
            else:
                weather_context = f"\n\nWeather information: {weather_data}"

        # Step 3: Use Perplexity for web-enhanced responses with weather context
        perplexity_prompt = user_prompt + weather_context

        result = await perplexity_client.chat.completions.create(
            model="sonar-pro",
            messages=[
                {
                    "role": "system",
                    "content": """You are San Francisco Local Guide, an AI assistant specializing in San Francisco, California recommendations and information.

Your expertise includes:
- San Francisco-specific food and restaurant recommendations with local favorites
- Entertainment options including museums, attractions, nightlife, and beaches
- Transportation advice including public transit, ride-sharing, and navigation tips
- Local cultural context, history, and San Francisco-specific tips
- Seasonal events and activities
- Current weather information when provided in the user's message

You only know about San Francisco, California.

Always provide specific, actionable information tailored to San Francisco.
When making recommendations, include neighborhood information and local context.
Include relevant details like price ranges, accessibility, and cultural significance.
If weather information is provided in the user's message, incorporate it naturally into your response."""
                },
                {"role": "user", "content": perplexity_prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        return response.text(result.choices[0].message.content)
        
    except Exception as e:
        context.logger.error(f"Error in SanFranLocalGuide agent: {e}")
        return response.text(
            "I'm sorry, I encountered an error while processing your request. Please try again later."
        )
