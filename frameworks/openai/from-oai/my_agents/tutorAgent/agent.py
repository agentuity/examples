from agentuity import AgentRequest, AgentResponse, AgentContext  
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel  
 
  
class HomeworkOutput(BaseModel):  
    is_homework: bool  
    reasoning: str  
  
# Define the OpenAI Agents  
guardrail_agent = Agent(  
    name="Guardrail check",  
    instructions="Check if the user is asking about homework.",  
    output_type=HomeworkOutput,  
)  
  
math_tutor_agent = Agent(  
    name="Math Tutor",  
    handoff_description="Specialist agent for math questions",  
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",  
)  
  
history_tutor_agent = Agent(  
    name="History Tutor",  
    handoff_description="Specialist agent for historical questions",  
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",  
)  
  
async def homework_guardrail(ctx, agent, input_data):  
    result = await Runner.run(guardrail_agent, input_data, context=ctx)  
    final_output = result.final_output_as(HomeworkOutput)  
    return GuardrailFunctionOutput(  
        output_info=final_output,  
        tripwire_triggered=not final_output.is_homework,  
    )  
  
triage_agent = Agent(  
    name="Triage Agent",  
    instructions="You determine which agent to use based on the user's homework question",  
    handoffs=[history_tutor_agent, math_tutor_agent],  
    input_guardrails=[  
        InputGuardrail(guardrail_function=homework_guardrail),  
    ],  
)  
  
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):  
    try:  
        # Extract the user's question from the request  
        user_question = await request.data.text()  
          
        # Log the incoming request  
        context.logger.info("Processing question: %s", user_question)  
          
        # Run the OpenAI Agents workflow  
        result = await Runner.run(triage_agent, user_question)  
          
        # Log the result  
        context.logger.info("Agent workflow completed successfully")  
          
        # Return the response from the OpenAI Agents workflow  
        return response.text(str(result.final_output))  
          
    except Exception as e:  
        context.logger.error("Error in agent workflow: %s", str(e))  
        return response.text(f"Sorry, I encountered an error processing your request: {str(e)}")