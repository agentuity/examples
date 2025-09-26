from textwrap import dedent
from typing import Dict, List, Optional
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.firecrawl import FirecrawlTools
from pydantic import BaseModel, Field
from agentuity import AgentRequest, AgentResponse, AgentContext
import traceback

class ContentSection(BaseModel):
    """Represents a section of content from the webpage."""
    heading: Optional[str] = Field(None, description="Section heading")
    content: str = Field(..., description="Section content text")

class PageInformation(BaseModel):
    """Structured representation of a webpage."""
    url: str = Field(..., description="URL of the page")
    title: str = Field(..., description="Title of the page")
    description: Optional[str] = Field(
        None, description="Meta description or summary of the page"
    )
    features: Optional[List[str]] = Field(None, description="Key feature list")
    content_sections: Optional[List[ContentSection]] = Field(
        None, description="Main content sections of the page"
    )
    links: Optional[Dict[str, str]] = Field(
        None, description="Important links found on the page with description"
    )
    contact_info: Optional[Dict[str, str]] = Field(
        None, description="Contact information if available"
    )
    metadata: Optional[Dict[str, str]] = Field(
        None, description="Important metadata from the page"
    )

def _create_agno_agent():
    """Create the Agno agent instance lazily when needed."""
    return Agent(
        model=OpenAIChat(id="gpt-4o"),
        tools=[FirecrawlTools(scrape=True, crawl=True)],
        instructions=dedent("""
            You are an expert web researcher and content extractor. Extract comprehensive, structured information
            from the provided webpage. Focus on:
            1. Accurately capturing the page title, description, and key features
            2. Identifying and extracting main content sections with their headings
            3. Finding important links to related pages or resources
            4. Locating contact information if available
            5. Extracting relevant metadata that provides context about the site
            Be thorough but concise. If the page has extensive content, prioritize the most important information.
        """).strip(),
        output_schema=PageInformation,
    )

def welcome():
    return {
        "welcome": "🕷️ I'm a web extraction agent that can scrape and analyze any webpage to extract structured information including content, links, and metadata.",
        "prompts": [
            {
                "data": "Extract all information from https://www.agno.com",
                "contentType": "text/plain"
            },
            {
                "data": "Analyze the content structure of https://docs.agentuity.dev",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_input = (await request.data.text()).strip()
        context.logger.info(f"Received web extraction request: {user_input}")
        
        agno_agent = _create_agno_agent()
        result = agno_agent.run(user_input)
        
        if hasattr(result, 'content') and result.content:
            return response.json(result.content.dict() if hasattr(result.content, 'dict') else result.content)
        else:
            context.logger.error("No content returned from Agno agent")
            return response.text("❌ No content could be extracted from the provided URL.")
            
    except Exception as e:
        context.logger.error(f"WebExtractionAgent Error: {e}")
        context.logger.debug(traceback.format_exc())
        return response.text(f"❌ Error extracting web content: {str(e)}")
