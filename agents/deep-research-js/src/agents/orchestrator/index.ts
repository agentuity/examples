import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import {
	DeepResearchSchema,
	ResearchSchema,
	type Research,
} from "../../common/types";

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	const request = DeepResearchSchema.parse(await req.data.json());
	const input = request.query;
	const depth = request.depth ?? 2;
	const breadth = request.breadth ?? 3;
	const maxResults = request.maxResults ?? 20;

	const researcherAgent = async () => {
		const researcher = await ctx.getAgent({ name: "researcher" });
		if (!researcher) {
			throw new Error("Researcher agent not found");
		}
		ctx.logger.info("Starting research...");
		ctx.logger.info(
			`Researching: ${input} with depth: ${depth} and breadth: ${breadth}`
		);
		const researchResults = await researcher.run({
			data: {
				query: input,
				depth,
				breadth,
				maxResults,
			},
		});
		ctx.logger.info("Research completed, processing results...");
		const research = ResearchSchema.parse(await researchResults.data.json());
		ctx.logger.info("Research completed!");
		return research;
	};

	const authorAgent = async (research: Research) => {
		const author = await ctx.getAgent({ name: "author" });
		if (!author) {
			throw new Error("Author agent not found");
		}
		ctx.logger.info("Generating report...");
		// Make a copy of research with all properties defined
		const agentResult = await author.run({ data: research });
		const report = await agentResult.data.text();
		ctx.logger.info("Report generated! report.md");

		return report;
	};

	try {
		const accumulatedResearch = await researcherAgent();
		const report = await authorAgent(accumulatedResearch);
		return resp.markdown(report);
	} catch (error) {
		ctx.logger.error("Error generating report", error);
		return resp.text(`Failed to generate report: ${error}`, {
			status: 500,
			statusText: "Report Generation Failed",
		});
	}
}
