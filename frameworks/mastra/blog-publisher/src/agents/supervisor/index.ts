// src/index.ts
import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import { publisherAgent } from "./agents";

export const welcome = () => ({
  welcome: "Ask for a blog-post topic and I’ll draft & polish it for you.",
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext,
) {
  try {
    const topic = (await req.data.text())?.trim();
    if (!topic) return resp.text("Please give me a topic 🙂");

    const result = await publisherAgent.generate(topic);

    // grab the *last* toolResult that contains a .copy field
    const copy =
      result.steps          // every model/tool turn
        ?.slice()           // clone
        .reverse()          // look from the end
        .flatMap(s => s.toolResults ?? [])
        .find(tr => tr?.result?.copy)
        ?.result?.copy ??   // preferred
      result.text ??        // fallback if the model itself replied
      "No content produced";

    return resp.text(copy);
  } catch (err) {
    ctx.logger.error("blog-publisher error:", err);
    return resp.text("Sorry, something went wrong.");
  }
}
