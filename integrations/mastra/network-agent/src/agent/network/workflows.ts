/**
 * Workflows for the network agent.
 * Workflows coordinate multiple agents to complete complex tasks.
 */
import { researchMastraAgent } from '../research';
import { writingMastraAgent } from '../writing';

export interface CityWorkflowInput {
	city: string;
}

export interface CityWorkflowOutput {
	city: string;
	research: {
		insights: string[];
	};
	report: {
		content: string;
		wordCount: number;
	};
}

// Logger interface for workflow logging
interface Logger {
	info: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * City Workflow: handles city-specific research tasks.
 * 1. First gathers factual information about the city using the Mastra research agent
 * 2. Then synthesizes that research into a full written report using the Mastra writing agent
 */
export async function cityWorkflow(
	logger: Logger,
	input: CityWorkflowInput
): Promise<CityWorkflowOutput> {
	logger.info('──── City Workflow Start ────');
	logger.info('City workflow', { city: input.city });

	// Step 1: Research the city
	logger.info('Step 1: Researching city...');
	const researchResult = await researchMastraAgent.generate(
		`Research topic: ${input.city} - history, culture, landmarks, and interesting facts`
	);
	const researchContent = researchResult.text ?? '';
	const insights = researchContent
		.split('\n')
		.map((line) => line.replace(/^[-•*]\s*/, '').trim())
		.filter((line) => line.length > 0);

	logger.info('Research complete', { insightCount: insights.length });

	// Step 2: Write a report based on the research
	logger.info('Step 2: Writing report...');
	const insightsList = insights.map((i) => `- ${i}`).join('\n');
	const writingPrompt = `Transform the following research insights into a well-structured report.

Topic: ${input.city}

Research Insights:
${insightsList}

Write in full paragraphs, no bullet points. Create a cohesive narrative that flows naturally. Target 200-400 words.

Write the report:`;

	const writingResult = await writingMastraAgent.generate(writingPrompt);
	const content = writingResult.text ?? '';
	const wordCount = content.split(/\s+/).length;

	logger.info('──── City Workflow Complete ────');
	logger.info('City workflow complete', { wordCount });

	return {
		city: input.city,
		research: {
			insights,
		},
		report: {
			content,
			wordCount,
		},
	};
}
