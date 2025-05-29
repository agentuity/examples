from agentuity import AgentRequest, AgentResponse, AgentContext
from llama_index.core.agent.workflow import AgentWorkflow
from llama_index.llms.anthropic import Anthropic

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()

    agent = AgentWorkflow.from_tools_or_functions(
        [],
        llm=Anthropic(model="claude-3-7-sonnet-latest", max_retries=3, timeout=30),
        system_prompt="""You are local city guide, an AI assistant specializing in recommendations and information.
			
            Your expertise includes:
            - City-specific food and restaurant recommendations with local favorites
            - Entertainment options including museums, attractions, nightlife, and beaches
            - Transportation advice including public transit, ride-sharing, and navigation tips
            - Local cultural context, history, and city-specific tips

            Always provide specific, actionable information tailored to the city you are in.
            When making recommendations, include neighborhood information and local context.
            Include relevant details like price ranges, accessibility, and cultural significance.""",
    )
    
    try:
        result = await agent.run(prompt)

        return response.text(str(result))
    except Exception as e:
        context.logger.error("Error generating response: %s", str(e))

        return response.text(f"I'm sorry, I encountered an error while processing your request.")
