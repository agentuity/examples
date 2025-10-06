from agentuity import AgentRequest, AgentResponse, AgentContext
import json

def welcome():
    return {
        "welcome": "Welcome to the Deep Research Orchestrator! I coordinate researcher and author agents to provide comprehensive research reports.",
        "prompts": [
            {
                "data": {"query": "artificial intelligence safety", "depth": 2, "breadth": 3, "maxResults": 20},
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        request_data = await request.data.json()

        query = request_data["query"]
        depth = request_data.get("depth", 2)
        breadth = request_data.get("breadth", 3)
        max_results = request_data.get("maxResults", 20)

        async def researcher_agent():
            researcher = await context.getAgent({"name": "researcher"})
            if not researcher:
                raise Exception("Researcher agent not found")

            context.logger.info("Starting research...")
            context.logger.info(f"Researching: {query} with depth: {depth} and breadth: {breadth}")

            research_results = await researcher.run({
                "data": {
                    "query": query,
                    "depth": depth,
                    "breadth": breadth,
                    "maxResults": max_results
                }
            })

            context.logger.info("Research completed, processing results...")
            research = await research_results.data.json()
            context.logger.info("Research completed!")
            return research

        async def author_agent(research):
            author = await context.getAgent({"name": "author"})
            if not author:
                raise Exception("Author agent not found")

            context.logger.info("Generating report...")
            agent_result = await author.run({"data": research})
            report = await agent_result.data.text()
            context.logger.info("Report generated! report.md")

            return report

        accumulated_research = await researcher_agent()
        report = await author_agent(accumulated_research)
        return response.markdown(report)

    except Exception as error:
        context.logger.error(f"Error generating report: {error}")
        return response.text(f"Failed to generate report: {error}", status=500)
