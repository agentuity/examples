import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import { openai } from "@ai-sdk/openai";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { generateText } from "ai";

export const welcome = () => {
	return {
		prompts: [
			{
				data: "Find the contact with record ID `003bn00000PeAv8AAF` and return their full name",
				contentType: "text/plain",
			},
		],
	};
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext,
) {
	try {
		const prompt = await req.data.text();

		if (!prompt) {
			return resp.text("No prompt provided.");
		}

		// Instantiate Composio with your API key
		const composio = new Composio({
			apiKey: process.env.COMPOSIO_API_KEY,
			provider: new VercelProvider(),
		});

		// TASK: Run the user's prompt against the CRM tools

		// Set the tools/toolkits for the provided user in Composio
		// (utilizing their connections for authentication)
		const crm_tools = await composio.tools.get("user_12345", {
			toolkits: ["SALESFORCE"],
		});

		const crm_result = await generateText({
			model: openai("gpt-4o-mini"),
			system: `You are a CRM agent that can use Salesforce tools to find, update, and extract information from CRM objects. You have been provided tools specifically for Salesforce. Use these tools to complete the requested task. When asked to find information, use the tools to retrieve the data and then extract the specific requested information from the results.

		  If you're asked to provide a response, include ONLY the response, no other text.`,
			prompt,
			tools: crm_tools,
			toolChoice: "auto",
			maxSteps: 5,
		});

		// Log tool calls and their results
		if (crm_result.toolCalls && crm_result.toolCalls.length > 0) {
			ctx.logger.info("CRM Tool calls made: %o", crm_result.toolCalls);
		}

		if (crm_result.toolResults && crm_result.toolResults.length > 0) {
			ctx.logger.info("CRM Tool results: %o", crm_result.toolResults);
		}

		// TASK: Save the result to a Google Sheet

		// Set the tools/toolkits for the provided user in Composio
		// (utilizing their connections for authentication)
		const sheet_tools = await composio.tools.get("user_12345", {
			tools: ["GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND"],
		});

		const sheet_result = await generateText({
			model: openai("gpt-4o-mini"),
			system: `In spreadsheet ID "1FA7Y_h52rjs_pDNbHAnTDZZbDCQIA2g4lVed0PgIGgc" on sheet with name "Lead_Names", append a new row with the following value in the first column:
      
      ${crm_result.text}`,
			prompt,
			tools: sheet_tools,
			toolChoice: "auto",
			maxSteps: 5,
		});

		// Log tool calls and their results
		if (sheet_result.toolCalls && sheet_result.toolCalls.length > 0) {
			ctx.logger.info("Sheet Tool calls made: %o", sheet_result.toolCalls);
		}

		if (sheet_result.toolResults && sheet_result.toolResults.length > 0) {
			ctx.logger.info("Sheet Tool results: %o", sheet_result.toolResults);
		}

		// Return the result of the CRM tool call (the contact's full name)
		return resp.text(crm_result.text);
	} catch (error) {
		ctx.logger.error("Error running agent:", error);

		return resp.text("Sorry, there was an error processing your request.");
	}
}
