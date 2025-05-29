from agentuity import AgentRequest, AgentResponse, AgentContext
from llama_index.core.agent.workflow import AgentWorkflow
from llama_index.llms.anthropic import Anthropic

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text() or "Recommend dinner spots in Austin, TX"

    # Store interaction history
    await context.kv.set("user-history", str(context.runId), {
        "query": prompt,
    })

    # Get user intent
    agent = AgentWorkflow.from_tools_or_functions(
        [],
        llm=Anthropic(model="claude-3-7-sonnet-latest", max_retries=3),
        system_prompt="""You serve as a central hub that routes user requests to the right
            AI agent based on the user's intent. Classify the user's intent and
            select the best agent to handle it: for now, just LocalGuide.
            Respond ONLY with the agent name.""",
    )
    
    user_intent = await agent.run(prompt)

    # Route to appropriate agent based on intent
    if str(user_intent) == "LocalGuide":
        return await response.handoff(
            { "name": "LocalGuide" },
            prompt
        )
    else:
        return response.text("Sorry, I don't know how to help with that.")
