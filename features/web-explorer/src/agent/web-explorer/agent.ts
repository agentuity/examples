import { createAgent } from '@agentuity/runtime';
import { AgentInput, AgentOutput } from '@lib/types';
import { explore } from '@lib/explorer';

export default createAgent('web-explorer', {
	description:
		'Opens a URL in a headless browser sandbox, takes screenshots, and autonomously explores the page using AI-guided actions',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		return explore(
			{
				logger: ctx.logger,
				kv: ctx.kv,
				vector: ctx.vector,
				sandbox: ctx.sandbox,
			},
			{ url: input.url, maxSteps: input.maxSteps },
		);
	},
});
