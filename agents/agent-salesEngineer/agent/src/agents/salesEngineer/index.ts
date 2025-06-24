import type {
	AgentContext,
	AgentRequest,
	AgentResponse,
	Json,
} from "@agentuity/sdk";
import { OpenAI } from "openai";

export const welcome = () => {
	return {
		welcome:
			"Welcome to the Sales Engineer Agent! I can help you fill out an RFP document with the correct information!",
	};
};

type InputType = {
	sessionId: string;
	userMessage: string;
	template?: string;
	templateContentType?: string;
};

type KVType = {
	jsonObject: Json;
	history: string;
};

const client = new OpenAI();

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	/**
	 * STEP 1: Check if the session has existing data to use, and if so load it.
	 * If not, use the values passed into the agent.
	 */
	try {
		ctx.logger.info("Content Type:", req.data.contentType);
		let data = (await req.data.json()) as InputType;
		const { userMessage } = data;
		ctx.logger.info("Data:", data);

		let template, jsonObject, history;
		let prevDataResult = await ctx.kv.get("sessions", data.sessionId);
		if (prevDataResult.exists) {
			let prevData = (await prevDataResult.data.json()) as KVType;
			jsonObject = prevData.jsonObject;
			history = prevData.history;
		} else {
			if (!data.template) {
				throw new Error("Template is required for new sessions");
			}
			let buf: Buffer;
			try {
				buf = Buffer.from(data.template, "base64");
			} catch (error) {
				throw new Error("Invalid base64 template encoding");
			}
			let agent = await ctx.getAgent({ name: "rfpSchema" });
			let result = await agent.run({
				data: buf,
				contentType: data.templateContentType,
			});
			jsonObject = await result.data.json();
			history = `User: ${userMessage}`;
		}
		try {
			/**
			 * STEP 2: Fill in the JSON OBJECT with the USER MESSAGE.
			 */
			ctx.logger.info("Old JSON Object:", jsonObject);
			const result1 = await client.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{
						role: "user",
						content: `
You are given the following:

- [JSON OBJECT]: ${JSON.stringify(jsonObject)}
- [USER MESSAGE]: ${JSON.stringify(userMessage)}
- [CONVERSATION HISTORY]: ${JSON.stringify(history)}

Your task is to fill in the missing or null fields in the [JSON OBJECT] using relevant information from the [USER MESSAGE] and [CONVERSATION HISTORY].

🚫 DO NOT:
- Remove any fields.
- Add any new fields.
- Make up **any** information. It must come directly (and primarily) from the [USER MESSAGE] or (secondarily) from the [CONVERSATION HISTORY].
- Overwrite existing values (i.e., values that are not null or not empty).
- Change field formats or structure.

✅ DO:
- Only update fields where the value is explicitly null, empty, or incomplete.
- Return the full JSON object exactly as given, with updated values for null fields.

Return only a valid JSON object that is parsable by JSON.parse(). No extra text or formatting.

Your output must be a **valid and complete JSON object**, with all original keys preserved.
      `,
					},
				],
				response_format: { type: "json_object" },
			});

			// Parse the updated JSON object from result1, this should now contain the most up to date JSON object, accounting for the user message.
			const updatedJsonObject =
				typeof result1.choices?.[0]?.message?.content === "string"
					? JSON.parse(result1.choices[0].message.content)
					: result1.choices[0].message.content;

			ctx.logger.info("New JSON Object:", updatedJsonObject);

			/**
			 * STEP 3: Analyze the TEMPLATE and JSON OBJECT, and come up with a question to ask the user if needed.
			 * If the JSON OBJECT is complete, return a done flag.
			 */
			const result2 = await client.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: `You are an assistant helping to collect RFP information.

You are given:
- A [JSON OBJECT] that may be partially filled out.
- A [CONVERSATION HISTORY] between the user and the assistant.
- A [USER MESSAGE] that the user has sent to the assistant.

Your task:
1. Check if the [JSON OBJECT] is complete.
   - A field is complete if its "content" is not null and contains meaningful information.
2. If applicable, check if the [USER MESSAGE] is a question.
   - If the [USER MESSAGE] is a question, make sure to generate a comprehensive answer to the question.
3. If any fields are incomplete in the [JSON OBJECT], ask the user for the missing information.
   - Keep your tone light and conversational — don't sound like you're conducting a formal interview.
   - Ask only one to three questions at a time, ideally ones that feel natural or connected to the ongoing conversation.
   - Use the [CONVERSATION HISTORY] to guide your tone or build on what the user has already shared.
   - If the user has a question, make sure to answer it before asking your next question. You can respond to the user's comment and then smoothly follow up with one or two of your own questions. This should feel like a natural back-and-forth.

Return a JSON object in the following format:

{
  "message": "Your friendly response to the user, followed by one to three natural follow-up questions (or just a final message with no question if everything is complete)",
  "done": true or false // true only if all fields in the JSON object are complete
}

The JSON Object is: ${JSON.stringify(updatedJsonObject)}  
The Conversation History is: ${JSON.stringify(history)}
The Most Recent User Message is: ${JSON.stringify(userMessage)}
`,
					},
				],
				response_format: { type: "json_object" },
			});

			// Parse the result2 output, this should now contain the question to ask the user if needed.
			const analysis =
				typeof result2.choices?.[0]?.message?.content === "string"
					? JSON.parse(result2.choices[0].message.content)
					: result2.choices[0].message.content;

			// Store the latest template and updatedJsonObject in the session
			await ctx.kv.set("sessions", data.sessionId, {
				jsonObject: updatedJsonObject,
				history: `${history}\nUser:${userMessage}\nYou${analysis.message}`,
			});

			// If done, fill in the template with the JSON values
			let filledTemplate = null;
			if (analysis.done) {
				let agent = await ctx.getAgent({ name: "rfpGenerator" });
				let result = await agent.run({
					data: updatedJsonObject,
				});
				filledTemplate = await result.data.text();
			}

			return resp.json({
				message: analysis.message,
				done: analysis.done,
				filledTemplate,
			});
		} catch (error) {
			ctx.logger.error("Error processing request:", error);
			return resp.json({
				error: "An error occurred while processing the request",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	} catch (e) {
		return resp.json({ error: e, message: "Bad input." });
	}
}
