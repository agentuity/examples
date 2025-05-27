from agentuity import AgentRequest, AgentResponse, AgentContext
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text() or "Recommend dinner spots in Austin, TX"

    # Store interaction history
    await context.kv.set("user-history", str(context.runId), {
        "query": prompt,
    })

    # Get user intent
    template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You serve as a central hub that routes user requests to the right
                AI agent based on the user's intent. Classify the user's intent and
                select the best agent to handle it: for now, just LocalGuide.
                Respond ONLY with the agent name."""
            ),
            ("user", "{input}"),
        ]
    )
    llm = ChatAnthropic(model="claude-3-7-sonnet-latest", max_retries=5)
    output_parser = StrOutputParser()
    chain = template | llm | output_parser
    
    user_intent = await chain.ainvoke({"input": prompt})

    # Route to appropriate agent based on intent
    if user_intent == "LocalGuide":
        return await response.handoff(
            { "name": "LocalGuide" },
            prompt
        )
    else:
        return response.text("Sorry, I don't know how to help with that.")