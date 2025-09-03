import { createTool } from "@mastra/core";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";

export const copywriterTool = createTool({
	id: "copywriter-agent",
	description: "Calls the copywriter agent to write blog post copy",
	inputSchema: z.object({
		topic: z.string().describe("The topic to write about"),
	}),
	outputSchema: z.object({
		copy: z.string(),
	}),
	execute: async ({ context }) => {
		const copywriterAgent = new Agent({
			name: "copywriter-agent",
			instructions: "You are a copywriter agent that writes blog post copy.",
			model: anthropic("claude-3-5-sonnet-20241022"),
		});

		const result = await copywriterAgent.generate(
			`Create a blog post about ${context.topic}`,
		);

		return {
			copy: result.text,
		};
	},
});
