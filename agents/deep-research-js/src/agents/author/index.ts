import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { ResearchSchema, type Research } from '../../common/types';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { SYSTEM_PROMPT } from '../../common/prompts';

const AUTHOR_PROMPT = (
	research: Research
) => `Generate a report based on the following research data:\n\n 
		${JSON.stringify(research, null, 2)}\n\n
		Make sure to include the following sections:
		- Summary
		- Key Findings
		- Recommendations
		- Next Steps
		- References
		Write in markdown format.`;

export default async function Agent(req: AgentRequest, resp: AgentResponse) {
	const research = ResearchSchema.parse(await req.data.json());

	const { text } = await generateText({
		model: anthropic("claude-3-5-sonnet-latest"),
		system: SYSTEM_PROMPT,
		prompt: AUTHOR_PROMPT(research),
	});

	return resp.text(text);
}
