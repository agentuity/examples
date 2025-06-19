import { openai } from "@ai-sdk/openai";
import { Agent as MastraAgent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/* Custom tool */
const getCatFact = async () => {
  const { fact } = (await fetch("https://catfact.ninja/fact").then(r => r.json())) as { fact: string };
  return fact;
};

const catFact = createTool({
  id: "Get cat facts",
  inputSchema: z.object({}),          // no inputs
  description: "Fetches cat facts",
  execute: async () => ({
    catFact: await getCatFact(),
  }),
});

/* System prompt */
const instructions = `
You are a helpful cat-expert assistant.  
When discussing cats, always weave in an interesting, verified cat fact (via the catFact tool).

Responsibilities:
1. Answer questions about cats
2. Use the catFact tool to provide verified cat facts
3. Incorporate the cat facts naturally into your responses

Always use the catFact tool at least once in your responses to ensure accuracy.`;

/*Mastra agent */
export const catFactExpert = new MastraAgent({
  name: "cat-fact-expert",
  instructions,
  model: openai("gpt-4o-mini"),
  tools: { catFact },
});
