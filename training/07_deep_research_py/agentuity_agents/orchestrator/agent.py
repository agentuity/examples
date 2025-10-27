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
        try:
            request_data = await request.data.json()
        except Exception as e:
            print(f"ERROR in orchestrator run() parsing request.data.json(): {e}")
            print(f"Error type: {type(e).__name__}")
            try:
                raw = await request.data.text()
                print(f"Request text: {raw[:500]}")
            except Exception as text_err:
                print(f"Could not get text: {text_err}")
            return response.text(f"Invalid JSON in request: {e}")

        query = request_data["query"]
        depth = request_data.get("depth", 2)
        breadth = request_data.get("breadth", 3)
        max_results = request_data.get("maxResults", 20)

        

        async def researcher_agent():
            researcher = context.get_agent({"name": "researcher"})
            if not researcher:
                raise Exception("Researcher agent not found")

            context.logger.info("Starting research...")
            context.logger.info(f"Researching: {query} with depth: {depth} and breadth: {breadth}")

            research_results = await researcher.run({
                    "query": query,
                    "depth": depth,
                    "breadth": breadth,
                    "maxResults": max_results
            })

            context.logger.info("Research completed, processing results...")
            try:
                research = await research_results.data.json()
            except Exception as e:
                print(f"ERROR in orchestrator researcher_agent() parsing research_results.data.json(): {e}")
                print(f"Error type: {type(e).__name__}")
                try:
                    raw = await research_results.data.text()
                    print(f"Research results text: {raw[:500]}")
                except Exception as text_err:
                    print(f"Could not get text: {text_err}")
                raise
            context.logger.info("Research completed!")
            return research

        async def author_agent(research):
            author = context.get_agent({"name": "author"})
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
        return response.text(f"Failed to generate report: {error}")
