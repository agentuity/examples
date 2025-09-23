import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { openai } from "@ai-sdk/openai";
import { Agent as MastraAgent } from "@mastra/core";
import { londonWeatherTool } from "../../tools/weather";

export const welcome = () => {
  return {
    welcome: "Welcome to the Mastra Weather Agent! I can provide historical weather data for London using the Mastra framework.",
    prompts: [
      {
        data: "How many times has it rained this year in London?",
        contentType: "text/plain",
      },
      {
        data: "What was the highest temperature recorded in London this year?",
        contentType: "text/plain",
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
    const londonWeatherAgent = new MastraAgent({
      name: "london-weather-agent",
      instructions: "You are a helpful assistant with access to historical information about London weather. The data is provided to you from January 1st of the current calendar year up to today. Answer the user's question using that data.",
      model: openai("gpt-4o-mini"),
      tools: { londonWeatherTool },
    });

    const userInput = await req.data.text();
    const result = await londonWeatherAgent.generate(userInput ?? "How many times has it rained this year in London?");

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error("Error running weather agent:", error);
    return resp.text("Sorry, there was an error processing your weather request.");
  }
}
