from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
from exa_py import Exa
import json
import os

client = AsyncAnthropic()

def eval_prompt(query, pending_result, existing_urls):
    return f"""Evaluate whether the search result is relevant and will help answer the following query: "{query}".

If the URL already exists in the existing results, mark it as irrelevant to avoid duplicates.

<search_result>
Title: {pending_result['title']}
URL: {pending_result['url']}
Content: {pending_result['content'][:500]}...
</search_result>

<existing_urls>
{chr(10).join(existing_urls)}
</existing_urls>

Respond with either "relevant" or "irrelevant"."""

async def search_web(exa, query, num_results=3):
    print(f"Searching for: {query}")

    results = await exa.search_and_contents(
        query,
        num_results=num_results,
        livecrawl="always"
    )

    return [
        {
            "title": r.title or "Untitled",
            "url": r.url,
            "content": r.text or ""
        }
        for r in results.results
    ]

async def evaluate_result(query, result, existing_urls):
    # Quick check for duplicates
    if result["url"] in existing_urls:
        print(f"Skipping duplicate URL: {result['url']}")
        return False

    # Quick check for empty content
    if not result["content"] or len(result["content"].strip()) < 50:
        print(f"Skipping result with insufficient content: {result['url']}")
        return False

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": eval_prompt(query, result, existing_urls)
            }]
        )

        evaluation = response.content[0].text.strip().lower()
        is_relevant = "relevant" in evaluation and "irrelevant" not in evaluation
        print(f"{result['url']} - {'RELEVANT' if is_relevant else 'IRRELEVANT'}")
        return is_relevant
    except Exception as error:
        print(f"Error evaluating {result['url']}: {error}")
        return False

def welcome():
    return {
        "welcome": "Welcome to the Web Search Agent! I can search the web and filter results for relevance.",
        "prompts": [
            {
                "data": {"query": "latest AI research", "accumulatedSources": []},
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    if not os.environ.get("EXA_API_KEY"):
        return response.text("EXA_API_KEY environment variable is not set", status=500)

    try:
        request_data = await request.data.json()
        query = request_data["query"]
        accumulated_sources = request_data["accumulatedSources"]

        exa = Exa(os.environ["EXA_API_KEY"])
        search_results = []
        existing_urls = [s["url"] for s in accumulated_sources]

        # Perform search deterministically
        raw_results = await search_web(exa, query, 5)

        # Evaluate each result deterministically
        for result in raw_results:
            is_relevant = await evaluate_result(query, result, existing_urls)

            if is_relevant:
                search_results.append(result)
                existing_urls.append(result["url"])  # Add to existing URLs to avoid duplicates in this batch

                # Limit to 3 relevant results per query
                if len(search_results) >= 3:
                    break

        print(f"Found {len(search_results)} relevant results for: {query}")

        payload = {
            "searchResults": search_results,
            "message": "Research completed successfully!"
        }

        return response.json(payload)

    except Exception as error:
        print(f"Error in web search: {error}")
        return response.text(f"Failed to search web: {error}", status=500)
