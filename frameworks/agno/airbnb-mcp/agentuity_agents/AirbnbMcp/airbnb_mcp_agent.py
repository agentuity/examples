import asyncio
from textwrap import dedent
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.mcp import MCPTools
from agno.tools.reasoning import ReasoningTools

async def run_agent(message: str) -> None:
    async with MCPTools(
        "npx -y @agentuity/mcp-server-airbnb --ignore-robots-txt"
    ) as mcp_tools:
        agent = Agent(
            model=Groq(id="meta-llama/llama-3.3-70b-instruct"),
            tools=[ReasoningTools(add_instructions=True), mcp_tools],
            instructions=dedent("""
            - Always start by using the think tool to map out the steps needed to complete the task.
            - After receiving the user's request, use the think tool as a scratchpad to work through your approach.
            - Before giving a final answer, use the think tool to jot down final thoughts.
            - Present final outputs in well-organized tables whenever possible.
            """),
        )
        
        return agent.run(message)
