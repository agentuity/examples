from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import json
import math
from common.prompts import SYSTEM_PROMPT

client = AsyncAnthropic()

def reflection_prompt(prompt, queries, learnings):
    return f"""Overall research goal: {prompt}

Previous search queries: {queries}

Follow-up questions: {', '.join(learnings['followUpQuestions'])}
"""

def create_accumulator():
    return {
        "query": "",
        "queries": [],
        "searchResults": [],
        "learnings": [],
        "completedQueries": []
    }

async def generate_search_queries(query, n=3):
    result = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""
            Generate {n} search queries for the following query: {query}

            Respond with JSON in this format: {{\"queries\": [\"query1\", \"query2\", \"query3\"]}}
            **CRITICAL**: Your exact response text will be fed into json.loads(response_text), you cannot wrap your response in anything, including '''json.
            """
        }]
    )
    response_text = result.content[0].text
    try:
        data = json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"JSON error in generate_search_queries: {e}")
        print(f"Response text: {response_text[:500]}")
        raise
    return data["queries"]

async def generate_learnings(query, search_result):
    try:
        search_result_json = json.dumps(search_result)
    except (TypeError, ValueError) as e:
        print(f"JSON encoding error in generate_learnings (search_result): {e}")
        print(f"search_result type: {type(search_result)}")
        print(f"search_result: {search_result}")
        raise

    result = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""The user is researching "{query}". The following search result were deemed relevant.
Generate a learning and a follow-up question from the following search result:

<search_result>
{search_result_json}
</search_result>

Respond with JSON in this format: {{"learning": "string", "followUpQuestions": ["question1", "question2"]}}

**CRITICAL**: Your exact response text will be fed into json.loads(response_text), you cannot wrap your response in anything, including '''json."""
        }]
    )

    response_text = result.content[0].text
    try:
        loaded_json = json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"JSON error in generate_learnings: {e}")
        print(f"Response text: {response_text[:500]}")
        raise
    return loaded_json

async def research_web(query, web_search_agent, accumulated_research):
    response = await web_search_agent.run({
            "query": query,
            "accumulatedSources": accumulated_research["searchResults"]
    })
    try:
        results = await response.data.json()
    except Exception as e:
        print(f"ERROR in research_web calling response.data.json(): {e}")
        print(f"Error type: {type(e).__name__}")
        try:
            raw = await response.data.text()
            print(f"Response text: {raw[:500]}")
        except Exception as text_err:
            print(f"Could not get text: {text_err}")
        raise
    return results["searchResults"]

async def deep_research(prompt, web_search_agent, accumulated_research, depth=2, breadth=3, max_results=20):
    if len(accumulated_research["query"]) == 0:
        accumulated_research["query"] = prompt

    if depth == 0:
        return accumulated_research
    elif len(accumulated_research["searchResults"]) >= max_results:
        print(f"Researcher: Reached maximum search results limit. Stopping further research.")
        return accumulated_research

    print(f"Researcher: current depth: {depth}")

    queries = await generate_search_queries(prompt, breadth)
    accumulated_research["queries"] = queries

    print(f"Researcher: Generated search queries: {len(queries)}")

    for query in queries:
        print(f"Searching the web for: {query}")

        search_results = await research_web(query, web_search_agent, accumulated_research)

        print(f"Researcher: Found {len(search_results)} search results for: {query}")
        print(f"Researcher: Accumulated results: {len(accumulated_research['searchResults'])}")

        accumulated_research["searchResults"].extend(search_results)

        for search_result in search_results:
            print(f"Processing search result: {search_result['url']}")
            learnings = await generate_learnings(query, search_result)
            accumulated_research["learnings"].append(learnings)
            accumulated_research["completedQueries"].append(query)

            queries_str = ", ".join(accumulated_research["completedQueries"])
            new_query = reflection_prompt(prompt, queries_str, learnings)
            await deep_research(
                new_query,
                web_search_agent,
                accumulated_research,
                depth - 1,
                math.ceil(breadth / 2)
            )

    return accumulated_research

def welcome():
    return {
        "welcome": "Welcome to the Researcher Agent! I can conduct deep research using iterative web searches and learning extraction.",
        "prompts": [
            {
                "data": {"query": "AI safety research", "depth": 2, "breadth": 3},
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        try:
            request_data = await request.data.json()
        except Exception as e:
            print(f"ERROR in run() parsing request.data.json(): {e}")
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

        web_search_agent = context.get_agent({"name": "web-search"})
        if not web_search_agent:
            return response.text("Web Search agent not found")

        accumulator = create_accumulator()
        research = await deep_research(
            query,
            web_search_agent,
            accumulator,
            depth,
            breadth,
            max_results
        )

        context.logger.info("Deep research completed!")
        context.logger.info(f"Research results: {len(research['searchResults'])} search results, {len(research['learnings'])} learnings")

        try:
            return response.json(research)
        except (TypeError, ValueError) as e:
            print(f"JSON encoding error in run() returning response: {e}")
            print(f"research type: {type(research)}")
            print(f"research keys: {research.keys() if isinstance(research, dict) else 'N/A'}")
            raise

    except Exception as e:
        context.logger.error(f"Error running researcher agent: {e}")
        return response.text("Sorry, there was an error processing your research request.")
