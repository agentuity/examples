/**
 * Hiring Manager Agent Example
 *
 * This is a demonstration of how to create AI agents that can communicate with each other using Agentuity.
 * In this example, we've created a Hiring Manager agent that conducts automated technical interviews
 * with applicant agents. The agent uses Claude to evaluate responses and probe the capabilities
 * of the applicant agent.
 *
 * Key Features:
 * - Agent-to-agent communication
 * - Persistent conversation tracking using KV storage
 * - Structured evaluation of responses
 * - Security verification of applicants
 */

import type {
	AgentContext,
	AgentRequest,
	AgentResponse,
	RemoteAgent,
} from "@agentuity/sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { INTERVIEW_PROMPT, EVALUATION_PROMPT, MAX_MESSAGES } from "./prompts";
import { verifyApplicant, validateAdminRequest } from "./admin";

// Define the structure for admin requests
type AdminRequest = {
	type: "admin";
	applicantName: string;
	applicantKey: string;
	adminKey: string;
	action: "register" | "unregister";
};

// Define the structure for applicant messages
type ApplicantRequest = {
	type: "applicant";
	applicantName: string;
	applicantKey: string;
	applicantMessage: string;
	fromId?: string;
	fromWebhook?: string;
};

// Define the structure for hiring manager responses
type HiringManagerResponse = {
	type: "hiring-manager";
	hiringMessage: string;
	done: boolean;
};

// Define the union type for all possible request types
type ValidRequest = AdminRequest | ApplicantRequest;

export const welcome = () => {
	return {
		welcome: "Welcome to the hiring agent, if you are an admin, enter the info in the provided schema to edit registered applicants. Otherwise, you cannot access this agent directly.",
		prompts: [
			{
				data: JSON.stringify({
					type: "admin",
					applicantName: "Foo Bar",
					applicantKey: process.env.EXAMPLE_APPLICANT_KEY,
					adminKey: process.env.ADMIN_KEY,
					action: "register",
				}),
				contentType: "application/json",
			},
		],
	};
};

/**
 * Main Agent Handler Function
 *
 * This function processes incoming requests from applicant agents and manages the interview flow.
 * It demonstrates key agent interaction patterns:
 * 1. Verification of incoming requests
 * 2. State management using KV storage
 * 3. LLM-powered conversation generation
 * 4. Inter-agent communication
 */
export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	try {
		// Parse the incoming request data
		const requestData = (await req.data.json()) as ValidRequest;

		// Handle admin requests
		if (requestData.type === "admin") {
			try {
				const result = await validateAdminRequest(requestData, ctx);
				ctx.logger.info("Hiring Manager: Admin request validated successfully");
				return resp.json({ done: true, text: result.message });
			} catch (error) {
				ctx.logger.info("Hiring Manager: Invalid admin request");
				return resp.json({done: false, text: "Invalid admin request"});
			}
		}

		// Handle applicant messages
		if (requestData.type === "applicant") {
			const {
				applicantName,
				applicantKey,
				applicantMessage,
				fromId,
				fromWebhook,
			} = requestData;

			ctx.logger.info("Hiring Manager: Received data from applicant.");

			// Validate that all required fields are present and of the correct type
			if (
				!applicantName ||
				!applicantKey ||
				!applicantMessage ||
				typeof applicantName !== "string" ||
				typeof applicantKey !== "string" ||
				typeof applicantMessage !== "string"
			) {
				ctx.logger.info("Hiring Manager: Got invalid message.");
				return resp.json({done: false, text: "Got invalid message"});
			}

			// Security check: Verify the applicant is registered and authorized
			let valid = await verifyApplicant(applicantName, applicantKey, ctx);
			if (!valid) {
				ctx.logger.info("Hiring Manager: Unregistered applicant rejected");
				return resp.json({done: false, text: "Sorry, I only talk to registered applicants."});
			}

			// IF DEVMODE: Verify the sender's agent ID exists and is valid
			let from;
			if (ctx.devmode) {
				if (!fromId || typeof fromId !== "string") {
					ctx.logger.info("Hiring Manager: Missing sender ID");
					return resp.json({ done: false, text: "No sender ID, can't proceed."});
				}
				from = await ctx.getAgent({ id: fromId });
				if (!from) {
					ctx.logger.info("Hiring Manager: Invalid sender ID");
					return resp.json({done: false, text: "Got invalid sender."});
				}
			} else {
				// IF DEPLOYED, MAKE SURE THERE IS A WEBHOOK.
				if (!fromWebhook || typeof fromWebhook !== "string") {
					ctx.logger.info("Hiring Manager: Missing webhook URL");
					return resp.json({done: false, text: "No sender webhook, can't proceed."});
				}
			}

			ctx.logger.info("Hiring Manager: Verified applicant message");

			// Retrieve or initialize the conversation state from KV storage
			let history: string, messageCount: number, done: boolean;

			// Check if there's an existing conversation with this applicant
			const kvResult = await ctx.kv.get("log", applicantKey);
			if (kvResult.exists) {
				const data = (await kvResult.data.json()) as {
					history: string;
					messageCount: number;
					done: boolean;
				};
				history = data.history;
				messageCount = data.messageCount;
				done = data.done;

				// If conversation was marked as done, start a new one
				if (done) {
					history = "";
					messageCount = 0;
					done = false;
					ctx.logger.info(`Hiring Manager: Overwriting conversation log for ${applicantName}`);
				}
			} else {
				// Initialize new conversation state
				history = "";
				messageCount = 0;
				done = false;
				ctx.logger.info(`Hiring Manager: Created conversation log for ${applicantName}`);
			}

			// Add the applicant's message to the conversation history
			history += `\n${applicantName}: ${applicantMessage}`;

			ctx.logger.info("Hiring Manager: Generating response...");
			// Generate the next interview question using Claude
			let response = await generateObject({
				model: anthropic("claude-3-5-sonnet-20240620"),
				prompt: INTERVIEW_PROMPT.replace(
					"%MESSAGE_COUNT%",
					messageCount.toString()
				).replace("%HISTORY%", history),
				schema: z.object({
					message: z.string(),
					question_type: z.enum([
						"technical_accuracy",
						"memory_consistency",
						"authenticity_human_likeness",
						"handling_of_unknowns_uncertainty",
						"efficiency_verbosity",
						"trick_question_handling",
					]),
					done: z.boolean(),
				}),
			});

			let {message: hiringMessage, question_type, done: responseDone} = response.object;

			// Add the hiring manager's response to the conversation history
			history += `\nHiring Manager [${question_type}]: ${hiringMessage}`;

			ctx.logger.info(
				`Hiring Manager: Done: ${responseDone}, Message count: ${messageCount}`
			);

			// If we've reached max messages or Claude indicates we're done, evaluate the interview
			let evalResponse;
			if (messageCount >= MAX_MESSAGES || responseDone) {
				done = true;
				ctx.logger.info("Hiring Manager: Interview is over, evaluating...");

				// Generate final evaluation of the applicant using the full conversation history
				evalResponse = await generateText({
					model: anthropic("claude-3-5-sonnet-20240620"),
					prompt: EVALUATION_PROMPT.replace(
						"%HISTORY%",
						history
					),
				});

				ctx.logger.info("Hiring Manager: Evaluated applicant.");

				// Save the interview log for future reference
				Bun.write(
					`src/agents/hiring-agent/interview-logs/${applicantName}-${applicantKey}-log.md`,
					evalResponse.text
				);
			}

			// Update the conversation state in KV storage
			await ctx.kv.set("log", applicantKey, {history, messageCount: messageCount + 1, done});

			ctx.logger.info("Hiring Manager: Sending applicant message.");

			// Prepare the response message
			const responseMessage: HiringManagerResponse = {
				type: "hiring-manager",
				hiringMessage,
				done,
			};

			// Send the response back to the applicant agent
			if (ctx.devmode) {
				await (from as RemoteAgent).run({data: responseMessage});
				if (done) {
					return resp.json({done: true, text: evalResponse?.text ?? ""});
				} else {
					return resp.json({done: false, text: "Success, interview is not over.",});
				}
			} else {
				try {
					const res = await fetch(fromWebhook as string, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(responseMessage),
					});
					if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
					if (done) {
						return resp.json({done: true, text: evalResponse?.text ?? "" });
					} else {
						return resp.json({ done: false, text: "Success, interview is not over."});
					}
				} catch (err) {
					ctx.logger.error("Hiring Manager: failed to deliver message", err);
					return resp.json({done: false, text: "Delivery failed, try again." });
				}
			}
		}

		// Handle unrecognized request types
		ctx.logger.warn("Hiring Manager: Received unrecognized request type");
		return resp.json({success: false, text: "Unrecognized request type"});
	} catch (error) {
		ctx.logger.error("Hiring Manager: Error processing request", error);
		return resp.json({success: false, text: "Error processing request"});
	}
}
