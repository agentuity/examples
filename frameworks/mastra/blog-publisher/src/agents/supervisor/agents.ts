import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

/* COPYWRITER */
const copywriterAgent = new Agent({
  name: "Copywriter",
  instructions: "You are a copywriter agent that writes blog-post copy.",
  model: anthropic("claude-3-5-sonnet-20241022"),
});

const copywriterTool = createTool({
  id: "copywriter-agent",
  description: "Calls the copywriter agent to write blog post copy.",
  inputSchema: z.object({
    topic: z.string().describe("Blog post topic"),
  }),
  outputSchema: z.object({
    copy: z.string().describe("Blog post copy"),
  }),
  execute: async ({ context }) => {
    console.log("🛠️ Copywriter tool executing...");
    console.log("📥 Input context.topic:", context.topic);

    const result = await copywriterAgent.generate(
      `Create a blog post about ${context.topic}`,
    );

    console.log("✅ Copywriter response:", result.text);
    return { copy: result.text };
  },
});

/* EDITOR */
const editorAgent = new Agent({
  name: "Editor",
  instructions: "You are an editor agent that refines blog-post copy.",
  model: openai("gpt-4o-mini"),
});

const editorTool = createTool({
  id: "editor-agent",
  description: "Calls the editor agent to edit blog post copy.",
  inputSchema: z.object({
    copy: z.string().describe("Blog post copy"),
  }),
  outputSchema: z.object({
    copy: z.string().describe("Edited blog post copy"),
  }),
  execute: async ({ context }) => {
    console.log("✏️ Editor tool executing...");
    console.log("📥 Input context.copy:", context.copy);

    const result = await editorAgent.generate(
      `Edit the following blog post only returning the edited copy: ${context.copy}`,
    );

    console.log("✅ Editor response:", result.text);
    return { copy: result.text };
  },
});

/* PUBLISHER (supervisor) */
export const publisherAgent = new Agent({
  name: "blog-publisher-supervisor",
  instructions:
    "First call the copywriter tool to draft a post on the requested topic, " +
    "then call the editor tool to refine it. " +
    "Return **only** the final edited copy.",
  model: anthropic("claude-3-5-sonnet-20241022"),
  tools: { copywriterTool, editorTool },
});
