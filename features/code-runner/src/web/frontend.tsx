import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AgentuityProvider } from '@agentuity/react';
import { App } from './App';

function init() {
	const elem = document.getElementById('root');
	if (!elem) {
		throw new Error('Root element not found');
	}

	const app = (
		<StrictMode>
			<AgentuityProvider>
				<App />
			</AgentuityProvider>
		</StrictMode>
	);

	if (import.meta.hot) {
		const root = (import.meta.hot.data.root ??= createRoot(elem));
		root.render(app);
	} else {
		createRoot(elem).render(app);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
