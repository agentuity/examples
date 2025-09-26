import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { copywriterTool } from '../../tools/copywriter';

export function welcome() {
	return {
		message: "I'm a supervisor agent that coordinates copywriting, editing, and publishing workflows using the Mastra framework. I manage three specialized agents: a copywriter for initial content creation, an editor for refinement, and act as a publisher to supervise the entire process.",
		prompts: [
			"Write a blog post about artificial intelligence",
			"Create content about sustainable technology trends",
			"Generate a post about the future of remote work"
		]
	};
}

export default async function AgentuityAgent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	const topic = await req.data.text() ?? "artificial intelligence";

	try {
		const copywriterAgent = new Agent({
			name: "copywriter-agent",
			instructions: "You are a copywriter agent that writes blog post copy.",
			model: openai("gpt-4o"),
		});

		const editorAgent = new Agent({
			name: "editor-agent", 
			instructions: "You are an editor agent that refines the content.",
			model: openai("gpt-4o"),
		});

		const publisherAgent = new Agent({
			name: "publisher-agent",
			instructions: "You are a publisher agent that supervises and coordinates the other agents.",
			model: openai("gpt-4o"),
			tools: { copywriterTool },
		});

		const result = await publisherAgent.generate(
			`Create a blog post about ${topic}`,
			{ maxSteps: 5 }
		);

		return resp.text(result.text);
	} catch (error) {
		ctx.logger.error(
			'Error in supervisor agent workflow: %s',
			error instanceof Error ? error.message : String(error)
		);

		return resp.text(
			"I'm sorry, I encountered an error while coordinating the content creation workflow."
		);
	}
}
