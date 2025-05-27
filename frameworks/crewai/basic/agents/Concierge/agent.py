from agentuity import AgentRequest, AgentResponse, AgentContext
from agents.Concierge.crew import Concierge

async def run(
    request: AgentRequest,
    response: AgentResponse,
    context: AgentContext,
):
    prompt = await request.data.text() or "Recommend dinner spots in Austin, TX"

    # Store interaction history
    await context.kv.set("user-history", str(context.runId), {
        "query": prompt
    })

    concierge = Concierge()
    crew = concierge.crew(prompt)
    result = crew.kickoff()
    
    return response.text(str(result))