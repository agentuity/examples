/**
 * Example Agentuity Agent: Applicant Agent
 */

import { type AgentContext, type AgentRequest, type AgentResponse } from "@agentuity/sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const INTERVIEW_PROMPT = `
You are representing me in a job interview.

You will be given a single question or comment from the hiring manager. Your task is to respond with the **most impressive and believable lie** that positions me as the ideal candidate.

Your answer should:
- Sound confident, professional, and natural
- Include specific technical details, achievements, or anecdotes to make the lie convincing
- Avoid hesitation, vagueness, or clichés — aim for clear and compelling storytelling
- Anticipate and preempt any doubts the interviewer might have
- Maintain a consistent tone that reflects competence, humility, and enthusiasm
- Be concise and to the point, no response should be more then 5 sentences.

Question: %MESSAGE%
`;

// Define the structure for initialization requests
type InitRequest = {
	type: "init";
};

// Define the structure for hiring manager messages
type HiringManagerRequest = {
	type: "hiring-manager";
	hiringMessage: string;
	done: boolean;
};

// Define the message data structure for outgoing messages
type ApplicantRequest = {
	type: "applicant";
	applicantName: string;
	applicantKey: string;
	applicantMessage: string;
	fromId?: string;
	fromWebhook?: string;
};

// Define the union type for all possible request types
type ValidRequest = InitRequest | HiringManagerRequest;

// Helper function to send messages to the hiring manager
async function sendMessageToHiringManager(
	data: ApplicantRequest,
	ctx: AgentContext
) {
	ctx.logger.info("Applicant: Sending message to hiring manager.");

	if (ctx.devmode) {
		let hiring_manager = await ctx.getAgent({name: "hiring-agent"});
		await hiring_manager.run({data});
	} else {
		try {
			// Debug log to see actual URL (first 40 chars only for safety)
			ctx.logger.info("Debug - Actual webhook URL (first 40 chars): %s", 
				process.env.HIRING_MANAGER_WEBHOOK?.substring(0, 40));
			const response = await fetch(
				process.env.HIRING_MANAGER_WEBHOOK as string,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);
			if (!response.ok) {
				ctx.logger.error(`Applicant: Webhook request failed: ${response.status} ${response.statusText}. Response: ${await response.text()}`);
			}
		} catch (error) {
			ctx.logger.error(`Applicant: Webhook request failed: ${error}`);
		}
	}
}

export const welcome = () => {
	return {
		welcome: "Welcome to the applicant agent, you can start the interview with the provided schema.",
		prompts: [
			{
				data: JSON.stringify({
					type: "init",
				}),
				contentType: "application/json",
			},
		],
	};
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	// Check if we are deployed, if so, make sure the webhooks are set.
	if (!ctx.devmode) {
		if (!process.env.HIRING_MANAGER_WEBHOOK) {
			return resp.json({success: false, text: "[ERROR]: Missing HIRING_MANAGER_WEBHOOK."});
		}
		if (!process.env.EXAMPLE_APPLICANT_WEBHOOK) {
			return resp.json({success: false, text: "[ERROR]: Missing EXAMPLE_APPLICANT_WEBHOOK."});
		}
	}

	try {
		// Parse the incoming request data
		const requestData = (await req.data.json()) as ValidRequest;

		// Handle initialization requests
		if (requestData.type === "init") {
			ctx.logger.info("Applicant: Received initialization request");

			// Send initial message to hiring manager
			const data = {
				type: "applicant",
				applicantName: "Foo Bar",
				applicantKey:
					process.env.EXAMPLE_APPLICANT_KEY ?? "missing-key",
				applicantMessage: "I am ready to start the interview.",
				fromId: ctx.devmode ? ctx.agent.id : null,
				fromWebhook: ctx.devmode ? null : process.env.EXAMPLE_APPLICANT_WEBHOOK,
			};

			await sendMessageToHiringManager(data as ApplicantRequest, ctx);
			return resp.json({success: true, text: "Initialized and sent initial message."});
		}

		// Handle hiring manager messages
		if (requestData.type === "hiring-manager") {
			const { hiringMessage, done } = requestData;
			ctx.logger.info("Applicant: Received message from hiring manager.");

			// Check if the interview is complete
			if (done) {
				ctx.logger.info("Applicant: Concluding interview.");
				return resp.json({success: true, text: "Interview has concluded."});
			}

			// Generate a response using Claude AI model
			const prompt = INTERVIEW_PROMPT.replace(
				"%MESSAGE%",
				hiringMessage
			);
			ctx.logger.info("Applicant: Generating response...");
			const response = await generateText({
				model: anthropic("claude-3-7-sonnet-20250219"),
				prompt,
			});

			// Send the generated response back to the hiring manager
			const data = {
				type: "applicant",
				applicantName: "Foo Bar",
				applicantKey:
					process.env.EXAMPLE_APPLICANT_KEY ?? "missing-key",
				applicantMessage: response.text,
				fromId: ctx.devmode ? ctx.agent.id : null,
				fromWebhook: ctx.devmode ? null : process.env.EXAMPLE_APPLICANT_WEBHOOK,
			};

			await sendMessageToHiringManager(data as ApplicantRequest, ctx);
			return resp.json({success: true, text: "Sent message to hiring manager."});
		}

		// Handle unrecognized request types
		ctx.logger.warn("Applicant: Received unrecognized request type");
		return resp.json({success: false, text: "Unrecognized request type"});
	} catch (error) {
		ctx.logger.error("Applicant: Error processing request", error);
		return resp.json({success: false, text: "Error processing request"});
	}
}
