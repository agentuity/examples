import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import OpenAI from "openai";
export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	ctx.logger.info("Content Type:", req.data.contentType);
	let data = await req.data.json();

	ctx.logger.info("Data:", data);

	return resp.text("Hello, world!");
}
