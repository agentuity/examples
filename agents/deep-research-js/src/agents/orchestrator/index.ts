import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const SYSTEM_PROMPT = `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.`;

  export const SearchResultSchema = z.object({
	title: z.string(),
	url: z.string().url(),
	content: z.string(),
});

export const SearchResultsSchema = z.object({
	searchResults: z.array(SearchResultSchema),
	message: z.string(),
});

export const LearningSchema = z.object({
	learning: z.string(),
	followUpQuestions: z.array(z.string()),
});

export const ResearchSchema = z.object({
	query: z.string(),
	queries: z.array(z.string()),
	searchResults: z.array(SearchResultSchema),
	learnings: z.array(LearningSchema),
	completedQueries: z.array(z.string()),
});

export const DeepResearchSchema = z.object({
	query: z.string().min(1),
	deepth: z.number().min(1).max(5).optional(),
	breadth: z.number().min(1).max(5).optional(),
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
const request = DeepResearchSchema.parse(await req.data.json());
	const input = request.query;
	const depth = request.deepth ?? 2;
	const breadth = request.breadth ?? 3;

	const researcher = tool({
		description: "Researcher agent",
		parameters: DeepResearchSchema,
		async execute() {
			const researcher = await ctx.getAgent({ name: "researcher" });
			if (!researcher) {
				return resp.text("Researcher agent not found", {
					status: 500,
					statusText: "Agent Not Found",
				});
			}
			console.log("Starting research...");
			const researchResults = await researcher.run({
				data: {
					query: input,
					depth,
					breadth,
				},
			});
			const research = ResearchSchema.parse(await researchResults.data.json());
			console.log("Research completed!");
			return research;
		},
	});

	const author = tool({
		description: "Author agent",
		parameters: ResearchSchema,
		async execute(research) {
			const author = await ctx.getAgent({ name: "author" });
			if (!author) {
				return resp.text("Author agent not found", {
					status: 500,
					statusText: "Agent Not Found",
				});
			}
			console.log("Generating report...");
			// Make a copy of research with all properties defined
			const agentResult = await author.run({ data: research });
			const report = await agentResult.data.text();
			console.log("Report generated! report.md");

			return report;
		},
	});

	const report = await generateText({
		model: anthropic("claude-3-5-sonnet-latest"),
		system: SYSTEM_PROMPT,
		prompt: input,
		maxSteps: 5,
		tools: {
			researcher,
			author,
		},
	});

	return resp.markdown(report.text);
}
