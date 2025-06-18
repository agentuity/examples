import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import { Anthropic } from "@anthropic-ai/sdk";
import Riza from "@riza-io/api";
import type { CommandExecParams } from "@riza-io/api/resources/command";

export const welcome = () => {
	return {
		prompts: ["Python", "TypeScript", "Ruby"].map((lang) => ({
			data: `Can you write and execute a simple ${lang} program?`,
			contentType: "text/plain",
		})),
	};
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	const prompt = await req.data.text();
	const anthropic = new Anthropic();
	let msg = await anthropic.messages.create({
		model: "claude-4-opus-20250514",
		system:
			"You are an expert programmer who can solve any problem. Whether that is solving programming problems themselves, or leveraging programming languages to solve real world problems.",
		messages: [{ role: "user" as const, content: prompt }],

		tools: [
			{
				name: "code",
				description: "Execute a program.",
				input_schema: {
					type: "object" as const,
					// Defining the input schema to match what Riza needs: {language, code}.
					properties: {
						language: {
							type: "string",
							description: "The programming language of the code to execute.",
							enum: ["python", "javascript", "ruby", "php", "typescript"],
						},
						code: {
							type: "string",
							description: "The program to execute.",
						},
					},
					required: ["language", "code"],
				},
			},
		],
		max_tokens: 5000,
	});

	let result = "";

	// Create Riza instance for secure code execution in Agentuity
	const riza = new Riza();

	// Iterate through the content blocks from the response, to check for tool use.
	for (let contentBlock of msg.content) {
		if (contentBlock.type === "text") {
			result += contentBlock.text;
		}
		// If Claude wants to use a tool (in this case the only tool is 'code') we can execute the code it wants to through Riza.
		if (contentBlock.type === "tool_use") {
			let input = contentBlock.input as CommandExecParams;
			result += `\n\n### Executing ${input.language} Program\n\`\`\`${input.language}\n${input.code}\n\`\`\`\n`;

			// Use Riza's command execution API to run code safely.
			let execResult = await riza.command.exec(input);

			result += "\n#### Program Output\n```\n";

			// Handle Riza execution results and format for Agentuity response
			if (execResult.exit_code !== 0) {
				result += `Error (Exit Code ${execResult.exit_code}):\n${execResult.stderr}`;
			} else {
				result += execResult.stdout;
			}
			result += "\n```\n";
		}
	}

	return resp.text(result);
}
