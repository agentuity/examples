import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";

export function welcome() {
  return {
    message: "Welcome to the Mastra Dynamic Context Agent! This agent demonstrates how to create agents that adapt their behavior and capabilities at runtime based on contextual input.",
    prompts: [
      "I'm a free tier user, can you help me with basic documentation?",
      "I'm a pro user, provide detailed technical support",
      "I'm an enterprise customer, I need priority assistance with integration",
      "Can Mastra Cloud handle long-running tasks?",
      "What language should I use for my project?"
    ]
  };
}

export default async function DynamicAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const input = await req.data.text() ?? "Can Mastra Cloud handle long-running tasks?";

    const agent = new Agent({
      name: "Dynamic Support Agent",
      model: openai("gpt-4o-mini"),
      instructions: `You are a customer support agent for Mastra Cloud that adapts responses based on user context.
      
      When users mention their tier level:
      - Free tier: Provide basic help and link to documentation
      - Pro tier: Offer detailed technical support and best practices  
      - Enterprise tier: Provide priority assistance with tailored solutions
      
      When users mention language preferences:
      - Respond in the requested language (en for English, ja for Japanese)
      
      Always be helpful and provide context-appropriate responses based on the user's needs.`,
    });

    let contextualPrompt = input;
    
    if (input.includes("free") || input.includes("basic")) {
      contextualPrompt = `[User Tier: Free] ${input}. Please provide basic help and documentation links.`;
    } else if (input.includes("pro") || input.includes("detailed")) {
      contextualPrompt = `[User Tier: Pro] ${input}. Please provide detailed technical support and best practices.`;
    } else if (input.includes("enterprise") || input.includes("priority")) {
      contextualPrompt = `[User Tier: Enterprise] ${input}. Please provide priority assistance with tailored solutions.`;
    }

    if (input.includes("ja") || input.includes("japanese")) {
      contextualPrompt += " Please respond in Japanese.";
    }

    const result = await agent.generate(contextualPrompt, { maxSteps: 5 });

    ctx.logger.info("Dynamic agent processed request with contextual prompt");

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error("Error in dynamic agent: %s", error);
    return resp.text("Sorry, I encountered an error processing your request. Please try again.");
  }
}
