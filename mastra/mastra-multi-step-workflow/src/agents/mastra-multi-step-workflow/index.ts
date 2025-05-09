import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent, Step, Workflow } from "@mastra/core";
import { z } from "zod";

const copywriterAgent = new Agent({
	name: "Copywriter",
	instructions: "You are a copywriter agent that writes blog post copy.",
	model: anthropic("claude-3-5-sonnet-20241022"),
});

const copywriterStep = new Step({
	id: "copywriterStep",
	execute: async ({ context }) => {
		if (!context?.triggerData?.topic) {
			throw new Error("Topic not found in trigger data");
		}
		const result = await copywriterAgent.generate(
			`Create a blog post about ${context.triggerData.topic}`,
		);
		console.log("copywriter result", result.text);
		return {
			copy: result.text,
		};
	},
});
const editorAgent = new Agent({
	name: "Editor",
	instructions: "You are an editor agent that edits blog post copy.",
	model: openai("gpt-4o-mini"),
});
const editorStep = new Step({
	id: "editorStep",
	execute: async ({ context }) => {
		const copy = context?.getStepResult<{ copy: number }>(
			"copywriterStep",
		)?.copy;

		const result = await editorAgent.generate(
			`Edit the following blog post only returning the edited copy: ${copy}`,
		);
		console.log("editor result", result.text);
		return {
			copy: result.text,
		};
	},
});

export default async function AgentHandler(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	const myWorkflow = new Workflow({
		name: "my-workflow",
		triggerSchema: z.object({
			topic: z.string(),
		}),
	});

	myWorkflow.step(copywriterStep).then(editorStep).commit();

	const { start } = myWorkflow.createRun();

	const results = await start({
		triggerData: { topic: req.text() ?? "React JavaScript frameworks" },
	});
	console.log("Results: ", results);

	return resp.json(results.results);
}
