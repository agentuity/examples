import { createTool } from "@mastra/core";
import { z } from "zod";

export const londonWeatherTool = createTool({
	id: "london-weather-tool",
	description: "Returns year-to-date historical weather data for London",
	outputSchema: z.object({
		date: z.array(z.string()),
		temp_max: z.array(z.number()),
		temp_min: z.array(z.number()),
		rainfall: z.array(z.number()),
		windspeed: z.array(z.number()),
		snowfall: z.array(z.number()),
	}),
	execute: async () => {
		const startDate = new Date().getFullYear() + "-01-01";
		const endDate = new Date().toISOString().split("T")[0];

		const response = await fetch(
			`https://archive-api.open-meteo.com/v1/archive?latitude=51.5072&longitude=-0.1276&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,snowfall_sum`,
		);

		const { daily } = await response.json();

		return {
			date: daily.time,
			temp_max: daily.temperature_2m_max,
			temp_min: daily.temperature_2m_min,
			rainfall: daily.precipitation_sum,
			windspeed: daily.wind_speed_10m_max,
			snowfall: daily.snowfall_sum,
		};
	},
});
