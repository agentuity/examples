import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { openai } from "@ai-sdk/openai";
import { Agent, Mastra } from "@mastra/core";
import { z } from "zod";
import { soccerWorkflow } from "../../workflows/soccer-workflow";

export function welcome() {
  return {
    message: "Hello! I'm a Premier League soccer specialist. I can help you find match fixtures and information.",
    prompts: [
      "What matches are being played this weekend?",
      "Show me today's Premier League fixtures",
      "What games are scheduled for tomorrow?"
    ]
  };
}

const soccerAgent = new Agent({
  name: "soccer-agent",
  instructions: `You are a premier league soccer specialist. Use the soccerWorkflow to fetch match fixtures.
  Calculate dates from ${new Date().toISOString().split('T')[0]} and pass to workflow in YYYY-MM-DD format.
  Only show team names, match times, and dates.`,
  model: openai("gpt-4o"),
});

export default async function AgentHandler(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt = await req.data.text();

  try {
    soccerWorkflow.commit();

    const mastra = new Mastra({
      workflows: {
        soccerWorkflow,
      },
    });

    const { start } = mastra.getWorkflow("soccerWorkflow").createRun();

    const today = new Date().toISOString().split('T')[0];
    
    const result = await start({
      triggerData: {
        date: today,
      },
    });

    const fixtures = result.results?.["get-fixtures"]?.fixtures || [];
    
    if (fixtures.length === 0) {
      return resp.text("No Premier League fixtures found for today. Try asking about a different date!");
    }

    const fixtureText = fixtures.map((fixture: any) => 
      `${fixture.strHomeTeam} vs ${fixture.strAwayTeam} - ${fixture.strTime || 'TBD'}`
    ).join('\n');

    const agentResponse = await soccerAgent.generate([
      {
        role: "user",
        content: `${prompt}\n\nFixtures data:\n${fixtureText}`
      }
    ]);

    return resp.text(agentResponse.text);
  } catch (error) {
    ctx.logger.error(
      'Error generating response: %s',
      error instanceof Error ? error.message : String(error)
    );

    return resp.text(
      "I'm sorry, I encountered an error while processing your request."
    );
  }
}
