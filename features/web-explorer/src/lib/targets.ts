// Preset targets with site-specific hints injected into the system prompt.
// Hints override the generic exploration behavior for a given site.
// To add a target: include a `hints` string describing the site layout and exploration strategy.
export const TARGETS = [
	{
		label: 'Agentuity',
		url: 'https://agentuity.dev',
		description: 'Agentuity platform docs and SDK explorer',
		hints: 'This is an SDK Explorer with demo pages. The homepage shows demo cards in sections (Basics, Services, I/O Patterns). Focus on one demo per exploration: click a demo card, click Run to execute the code, observe the output, check the Docs link if available, then store your finding. The "Reference Code" and "Editor content" panels are read-only — do not fill them. On the next session, memory will recall this demo so you can explore a different one.',
	},
] as const;
