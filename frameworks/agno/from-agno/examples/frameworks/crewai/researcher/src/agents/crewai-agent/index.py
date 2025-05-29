from agentuity import AgentRequest, AgentResponse, AgentContext
from src.agents.crewai_agent.crew import MyCrew


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Log the incoming request
    context.logger.info(f"Processing request: {request.text() or 'No text provided'}")
    
    # Get the topic from the request or use a default
    topic = request.text() or "AI LLMs"
    
    # Set up inputs for the crew
    inputs = {"topic": topic}
    
    # Run the crew with the inputs
    context.logger.info(f"Starting CrewAI workflow for topic: {topic}")
    result = MyCrew().crew().kickoff(inputs=inputs)
    
    # Log the completion
    context.logger.info("CrewAI workflow completed successfully")
    
    # Return the result
    return response.text(str(result))
