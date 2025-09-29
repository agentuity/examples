import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core';
import { createTool } from '@mastra/core';
import { z } from 'zod';

interface WeatherApiResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
    snowfall_sum: number[];
  };
}

const londonWeatherTool = createTool({
  id: 'london-weather-tool',
  description: 'Returns year-to-date historical weather data for London',
  inputSchema: z.object({}),
  outputSchema: z.object({
    date: z.array(z.string()),
    temp_max: z.array(z.number()),
    temp_min: z.array(z.number()),
    rainfall: z.array(z.number()),
    windspeed: z.array(z.number()),
    snowfall: z.array(z.number())
  }),
  execute: async () => {
    const startDate = `${new Date().getFullYear()}-01-01`;
    const endDate = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=51.5072&longitude=-0.1276&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,snowfall_sum&timezone=auto`
    );
    
    const data = await response.json() as WeatherApiResponse;
    
    return {
      date: data.daily.time,
      temp_max: data.daily.temperature_2m_max,
      temp_min: data.daily.temperature_2m_min,
      rainfall: data.daily.precipitation_sum,
      windspeed: data.daily.windspeed_10m_max,
      snowfall: data.daily.snowfall_sum
    };
  }
});

const londonWeatherAgent = new Agent({
  name: 'london-weather-agent',
  description: 'Provides historical information about London weather',
  instructions: `You are a helpful assistant with access to historical weather data for London.

- The data is limited to the current calendar year, from January 1st up to today's date.
- Use the provided tool (londonWeatherTool) to retrieve relevant data.
- Answer the user's question using that data.
- Keep responses concise, factual, and informative.
- If the question cannot be answered with available data, say so clearly.`,
  model: openai('gpt-4o'),
  tools: { londonWeatherTool }
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the London Weather Agent! I can provide historical weather information for London using real weather data.',
    prompts: [
      {
        data: 'How many times has it rained this year?',
        contentType: 'text/plain',
      },
      {
        data: 'What was the highest temperature recorded this year?',
        contentType: 'text/plain',
      },
      {
        data: 'Show me the weather trends for the past month',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function AgentHandler(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userMessage = (await req.data.text()) ?? 'How many times has it rained this year?';
    
    const result = await londonWeatherAgent.generate(userMessage);
    
    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error running London Weather agent:', error);
    
    return resp.text('Sorry, there was an error processing your weather request.');
  }
}
