import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Vercel AI SDK Agent with Tools! I can help you plan activities based on weather conditions in any location.',
    prompts: [
      {
        data: 'What should I do in San Francisco today?',
        contentType: 'text/plain',
      },
      {
        data: 'Plan a day for me in New York',
        contentType: 'text/plain',
      },
      {
        data: 'What activities can I do in Seattle?',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userMessage = await req.data.text();
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      tools: {
        weather: {
          description: 'Get the current weather for a location',
          parameters: z.object({
            location: z.string().describe('The location to get weather for'),
          }),
          execute: async ({ location }) => {
            ctx.logger.info('Getting weather for:', location);
            const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
            const randomWeather = weatherConditions[
              Math.floor(Math.random() * weatherConditions.length)
            ];
            const temperature = Math.floor(Math.random() * 30) + 50;
            return { location, weather: randomWeather, temperature };
          },
        },
        activities: {
          description: 'Get suggested activities based on weather',
          parameters: z.object({
            weather: z.string().describe('Current weather condition'),
          }),
          execute: async ({ weather }) => {
            ctx.logger.info('Getting activities for weather:', weather);
            const activityMap: Record<string, string[]> = {
              sunny: ['hiking', 'beach visit', 'outdoor picnic', 'bike ride'],
              cloudy: ['museum visit', 'shopping', 'cafe hopping', 'city tour'],
              rainy: ['indoor climbing', 'movie theater', 'art gallery', 'board game cafe'],
              snowy: ['skiing', 'ice skating', 'hot chocolate at a cafe', 'winter market'],
            };
            return {
              weather,
              activities: activityMap[weather] || ['explore the area', 'try local cuisine'],
            };
          },
        },
      },
    });

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error running agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
