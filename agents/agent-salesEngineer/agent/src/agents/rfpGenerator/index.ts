import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import OpenAI from "openai";

const openai = new OpenAI();

// Example RFP JSON object matching the field schema
const exampleRfp = {
	"Project Title": {
		type: "string",
		content: "Website Redesign",
		description: "The title of the RFP project",
	},
	"RFP Number": {
		type: "string",
		content: "2024-001",
		description: "Unique identifier for the RFP",
	},
	"Date Issued": {
		type: "date",
		content: "2024-07-01",
		description: "Date the RFP was issued",
	},
	"Response Due Date": {
		type: "date",
		content: "2024-07-15",
		description: "Deadline for proposal submissions",
	},
	"Contact Information": {
		type: "object",
		content: {
			Name: {
				type: "string",
				content: "Jane Doe",
				description: "Contact person's name",
			},
			Email: {
				type: "string",
				content: "jane.doe@example.com",
				description: "Contact email address",
			},
			Phone: {
				type: "string",
				content: "+1-555-123-4567",
				description: "Contact phone number",
			},
		},
		description: "Contact details for questions about the RFP",
	},
	Introduction: {
		type: "string",
		content:
			"We are seeking proposals for a complete redesign of our corporate website.",
		description: "Brief background and purpose of the RFP",
	},
	"Project Overview": {
		type: "string",
		content:
			"The project includes a new design, improved UX, and integration with our CMS.",
		description: "Overview of the project scope and goals",
	},
	"Scope of Work": {
		type: "array",
		content: [
			"Design new website layout",
			"Implement responsive design",
			"Integrate with CMS",
			"Migrate existing content",
		],
		description: "List of tasks and deliverables required",
	},
	Timeline: {
		type: "array",
		content: [
			{ Milestone: "RFP Issued", Date: "2024-07-01" },
			{ Milestone: "Proposal Submission Due", Date: "2024-07-15" },
			{ Milestone: "Vendor Selection", Date: "2024-07-22" },
			{ Milestone: "Project Start", Date: "2024-08-01" },
			{ Milestone: "Project Completion", Date: "2024-12-01" },
		],
		description: "Project milestones and dates",
	},
	"Proposal Requirements": {
		type: "array",
		content: [
			"Company Overview",
			"Relevant Experience",
			"Project Approach",
			"Team Composition",
			"Pricing",
		],
		description: "Required sections for submitted proposals",
	},
	"Evaluation Criteria": {
		type: "array",
		content: ["Technical Approach", "Relevant Experience", "Cost", "Timeline"],
		description: "Criteria for evaluating proposals",
	},
	"Submission Instructions": {
		type: "string",
		content:
			"Submit proposals via email to jane.doe@example.com by 5pm on July 15, 2024.",
		description: "How and when to submit proposals",
	},
	"Terms and Conditions": {
		type: "string",
		content: "All submitted proposals will be kept confidential.",
		description: "Legal terms and confidentiality statement",
	},
};

export const welcome = () => {
	return {
		welcome:
			"Welcome to the PDF Generator Agent! I can help you generate a professional RFP Markdown document from your JSON data.",
		prompts: [
			{
				data: exampleRfp,
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
	try {
		// Parse the JSON object from the request
		const rfpData = await req.data.json();
		ctx.logger.info("Received RFP data: %o", rfpData);

		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "user",
					content: `
You are an expert at generating professional RFP (Request for Proposal) documents.
Given the following JSON object containing RFP data, generate a clean, well-structured Markdown document that represents the RFP.

Requirements:
- Use semantic Markdown (headings, lists, tables for timelines, etc.)
- Make the output visually clear and print-friendly
- Do not include any extra text or explanations, only the Markdown document

RFP Data:
${JSON.stringify(rfpData, null, 2)}
					`,
				},
			],
		});

		const markdown =
			completion.choices?.[0]?.message?.content ||
			"Error generating RFP Markdown.";
		ctx.logger.info("Generated Markdown length: %d", markdown.length);
		return resp.text(markdown, { "content-type": "text/markdown" });
	} catch (e) {
		ctx.logger.error("Error generating RFP Markdown: %o", e);
		return resp.text("Error generating RFP Markdown.", {
			"content-type": "text/markdown",
		});
	}
}
