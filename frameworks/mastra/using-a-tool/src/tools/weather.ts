import { createTool } from "@mastra/core";
import { z } from "zod";

export const londonWeatherTool = createTool({
  id: "london-weather-tool",
  description: "Returns year-to-date historical weather data for London",
  inputSchema: z.object({}),
  outputSchema: z.object({
    period: z.string(),
    max_temperature: z.number(),
    min_temperature: z.number(),
    total_rainfall: z.number(),
    total_snowfall: z.number(),
    max_windspeed: z.number(),
    rainy_days: z.number(),
  }),
  execute: async () => {
    const endDate = new Date().toISOString().split("T")[0];
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=51.5074&longitude=-0.1278&start_date=2024-01-01&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max`
    );
    
    const data = await response.json() as {
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        snowfall_sum: number[];
        wind_speed_10m_max: number[];
      };
    };
    
    const maxTemp = Math.max(...data.daily.temperature_2m_max);
    const minTemp = Math.min(...data.daily.temperature_2m_min);
    const totalRainfall = data.daily.precipitation_sum.reduce((sum, val) => sum + val, 0);
    const totalSnowfall = data.daily.snowfall_sum.reduce((sum, val) => sum + val, 0);
    const maxWindspeed = Math.max(...data.daily.wind_speed_10m_max);
    const rainyDays = data.daily.precipitation_sum.filter(val => val > 0).length;
    
    return {
      period: `January 1, 2024 to ${endDate}`,
      max_temperature: maxTemp,
      min_temperature: minTemp,
      total_rainfall: totalRainfall,
      total_snowfall: totalSnowfall,
      max_windspeed: maxWindspeed,
      rainy_days: rainyDays,
    };
  },
});
