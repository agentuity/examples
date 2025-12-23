import type {
  AgentRequest,
  AgentResponse,
  AgentContext,
  AgentWelcomeResult,
} from '@agentuity/sdk';
import OpenAI from 'openai';

// Initialize OpenAI client (uses Agentuity's AI gateway)
const client = new OpenAI();

interface RequestData {
  name?: string;
}

export default async function HelloAgent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Log the incoming request
  context.logger.info(`Hello agent triggered via ${request.trigger}`);

  // Get request data
  let name = 'World';
  try {
    if (request.data.contentType === 'application/json') {
      const data = (await request.data.json()) as RequestData;
      name = data.name || 'World';
    } else if (request.data.contentType === 'text/plain') {
      name = (await request.data.text()) || 'World';
    }
  } catch (error) {
    context.logger.error(`Error parsing request: ${error}`);
  }

  // Generate greeting
  let greeting: string;
  try {
    const result = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly assistant that creates unique, warm greetings. Keep responses to one sentence and be creative but appropriate.',
        },
        {
          role: 'user',
          content: `Generate a friendly, unique greeting for someone named '${name}'`,
        },
      ],
    });

    greeting = result.choices[0]?.message?.content?.trim() || `Hello, ${name}!`;
    context.logger.info(`AI-generated greeting for ${name}`);
  } catch (error) {
    context.logger.error(`AI generation failed: ${error}`);
    greeting = `Hello, ${name}!`; // Fallback to simple greeting
  }

  // Update greeting counter for this specific name
  const nameKey = `greeting_count_${name}`;
  context.logger.info(`Looking for counter with key: ${nameKey}`);

  const counterResult = await context.kv.get('greetings', nameKey);
  context.logger.info(`Counter exists: ${counterResult.exists}`);

  let newCount: number;
  if (counterResult.exists && counterResult.data) {
    const data = (await counterResult.data.json()) as { count: number };
    context.logger.info(`Retrieved counter data:`, data);
    const currentCount = data.count;
    newCount = currentCount + 1;
  } else {
    context.logger.info(`No existing counter found, starting at 1`);
    newCount = 1;
  }

  // Save updated counter with 24-hour TTL (86400 seconds)
  context.logger.info(`Saving counter ${newCount} for key: ${nameKey}`);
  await context.kv.set(
    'greetings',
    nameKey,
    { count: newCount },
    {
      ttl: 86400,
      contentType: 'application/json',
    }
  );

  // Verify storage
  const verifyResult = await context.kv.get('greetings', nameKey);
  if (verifyResult.exists && verifyResult.data) {
    const verifiedData = await verifyResult.data.json();
    context.logger.info(`Verified stored value:`, verifiedData);
  } else {
    context.logger.error(`Failed to verify storage for key: ${nameKey}`);
  }

  // Prepare response
  const responseData = {
    greeting,
    personal_count: newCount,
  };

  context.logger.info(`Generated greeting #${newCount} for ${name}`);

  return response.json(responseData);
}

export const welcome = (): AgentWelcomeResult => {
  return {
    welcome:
      '🤖 Hello World Agent - I create personalized greetings and track a counter!',
    prompts: [
      {
        data: JSON.stringify({ name: 'Alice' }),
        contentType: 'application/json',
      },
      {
        data: 'Bob',
        contentType: 'text/plain',
      },
      {
        data: JSON.stringify({ name: 'Dr. Smith' }),
        contentType: 'application/json',
      },
    ],
  };
};
