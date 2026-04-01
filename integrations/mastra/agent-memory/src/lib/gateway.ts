// Route Mastra's OpenAI calls through the Agentuity AI Gateway
if (!process.env.OPENAI_API_KEY && process.env.AGENTUITY_SDK_KEY) {
	const gw = process.env.AGENTUITY_AIGATEWAY_URL ?? process.env.AGENTUITY_TRANSPORT_URL ?? 'https://catalyst.agentuity.cloud';
	process.env.OPENAI_API_KEY = process.env.AGENTUITY_SDK_KEY;
	process.env.OPENAI_BASE_URL = `${gw}/gateway/openai`;
}

