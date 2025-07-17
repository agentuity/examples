from agentuity import AgentRequest, AgentResponse, AgentContext
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_tavily import TavilySearch, TavilyExtract, TavilyCrawl
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage
import datetime
import os

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Agentuity agent handler for LangGraph hybrid research system.
    Combines Tavily web search tools with internal vector search capabilities.
    """
    try:
    
        user_input = None
        
    
        try:
            user_input = await request.data.text()
            context.logger.info(f"Received text input: {user_input}")
        except Exception:
            pass
            
        # If no text, try JSON
        if not user_input:
            try:
                json_data = await request.data.json()
                context.logger.info(f"Received JSON data: {json_data}")
                
                # Try different JSON field names
                user_input = (json_data.get('message') or 
                             json_data.get('query') or 
                             json_data.get('input') or 
                             json_data.get('text') or
                             json_data.get('question'))
            except Exception:
                pass
        
        # If still no input, use default
        if not user_input:
            user_input = "Check for the Google Deal size and find the latest earnings report for them to validate if they are in spending spree"
            context.logger.info("No input provided, using default query")
        
        context.logger.info(f"Processing research request: {user_input}")
          
       
        model = ChatOpenAI(
            model="gpt-4o",
            temperature=0
        )
          
        
        embeddings = OpenAIEmbeddings()
        vector_store = Chroma(
            collection_name="crm",
            embedding_function=embeddings,
            persist_directory="supplemental/db",
        )
          
        # Create vector search tool
        vector_search_tool = vector_store.as_retriever().as_tool(
            name="vector_search",
            description="""
            Perform a vector search on our company's CRM data.
            Contains context about key accounts like Meta, Apple, Google, Amazon, Microsoft, and Tesla.
            Use this to find internal information about deals, meetings, and account details.
            """
        )
          
        # Initialize Tavily tools
        search = TavilySearch(
            max_results=10,
            topic="general",
            api_key=os.getenv("TAVILY_API_KEY")
        )
        extract = TavilyExtract(
            extract_depth="advanced",
            api_key=os.getenv("TAVILY_API_KEY")
        )
        crawl = TavilyCrawl(api_key=os.getenv("TAVILY_API_KEY"))
          
        today = datetime.datetime.today().strftime("%A, %B %d, %Y")
          
        # Create the hybrid research agent
        hybrid_agent = create_react_agent(
            model=model,
            tools=[search, crawl, extract, vector_search_tool],
            prompt=ChatPromptTemplate.from_messages([
                ("system", f"""
You are a ReAct-style research agent equipped with the following tools:

* **Tavily Web Search**
* **Tavily Web Extract**
* **Tavily Web Crawl**
* **Internal Vector Search** (for proprietary CRM data)

Your mission is to conduct comprehensive, accurate, and up-to-date research, using a combination of real-time public web information and internal enterprise knowledge. All answers must be grounded in retrieved information from the tools provided. You are not permitted to make up information or rely on prior knowledge.

**Today's Date:** {today}

**Available Tools:**

1. **Tavily Web Search**
   * **Purpose:** Retrieve relevant web pages based on a query.
   * **Usage:** Provide a search query to receive up to 10 semantically ranked results, each containing the title, URL, and a content snippet.
   * **Best Practices:**
     * Use specific queries to narrow down results.
     * Example: "OpenAI's latest product release" and "OpenAI's headquarters location" rather than "OpenAI's latest product release and headquarters location"
     * Optimize searches using parameters such as `search_depth`, `time_range`, `include_domains`, and `include_raw_content`.
     * Break down complex queries into specific, focused sub-queries.

2. **Tavily Web Crawl**
   * **Purpose:** Explore a website's structure and gather content from linked pages for deep research and information discovery from a single source.
   * **Usage:** Input a base URL to crawl, specifying parameters such as `max_depth`, `max_breadth`, and `extract_depth`.
   * **Best Practices:**
     * Begin with shallow crawls and progressively increase depth.
     * Utilize `select_paths` or `exclude_paths` to focus the crawl.
     * Set `extract_depth` to "advanced" for comprehensive extraction.

3. **Tavily Web Extract**
   * **Purpose:** Extract the full content from specific web pages.
   * **Usage:** Provide URLs to retrieve detailed content.
   * **Best Practices:**
     * Set `extract_depth` to "advanced" for detailed content, including tables and embedded media.
     * Enable `include_images` if image data is necessary.

4. **Internal Vector Search**
   * **Purpose:** Search the proprietary CRM knowledge base.
   * **Usage:** Submit a natural language query to retrieve relevant context from the CRM vector store. Contains context about key accounts like Meta, Apple, Google, Amazon, Microsoft, and Tesla.
   * **Best Practices:**
     * When possible, refer to specific information, such as names, dates, product usage, or meetings.

**Guidelines for Conducting Research:**

* You may not answer questions based on prior knowledge or assumptions.
* **Citations:** Always support findings with source URLs, clearly provided as in-text citations.
* **Accuracy:** Rely solely on data obtained via provided tools (web or vector store) —never fabricate information.
* **If none of the tools return useful information, respond:**
  * "I'm sorry, but none of the available tools provided sufficient information to answer this question."

**Research Workflow:**

* **Thought:** Consider necessary information and next steps.
* **Action:** Select and execute appropriate tools.
* **Observation:** Analyze obtained results.
* **IMPORTANT: Repeat Thought/Action/Observation cycles as needed. You MUST only respond to the user once you have gathered all the information you need.**
* **Final Answer:** Synthesize and present findings with citations in markdown format.

**Example Workflow:**

**Question:** What has Apple publicly shared about their AI strategy, and do we have any internal notes on recent meetings with them?

* **Thought:** I'll start by looking for Apple's public statements on AI using a search.
* **Action:** Tavily Web Search with the query "Apple AI strategy 2024" and `time_range` set to "month".
* **Observation:** Found a recent article from Apple's newsroom and a keynote transcript.
* **Thought:** I want to read the full content of Apple's keynote.
* **Action:** Tavily Web Extract on the URL from the search result.
* **Observation:** Extracted detailed content from Apple's announcement.
* **Thought:** Now, I'll check our internal CRM data for recent meeting notes with Apple.
* **Action:** Internal Vector Search with the query "recent Apple meetings AI strategy".
* **Observation:** Retrieved notes from a Q2 strategy sync with Apple's enterprise team.
* **Final Answer:** Synthesized response combining public and internal data, with citations.

You will now receive a research question from the user:
                """),
                MessagesPlaceholder(variable_name="messages"),
            ]),
            name="hybrid_agent",
        )
          
        # Prepare input for the agent
        inputs = {
            "messages": [HumanMessage(content=user_input)]
        }
          
        context.logger.info("Starting research agent execution...")
          
        # Stream the agent's response and collect results
        result_messages = []
        for step in hybrid_agent.stream(inputs, stream_mode="values"):
            message = step["messages"][-1]
            result_messages.append(message)
              
            # Log intermediate steps for debugging
            if hasattr(message, 'content') and len(message.content) > 0:
                context.logger.info(f"Agent step: {type(message).__name__}")
          
        # Extract the final response
        if result_messages:
            final_message = result_messages[-1]
            if hasattr(final_message, 'content'):
                final_content = final_message.content
            else:
                final_content = str(final_message)
        else:
            final_content = "No response generated from the research agent."
          
        context.logger.info("Research completed successfully")
          
        # Return the response as markdown for better formatting
        return response.markdown(final_content)
          
    except Exception as e:
        context.logger.error(f"Error in hybrid research agent: {str(e)}")
        return response.text(
            "I encountered an error while processing your research request. "
            "Please check that your API keys are configured correctly and try again.",
            status=500
        ) 