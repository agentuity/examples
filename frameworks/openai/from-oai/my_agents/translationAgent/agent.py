import asyncio  
from agentuity import AgentRequest, AgentResponse, AgentContext  
  
# Your existing OpenAI Agents SDK imports and setup  
from agents import Agent, ItemHelpers, MessageOutputItem, Runner, trace  
  
# Keep your existing agent definitions exactly as they are  
spanish_agent = Agent(  
    name="spanish_agent",  
    instructions="You translate the user's message to Spanish",  
    handoff_description="An english to spanish translator",  
)  
  
french_agent = Agent(  
    name="french_agent",   
    instructions="You translate the user's message to French",  
    handoff_description="An english to french translator",  
)  
  
italian_agent = Agent(  
    name="italian_agent",  
    instructions="You translate the user's message to Italian",   
    handoff_description="An english to italian translator",  
)  
  
orchestrator_agent = Agent(  
    name="orchestrator_agent",  
    instructions=(  
        "You are a translation agent. You use the tools given to you to translate."  
        "If asked for multiple translations, you call the relevant tools in order."  
        "You never translate on your own, you always use the provided tools."  
    ),  
    tools=[  
        spanish_agent.as_tool(  
            tool_name="translate_to_spanish",  
            tool_description="Translate the user's message to Spanish",  
        ),  
        french_agent.as_tool(  
            tool_name="translate_to_french",   
            tool_description="Translate the user's message to French",  
        ),  
        italian_agent.as_tool(  
            tool_name="translate_to_italian",  
            tool_description="Translate the user's message to Italian",  
        ),  
    ],  
)  
  
synthesizer_agent = Agent(  
    name="synthesizer_agent",  
    instructions="You inspect translations, correct them if needed, and produce a final concatenated response.",  
)  
  
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_message = await request.data.text()
        
        # Use Agentuity's logging
        context.logger.info(f"Processing translation request: {user_message}")

        # Run your existing OpenAI Agents SDK workflow
        with trace("Orchestrator evaluator"):
            orchestrator_result = await Runner.run(orchestrator_agent, user_message, context=context)
            
            # Log intermediate steps using Agentuity's logger
            for item in orchestrator_result.new_items:
                if isinstance(item, MessageOutputItem):
                    text = ItemHelpers.text_message_output(item)
                    if text:
                        context.logger.info(f"Translation step: {text}")
            
            synthesizer_result = await Runner.run(
                synthesizer_agent, orchestrator_result.to_input_list(), context=context
            )

        return response.text(str(synthesizer_result.final_output))
    except Exception as e:
        context.logger.exception("Translation workflow failed")
        return response.text(f"Sorry, I couldn't translate your message: {e}")