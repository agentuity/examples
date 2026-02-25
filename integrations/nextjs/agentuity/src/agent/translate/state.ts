import { AgentOutput } from './agent';

export const TranslateHistoryStateSchema = AgentOutput.pick([
	'history',
	'threadId',
	'translationCount',
]);
