import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
// import { generateObject } from "ai";
import OpenAI from "openai";
import { rfpSimple } from "../rfpSimple";

const EXTRACTION_PROMPT = `You are an assistant that extracts fields from a form or document to create a JSON schema.

Follow these steps exactly:

1. Read the document carefully.
2. Identify only explicitly labeled or named fields.
3. For each field, output a JSON key exactly matching the field name.
4. For each field, provide a "type" based on the field name.
5. For each field, provide a null "content" value.
6. Provide a "description" that uses only the text given in or near the field label — add a description if none is provided.
7. Do NOT add or infer any additional fields or information.
8. Output a single valid JSON object, nothing else.

Example output:

{
	"Full Name": {
		"content": null,
		"description": "Applicant's full legal name"
	},
	"Date of Birth": {
		"content": null,
		"description": "Applicant's birth date"
	}
}`;

const openai = new OpenAI();

export const welcome = () => {
	return {
		welcome:
			"Welcome to the RFP Schema Agent! I can help you generate a JSON Schema for a provided RFP document.",
		prompts: [
			{
				data: rfpSimple,
				contentType: "text/plain",
			},
		],
	};
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	const contentType = req.data.contentType;
	ctx.logger.info(`Content type: ${contentType}`);

	let buffer = null;
	if (
		contentType &&
		(contentType.startsWith("image/") || contentType === "application/pdf")
	) {
		buffer = await req.data.buffer();
	}

	if (contentType && contentType.startsWith("image/")) {
		// Handle image
		if (!buffer) {
			return resp.json({ error: "No image buffer received." });
		}
		const base64Image = Buffer.from(buffer).toString("base64");
		const response = await openai.responses.create({
			model: "gpt-4o-mini",
			input: [
				{
					role: "user",
					content: [
						{
							type: "input_text",
							text: EXTRACTION_PROMPT,
						},
						{
							type: "input_image",
							image_url: `data:${contentType};base64,${base64Image}`,
							detail: "auto",
						},
					],
				},
			],
		});
		try {
			const json = JSON.parse(response.output_text);
			return resp.json(json);
		} catch (e) {
			return resp.json({ error: "Invalid JSON generated from image input." });
		}
	} else if (contentType === "application/pdf") {
		// Handle PDF as file input to OpenAI
		if (!buffer) {
			return resp.json({ error: "No PDF buffer received." });
		}
		const base64String = buffer.toString("base64");
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "file",
							file: {
								filename: "document.pdf",
								file_data: `data:application/pdf;base64,${base64String}`,
							},
						},
						{
							type: "text",
							text: EXTRACTION_PROMPT,
						},
					],
				},
			],
		});
		try {
			const json = JSON.parse(response.choices[0].message.content ?? "{}");
			return resp.json(json);
		} catch (e) {
			return resp.json({ error: "Invalid JSON generated from PDF input." });
		}
	} else if (contentType && contentType.startsWith("text/")) {
		// Handle plain text
		const text = await req.data.text();
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: EXTRACTION_PROMPT,
				},
				{
					role: "user",
					content: text,
				},
			],
		});
		try {
			const json = JSON.parse(response.choices[0].message.content ?? "{}");
			return resp.json(json);
		} catch (e) {
			return resp.json({ error: "Invalid JSON generated from text input." });
		}
	} else {
		return resp.json({ error: "Unsupported file type." });
	}
}
