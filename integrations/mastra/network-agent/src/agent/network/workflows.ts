/**
 * Workflows for the network agent.
 * Workflows coordinate multiple agents to complete complex tasks.
 */
import research from '../research';
import writing from '../writing';

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
 * 1. First gathers factual information about the city using the research agent
 * 2. Then synthesizes that research into a full written report using the writing agent
 */
export async function cityWorkflow(
	logger: Logger,
	input: CityWorkflowInput
): Promise<CityWorkflowOutput> {
	logger.info('──── City Workflow Start ────');
	logger.info('City workflow', { city: input.city });

	// Step 1: Research the city
	logger.info('Step 1: Researching city...');
	const researchResult = await research.run({
		topic: `${input.city} - history, culture, landmarks, and interesting facts`,
	});

	logger.info('Research complete', { insightCount: researchResult.insights.length });

	// Step 2: Write a report based on the research
	logger.info('Step 2: Writing report...');
	const writingResult = await writing.run({
		topic: input.city,
		insights: researchResult.insights,
		style: 'report',
	});

	logger.info('──── City Workflow Complete ────');
	logger.info('City workflow complete', { wordCount: writingResult.wordCount });

	return {
		city: input.city,
		research: {
			insights: researchResult.insights,
		},
		report: {
			content: writingResult.content,
			wordCount: writingResult.wordCount,
		},
	};
}
