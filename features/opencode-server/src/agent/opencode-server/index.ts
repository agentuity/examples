import { createAgent } from '@agentuity/runtime';
import { AgentInput, AgentOutput } from '@lib/types';

export default createAgent('opencode-server', {
	description: 'Manages an OpenCode server lifecycle inside an Agentuity sandbox',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		ctx.logger.info('OpenCode server agent called', { action: input.action });
		return { status: 'ok' };
	},
});
