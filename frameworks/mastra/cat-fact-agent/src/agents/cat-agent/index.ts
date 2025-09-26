import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import { catFactExpert } from "./cat";

export const welcome = () => ({
  welcome: "Ask me anything about cats and I’ll drop a fun fact! 😸",
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userInput = (await req.data.text()) ?? "Tell me a cat fact";
    const result    = await catFactExpert.generate(userInput);
    return resp.text(result.text);
  } catch (err) {
    ctx.logger.error("Error running cat-fact-expert:", err);
    return resp.text("😿 Sorry, something went wrong.");
  }
}
