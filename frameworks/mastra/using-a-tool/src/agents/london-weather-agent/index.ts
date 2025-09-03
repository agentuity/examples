import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import { londonWeatherTool } from "../../tools/london-weather-tool";

export function welcome() {
	return {
		message: "I'm a London weather assistant with access to historical weather data for the current year. I can help you analyze weather patterns, trends, and specific data points.",
		prompts: [
			"How many times has it rained this year?",
			"What was the highest temperature recorded this year?",
			"Show me the weather trends for the past month",
			"What's the average rainfall so far this year?",
		],
	};
}

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	try {
		const prompt = req.text() ?? "What is the weather data for London this year?";

		const londonWeatherAgent = new Agent({
			name: "london-weather-agent",
			description: "Provides historical information about London weather",
			instructions: `You are a helpful assistant with access to historical weather data for London.
			
The data is provided for the current calendar year from January 1st up to today. When responding:
- Use the londonWeatherTool to fetch current year's weather data for London
- The data includes daily temperature maximums and minimums, rainfall, wind speed, and snowfall
- Answer the user's question using that data
- Keep responses concise, factual, and informative
- If the question cannot be answered with available data, say so clearly`,
			model: openai("gpt-4o"),
			tools: { londonWeatherTool },
		});

		const result = await londonWeatherAgent.generate(prompt);
		return resp.text(result.text);
	} catch (error) {
		ctx.logger.error(
			"Error generating response: %s",
			error instanceof Error ? error.message : String(error),
		);

		return resp.text(
			"I'm sorry, I encountered an error while processing your request.",
		);
	}
}
