import asyncio  
from agentuity import AgentRequest, AgentResponse, AgentContext  
from pydantic import BaseModel  
  
# Your existing OpenAI Agents SDK imports and setup  
from agents import Agent, Runner, trace  
  
# Keep your existing agent definitions exactly as they are  
story_outline_agent = Agent(  
    name="story_outline_agent",  
    instructions="Generate a very short story outline based on the user's input.",  
)  
  
class OutlineCheckerOutput(BaseModel):  
    good_quality: bool  
    is_scifi: bool  
  
outline_checker_agent = Agent(  
    name="outline_checker_agent",  
    instructions="Read the given story outline, and judge the quality. Also, determine if it is a scifi story.",  
    output_type=OutlineCheckerOutput,  
)  
  
story_agent = Agent(  
    name="story_agent",  
    instructions="Write a short story based on the given outline.",  
    output_type=str,  
)  
  
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):  
    # Get the user input from Agentuity request  
    input_prompt = await request.data.text()  
      
    # Use Agentuity's logging  
    context.logger.info(f"Starting story generation for prompt: {input_prompt}")  
      
    # Run your existing OpenAI Agents SDK workflow  
    with trace("Deterministic story flow"):  
        # 1. Generate an outline  
        outline_result = await Runner.run(story_outline_agent, input_prompt)  
        context.logger.info("Outline generated")  
  
        # 2. Check the outline  
        outline_checker_result = await Runner.run(  
            outline_checker_agent,  
            outline_result.final_output,  
        )  
  
        # 3. Add a gate to stop if the outline is not good quality or not a scifi story  
        if not isinstance(outline_checker_result.final_output, OutlineCheckerOutput):
            context.logger.error(
                "Unexpected output type from outline_checker_agent: %s", 
                type(outline_checker_result.final_output)
            )
            return response.json({
                "status": "error",
                "reason": "Invalid outline-checker output"
            })
          
        if not outline_checker_result.final_output.good_quality:  
            context.logger.info("Outline is not good quality, stopping workflow")  
            return response.json({  
                "status": "rejected",  
                "reason": "Outline is not good quality",  
                "outline": outline_result.final_output  
            })  
  
        if not outline_checker_result.final_output.is_scifi:  
            context.logger.info("Outline is not a scifi story, stopping workflow")  
            return response.json({  
                "status": "rejected",   
                "reason": "Outline is not a scifi story",  
                "outline": outline_result.final_output  
            })  
  
        context.logger.info("Outline is good quality and a scifi story, continuing to write the story")  
  
        # 4. Write the story  
        story_result = await Runner.run(story_agent, outline_result.final_output)  
          
        context.logger.info("Story generation completed successfully")  
          
        # Return the complete result through Agentuity's response system  
        return response.json({  
            "status": "completed",  
            "outline": outline_result.final_output,  
            "story": story_result.final_output,  
            "quality_check": {  
                "good_quality": outline_checker_result.final_output.good_quality,  
                "is_scifi": outline_checker_result.final_output.is_scifi  
            }  
        })