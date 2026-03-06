import { createAgent } from '@agentuity/runtime';
import { AgentInput, AgentOutput } from './types';
import { explore } from '@lib/explorer';

const agent = createAgent('web-explorer', {
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

				sandbox: ctx.sandbox,
			},
			{ url: input.url, maxSteps: input.maxSteps },
		);
	},
});

export default agent;
