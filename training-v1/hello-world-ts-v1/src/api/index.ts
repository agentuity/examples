import { createRouter } from '@agentuity/runtime';
import hello from '@agent/hello';

const api = createRouter();

// Define a POST request at /hello, directed to our 'hello' agent.
api.post('/hello', hello.validator(), async (c) => {
	// Get valid JSON object from request.
	const data = c.req.valid('json');
	// Run the 'hello' agent with our JSON data.
	const result = await hello.run(data);
	return c.json(result);
});

export default api;
