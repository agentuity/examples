import type { AgentContext } from '@agentuity/runtime';

const USER_AGENT = 'AgentuityWeatherAgent/1.0 (Contact: concierge@aiewf2025.com)';

export interface WeatherResult {
	location: string;
	temperature: number;
	unit: string;
	forecast: string;
	detailedForecast: string;
}

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
 * Fetch weather data from National Weather Service API for San Francisco
 * Implements caching via KV storage with 5-minute TTL
 */
export async function getWeather(
	location: string,
	ctx: AgentContext
): Promise<WeatherResult> {
	// Only San Francisco is supported (hardcoded coordinates)
	const latitude = 37.77;
	const longitude = -122.42;
	const cacheKey = 'sf_current';

	// Check cache first (5 minute TTL)
	const cached = await ctx.kv.get('weather', cacheKey);
	if (cached.exists) {
		ctx.logger.info('Returning cached weather for San Francisco');
		return cached.data as WeatherResult;
	}

	ctx.logger.info(
		`Fetching NWS weather for ${location} (${latitude}, ${longitude})`
	);

	try {
		// Step 1: Get grid points from coordinates
		const pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
		const pointsResponse = await fetch(pointsUrl, {
			headers: { 'User-Agent': USER_AGENT },
			signal: AbortSignal.timeout(10000),
		});

		if (!pointsResponse.ok) {
			throw new Error(
				`NWS points API failed: ${pointsResponse.status} ${pointsResponse.statusText}`
			);
		}

		const pointsData = (await pointsResponse.json()) as NWSPointsResponse;
		const gridProps = pointsData.properties;

		if (
			!gridProps ||
			gridProps.gridId === undefined ||
			gridProps.gridX === undefined ||
			gridProps.gridY === undefined
		) {
			throw new Error('Could not extract grid information from NWS points API');
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
				`NWS forecast API failed: ${forecastResponse.status} ${forecastResponse.statusText}`
			);
		}

		const forecastData =
			(await forecastResponse.json()) as NWSForecastResponse;
		const currentForecast = forecastData.properties?.periods?.[0];

		if (!currentForecast) {
			throw new Error('Could not extract forecast data from NWS API');
		}

		const result: WeatherResult = {
			location: 'San Francisco',
			temperature: currentForecast.temperature,
			unit: currentForecast.temperatureUnit,
			forecast: currentForecast.shortForecast,
			detailedForecast: currentForecast.detailedForecast,
		};

		// Cache for 5 minutes
		await ctx.kv.set('weather', cacheKey, result, { ttl: 300 });

		ctx.logger.info(
			`Successfully fetched weather: ${result.temperature}°${result.unit}`
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
