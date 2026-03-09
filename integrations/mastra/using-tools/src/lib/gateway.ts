// Bridge Agentuity AI Gateway to Mastra's OpenAI-compatible model resolution
if (!process.env.OPENAI_API_KEY && process.env.AGENTUITY_SDK_KEY) {
	const gw = process.env.AGENTUITY_AIGATEWAY_URL ?? process.env.AGENTUITY_TRANSPORT_URL ?? 'https://agentuity.ai';
	process.env.OPENAI_API_KEY = process.env.AGENTUITY_SDK_KEY;
	process.env.OPENAI_BASE_URL = `${gw}/gateway/openai`;
}

