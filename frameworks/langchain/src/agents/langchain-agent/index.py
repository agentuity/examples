from agentuity import AgentRequest, AgentResponse, AgentContext
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Log the incoming request
    context.logger.info(f"Processing request: {request.text() or 'No text provided'}")
    
    # Create a ChatOpenAI instance
    llm = ChatOpenAI(model="gpt-4o-mini")
    
    # Create a prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert in world knowledge and all things in general. Provide accurate and helpful information.",
            ),
            ("user", "{input}"),
        ]
    )
    
    # Create an output parser
    output_parser = StrOutputParser()
    
    # Create a chain
    chain = prompt | llm | output_parser
    
    # Invoke the chain with the user's input
    result = await chain.ainvoke({"input": request.text() or "Tell me about Agentuity"})
    
    # Log the result
    context.logger.info(f"Generated response of length: {len(result)}")
    
    # Return the result
    return response.text(result)
