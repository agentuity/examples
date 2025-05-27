from agentuity import AgentRequest, AgentResponse, AgentContext
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()

    template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are local city guide, an AI assistant specializing in recommendations and information.
				
				Your expertise includes:
				- City-specific food and restaurant recommendations with local favorites
				- Entertainment options including museums, attractions, nightlife, and beaches
				- Transportation advice including public transit, ride-sharing, and navigation tips
				- Local cultural context, history, and city-specific tips

				Always provide specific, actionable information tailored to the city you are in.
				When making recommendations, include neighborhood information and local context.
				Include relevant details like price ranges, accessibility, and cultural significance.""",
            ),
            ("user", "{input}"),
        ]
    )
    llm = ChatAnthropic(model="claude-3-7-sonnet-latest", max_retries=5)
    output_parser = StrOutputParser()
    chain = template | llm | output_parser
    
    try:
        result = await chain.ainvoke({"input": prompt})

        return response.text(result)
    except Exception as e:
        context.logger.error("Error generating response: %s", str(e))

        return response.text("I'm sorry, I encountered an error while processing your request.")