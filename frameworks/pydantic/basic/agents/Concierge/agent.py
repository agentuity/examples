from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic_ai import Agent

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text() or "Recommend dinner spots in Austin, TX"

    # Store interaction history
    await context.kv.set("user-history", str(context.runId), {
        "query": prompt,
    })
        
    # Get user intent
    agent = Agent(
        "claude-3-7-sonnet-latest",
        output_type=str,
        system_prompt=(
            """You serve as a central hub that routes user requests to the right
            AI agent based on the user's intent. Classify the user's intent and
            select the best agent to handle it: for now, just LocalGuide.
            Respond ONLY with the agent name."""
        ),
    )

    intent_result = await agent.run(prompt)

    # Route to appropriate agent based on intent
    if intent_result.output == "LocalGuide":
        return await response.handoff(
            { "name": "LocalGuide" },
            prompt
        )
    else:
        return response.text("Sorry, I don't know how to help with that.")
