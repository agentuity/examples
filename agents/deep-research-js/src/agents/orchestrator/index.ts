import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SYSTEM_PROMPT } from '../../common/prompts';
import { DeepResearchSchema, ResearchSchema } from '../../common/types';

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
