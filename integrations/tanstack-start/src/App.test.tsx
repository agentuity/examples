import { describe, expect, test, vi } from 'vitest';

vi.mock('@agentuity/react', () => ({
	AgentuityProvider: ({ children }: { children: unknown }) => children,
	useAPI: () => ({
		data: undefined,
		error: null,
		invoke: vi.fn(),
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	}),
}));

vi.mock('@agentuity/routes', () => ({}));

describe('App', () => {
	test('registers index route component', async () => {
		const { Route } = await import('./routes/index.tsx');
		expect(typeof Route.options.component).toBe('function');
		expect(Route.options.component?.name).toBe('TranslateRoute');
	});
});
