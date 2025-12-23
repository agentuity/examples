import { createAgent, type AgentContext } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

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

/**
 * Fetch weather data from National Weather Service API
 * This demonstrates external API integration with proper error handling
 */
async function fetchNWSWeather(
  latitude: number,
  longitude: number,
  locationName: string,
  ctx: AgentContext 
): Promise<WeatherResult> {
  ctx.logger.info(
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
      ctx.logger.info(`Generated AI summary for ${locationName}`);
    } catch (error) {
      ctx.logger.error(`AI generation failed: ${error}`);
      aiSummary = null; // Fallback
    }

    const result: WeatherResult = {
      location: locationName,
      temperature: currentForecast.temperature,
      forecast: currentForecast.shortForecast,
      ai_summary: aiSummary,
    };

    ctx.logger.info(
      `Successfully fetched weather for ${locationName}: ${result.temperature}°F`
    );
    return result;
  } catch (error) {
    ctx.logger.error(
      `Error fetching weather: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new Error(
      `Weather service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

const agent = createAgent('weather', {
	description: 'An agent using Vercel AI SDK with OpenAI',
	schema: {
		input: s.object({location: s.string()}),
		output: s.union(
			// Error
			s.object({
				error: s.string(),
				message: s.string(),
				supported_cities: s.optional(s.array(s.string())),
				location: s.optional(s.string())
			}),
			// Expected Output
			s.object({
				location: s.string(),
  				temperature: s.number(),
  				forecast: s.string(),
  				ai_summary: s.union(s.string(), s.null())
			}),
			// Test
			s.string()
		)
	},
	handler: async (ctx, { location }) => {
    ctx.logger.info(`Manual request for weather in: ${location}`);

    // Get coordinates for location
    const coordinates = getCoordinatesForLocation(location);
    if (!coordinates) {
      return {
        error: 'Location not supported',
        message: `Weather data is only available for: San Francisco, New York, Los Angeles, and Chicago. You requested: ${location}`,
        supported_cities: ['San Francisco', 'New York', 'Los Angeles', 'Chicago']
      };
    }

    const cacheKey = `city_${location.toLowerCase().replace(/\s+/g, '_')}`;

    // Check if we have recent data (5 minutes)
    const cached = await ctx.kv.get('weather', cacheKey);
    if (cached.exists) {
      const cachedWeather = cached.data as any;
      ctx.logger.info(`Returning cached weather for ${location}`);
      return cachedWeather;
    }

    // Fetch fresh weather data
    try {
      const weather = await fetchNWSWeather(
        coordinates.lat,
        coordinates.lon,
        location,
        ctx
      );

      // Cache for 5 minutes
      await ctx.kv.set('weather', cacheKey, weather, { ttl: 300 });

      return weather;
    } catch (error) {
      ctx.logger.error(
        `Failed to fetch weather for ${location}: ${error}`
      );
      return {
        error: 'Weather data unavailable',
        message: `Could not fetch weather for ${location}. Please try again later.`,
        location: location,
      };
    }
	},
});


export default agent;
