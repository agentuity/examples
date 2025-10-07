import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Agent as MastraAgent, Mastra, Step, Workflow } from '@mastra/core';

export function welcome() {
  return {
    welcome:
      'Welcome to the Soccer Agent! I can help you find English Premier League match fixtures for any date.',
    prompts: [
      {
        data: 'What matches are being played this weekend?',
        contentType: 'text/plain',
      },
      {
        data: 'Show me Premier League fixtures for tomorrow',
        contentType: 'text/plain',
      },
      {
        data: 'What games are scheduled for next Saturday?',
        contentType: 'text/plain',
      },
    ],
  };
}

const getFixtures = new Step({
  id: 'get-fixtures',
  description: 'Fetch match fixtures for English Premier League matches',
  inputSchema: z.object({
    date: z.string().describe('Date in YYYY-MM-DD format'),
  }),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ date: string }>('trigger');

    if (!triggerData) {
      throw new Error('Trigger data not found');
    }

    const { date } = triggerData;
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${date}&l=English_Premier_League`
    );
    const data = (await response.json()) as any;

    return {
      fixtures: data.events || [],
    };
  },
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const prompt =
      (await req.data.text()) ?? 'What matches are being played this weekend?';

    const currentDate = new Date().toISOString().split('T')[0];

    const soccerWorkflow = new Workflow({
      name: 'soccer-workflow',
      triggerSchema: z.object({
        date: z.string().describe('Date in YYYY-MM-DD format'),
      }),
    }).step(getFixtures);

    soccerWorkflow.commit();

    const mastra = new Mastra({
      workflows: {
        soccerWorkflow: soccerWorkflow as any,
      },
    });

    const { start } = mastra.getWorkflow('soccerWorkflow').createRun();

    const result = await start({
      triggerData: {
        date: currentDate,
      },
    });

    const stepResult = result.results['get-fixtures'] as any;
    const fixtures = stepResult?.fixtures || [];

    if (fixtures.length === 0) {
      return resp.text(
        `No Premier League fixtures found for ${currentDate}. Try checking for a different date when matches are scheduled.`
      );
    }

    let message = `⚽ Premier League Fixtures for ${currentDate}:\n\n`;
    for (const fixture of fixtures) {
      message += `${fixture.strHomeTeam} vs ${fixture.strAwayTeam}\n`;
      message += `⏰ Time: ${fixture.strTime || 'TBD'}\n`;
      message += `📍 Venue: ${fixture.strVenue || 'TBD'}\n`;
      message += `📅 Date: ${fixture.dateEvent}\n\n`;
    }

    return resp.text(message);
  } catch (error) {
    ctx.logger.error('Error running soccer agent:', error);

    return resp.text('Sorry, there was an error fetching the fixtures.');
  }
}
