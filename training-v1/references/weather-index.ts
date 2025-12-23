import type {
  AgentRequest,
  AgentResponse,
  AgentContext,
  AgentWelcomeResult,
} from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// NWS API configuration
const USER_AGENT =
  'AgentuityWeatherAgent/1.0 (Contact: your-email@example.com)'; // NWS requires a User-Agent

// Pre-defined cities for cron jobs (hardcoded coordinates for demo)
const MONITORED_CITIES = [
  { name: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'New York', lat: 40.71, lon: -74.01 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Chicago', lat: 41.88, lon: -87.63 },
];

interface WeatherResult {
  location: string;
  temperature: number;
  forecast: string;
  ai_summary: string | null;
}

// Interfaces for NWS API responses (optional properties for defensive typing)
interface NWSPointsResponse {
  properties?: {
    gridId?: string;
    gridX?: number;
    gridY?: number;
  };
}

interface NWSForecastResponse {
  properties?: {
    periods?: Array<{
      temperature: number;
      temperatureUnit: string;
      shortForecast: string;
      detailedForecast: string;
    }>;
  };
}

export default async function WeatherAgent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  /**
   * Weather agent demonstrating how to use agents in Agentuity (trigger-based behaviors).
   *
   * Uses National Weather Service API for real weather data, with some simple caching.
   */
  context.logger.info(`Weather agent triggered via: ${request.trigger}`);

  // Cron jobs run automatically, and are configurable in the UI
  if (request.trigger === 'cron') {
    return await handleCronTrigger(response, context);
    // Manual triggers allow you to test your agent from Dev Mode, even if you have a cron job set up
  } else if (request.trigger === 'manual') {
    return await handleManualTrigger(request, response, context);
  } else {
    context.logger.warn(`Unknown trigger type: ${request.trigger}`);
    return response.json({
      error: `Unsupported trigger: ${request.trigger}`,
      supportedTriggers: ['cron', 'manual'],
    });
  }
}

/**
 * CRON TRIGGER: Bulk weather updates for monitoring
 * Behavior: Fetch weather for multiple cities and cache for alerts
 */
async function handleCronTrigger(
  response: AgentResponse,
  context: AgentContext
): Promise<any> {
  context.logger.info(
    `Cron job: Fetching weather for ${MONITORED_CITIES.length} cities`
  );

  const weatherData: Record<string, WeatherResult> = {};
  const errors: string[] = [];

  // Process each monitored city
  for (const city of MONITORED_CITIES) {
    try {
      const weather = await fetchNWSWeather(
        city.lat,
        city.lon,
        city.name,
        context
      );
      weatherData[city.name] = weather;

      // Cache individual city data for 1 hour
      await context.kv.set(
        'weather',
        `city_${city.name.toLowerCase()}`,
        weather,
        { ttl: 3600 }
      );

      context.logger.info(
        `Cached weather for ${city.name}: ${weather.temperature}°F`
      );
    } catch (error) {
      const errorMsg = `Failed to fetch weather for ${city.name}: ${error}`;
      context.logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Store bulk report
  const bulkReport = {
    cities: weatherData,
    updated: new Date().toISOString(),
    successCount: Object.keys(weatherData).length,
    errorCount: errors.length,
    errors: errors,
  };

  await context.kv.set('weather', 'bulk_report', bulkReport, { ttl: 3600 });

  return response.json({
    source: 'cron_trigger',
    message: `Weather updated for ${Object.keys(weatherData).length} cities`,
    cities: Object.keys(weatherData),
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
    nextUpdate: 'in 1 hour',
  });
}

/**
 * MANUAL TRIGGER: On-demand weather lookup with caching
 * Behavior: Get specific location weather, check cache first, shorter TTL
 */
async function handleManualTrigger(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
): Promise<any> {
  // Parse location from request (default to San Francisco)
  let locationQuery: string;
  try {
    locationQuery = (await request.data.text()) || 'San Francisco';
  } catch {
    locationQuery = 'San Francisco';
  }

  context.logger.info(`Manual request for weather in: ${locationQuery}`);

  // Get coordinates for location
  const coordinates = getCoordinatesForLocation(locationQuery);
  if (!coordinates) {
    return response.json({
      error: 'Location not supported',
      message: `Weather data is only available for: San Francisco, New York, Los Angeles, and Chicago. You requested: ${locationQuery}`,
      supported_cities: ['San Francisco', 'New York', 'Los Angeles', 'Chicago']
    });
  }

  const cacheKey = `city_${locationQuery.toLowerCase().replace(/\s+/g, '_')}`;

  // Check if we have recent data (5 minutes)
  const cached = await context.kv.get('weather', cacheKey);
  if (cached.exists) {
    const cachedWeather = (await cached.data.json()) as any;
    context.logger.info(`Returning cached weather for ${locationQuery}`);
    return response.json(cachedWeather);
  }

  // Fetch fresh weather data
  try {
    const weather = await fetchNWSWeather(
      coordinates.lat,
      coordinates.lon,
      locationQuery,
      context
    );

    // Cache for 5 minutes
    await context.kv.set('weather', cacheKey, weather, { ttl: 300 });

    return response.json(weather);
  } catch (error) {
    context.logger.error(
      `Failed to fetch weather for ${locationQuery}: ${error}`
    );
    return response.json({
      error: 'Weather data unavailable',
      message: `Could not fetch weather for ${locationQuery}. Please try again later.`,
      location: locationQuery,
    });
  }
}

/**
 * Fetch weather data from National Weather Service API
 * This demonstrates external API integration with proper error handling
 */
async function fetchNWSWeather(
  latitude: number,
  longitude: number,
  locationName: string,
  context: AgentContext
): Promise<WeatherResult> {
  context.logger.info(
    `Fetching NWS weather for ${locationName} (${latitude}, ${longitude})`
  );

  try {
    // Step 1: Get grid points from coordinates
    const pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    const pointsResponse = await fetch(pointsUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!pointsResponse.ok) {
      throw new Error(
        `NWS points API request failed: ${pointsResponse.status} ${pointsResponse.statusText}`
      );
    }

    // Assert type after checking response.ok
    const pointsData = (await pointsResponse.json()) as NWSPointsResponse;
    const gridProps = pointsData.properties;

    // Validate and extract grid properties
    if (
      !gridProps ||
      gridProps.gridId === undefined ||
      gridProps.gridX === undefined ||
      gridProps.gridY === undefined
    ) {
      throw new Error(
        'Could not extract grid information from NWS points API response.'
      );
    }
    const gridId: string = gridProps.gridId;
    const gridX: number = gridProps.gridX;
    const gridY: number = gridProps.gridY;

    // Step 2: Get forecast using grid points
    const forecastUrl = `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`;
    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!forecastResponse.ok) {
      throw new Error(
        `NWS forecast API request failed: ${forecastResponse.status} ${forecastResponse.statusText}`
      );
    }

    // Assert type after checking response.ok
    const forecastData = (await forecastResponse.json()) as NWSForecastResponse;
    const currentForecast = forecastData.properties?.periods?.[0];

    if (!currentForecast) {
      throw new Error('Could not extract forecast data from NWS API response.');
    }

    // Generate AI weather interpretation using Vercel AI SDK
    let aiSummary: string | null = null;
    try {
      const aiResult = await generateText({
        model: openai('gpt-5-nano'),
        system:
          'You are a helpful weather assistant. Create a conversational, one-sentence summary of weather conditions for users.',
        prompt: `Weather in ${locationName}: ${currentForecast.temperature}°${currentForecast.temperatureUnit}, ${currentForecast.shortForecast}. ${currentForecast.detailedForecast}`,
      });

      aiSummary = aiResult.text.trim();
      context.logger.info(`Generated AI summary for ${locationName}`);
    } catch (error) {
      context.logger.error(`AI generation failed: ${error}`);
      aiSummary = null; // Fallback
    }

    const result: WeatherResult = {
      location: locationName,
      temperature: currentForecast.temperature,
      forecast: currentForecast.shortForecast,
      ai_summary: aiSummary,
    };

    context.logger.info(
      `Successfully fetched weather for ${locationName}: ${result.temperature}°F`
    );
    return result;
  } catch (error) {
    context.logger.error(
      `Error fetching weather: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error(
      `Weather service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Simple coordinate mapping for demo purposes
 * Typically, you'd use a proper geocoding service
 */
function getCoordinatesForLocation(location: string): {
  lat: number;
  lon: number;
} | null {
  const locationLower = location.toLowerCase();

  if (locationLower.includes('san francisco') || locationLower.includes('sf')) {
    return { lat: 37.77, lon: -122.42 };
  } else if (
    locationLower.includes('new york') ||
    locationLower.includes('nyc')
  ) {
    return { lat: 40.71, lon: -74.01 };
  } else if (
    locationLower.includes('los angeles') ||
    locationLower.includes('la')
  ) {
    return { lat: 34.05, lon: -118.24 };
  } else if (locationLower.includes('chicago')) {
    return { lat: 41.88, lon: -87.63 };
  } else {
    return null; // Unsupported location
  }
}

export const welcome = (): AgentWelcomeResult => {
  return {
    welcome: `🌤️ **Real Weather Agent** - National Weather Service Integration

I demonstrate **agent anatomy** through different trigger behaviors:

📅 **Cron Trigger**: Bulk updates for monitoring dashboards
🔍 **Manual Trigger**: On-demand weather with smart caching

I use the National Weather Service API (no API key required) and intelligent caching strategies for optimal performance.

⚠️ **Note**: I currently support weather for: San Francisco, New York, Los Angeles, and Chicago. Please use one of these cities for accurate weather data.`,
    prompts: [
      {
        data: 'San Francisco',
        contentType: 'text/plain',
      },
      {
        data: 'New York',
        contentType: 'text/plain',
      },
      {
        data: 'Chicago',
        contentType: 'text/plain',
      },
    ],
  };
};
