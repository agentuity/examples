from llama_index.core.agent.workflow import AgentWorkflow
from llama_index.llms.openai import OpenAI
from agentuity import AgentRequest, AgentResponse, AgentContext


# Define a simple calculator tool
def multiply(a: float, b: float) -> float:
    """Useful for multiplying two numbers."""
    return a * b


# Create an agent workflow with our calculator tool
agent = AgentWorkflow.from_tools_or_functions(
    [multiply],
    llm=OpenAI(model="gpt-4o-mini"),
    system_prompt="You are a helpful assistant that can multiply two numbers.",
)


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Log the incoming request
    context.logger.info(f"Processing request: {request.text or 'No text provided'}")
    
    # Run the LlamaIndex agent workflow
    result = await agent.run(request.text() or "What is 1234 * 4567?")
    
    # Log the result
    context.logger.info(f"Generated response: {result}")
    
    # Return the result
    return response.text(str(result))
