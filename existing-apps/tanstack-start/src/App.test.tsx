import { describe, expect, test } from 'vitest';

describe('App', () => {
	test('registers index route component', async () => {
		const { Route } = await import('./routes/index.tsx');
		expect(typeof Route.options.component).toBe('function');
		expect(Route.options.component?.name).toBe('TranslateRoute');
	});
});
