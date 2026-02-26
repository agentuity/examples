'use client';

import { useEffect } from 'react';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
			<h1>Something went wrong</h1>
			<p>{error.message}</p>
			<button onClick={reset} type="button">
				Try again
			</button>
		</main>
	);
}
