import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import researcherAgent from '@agent/researcher';
import authorAgent from '@agent/author';

const agent = createAgent('orchestrator', {
	description: 'Orchestration agent for deep research workflow',
	schema: {
		input: s.object({
			query: s.string(),
			depth: s.optional(s.number()),
			breadth: s.optional(s.number()),
			maxResults: s.optional(s.number()),
		}),
		output: s.string(),
	},
	handler: async (ctx, inputs) => {
		ctx.logger.info('Orchestrator processing deep research request');

		// Validate and set defaults
		const query = inputs.query;
		const depth = inputs.depth ?? 2;
		const breadth = inputs.breadth ?? 3;
		const maxResults = inputs.maxResults ?? 20;

		// Validate ranges
		if (depth < 1 || depth > 5) {
			throw new Error('Depth must be between 1 and 5');
		}

		if (breadth < 1 || breadth > 5) {
			throw new Error('Breadth must be between 1 and 5');
		}

		if (maxResults < 5 || maxResults > 100) {
			throw new Error('Max results must be between 5 and 100');
		}

		ctx.logger.info(`Parameters validated: depth=${depth}, breadth=${breadth}, maxResults=${maxResults}`);

		try {
			// Call researcher agent
			ctx.logger.info('Calling researcher agent');
			const researchResult = await researcherAgent.run({
				query,
				depth,
				breadth,
				maxResults,
			});

			// Call author agent with research results
			ctx.logger.info('Calling author agent');
			const report = await authorAgent.run(researchResult);

			ctx.logger.info('Deep research completed successfully');
			return report;
		} catch (error) {
			ctx.logger.error(
				`Orchestrator error: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw new Error(`Unable to complete deep research: ${error instanceof Error ? error.message : String(error)}`);
		}
	},
});

export default agent;
