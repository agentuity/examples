from textwrap import dedent
import traceback
from agentuity import AgentRequest, AgentResponse, AgentContext
from agno.agent import Agent as AgnoAgent
from agno.models.openai import OpenAIChat
from agno.tools.firecrawl import FirecrawlTools
from agno.tools.reasoning import ReasoningTools

competitor_analysis_agent = AgnoAgent(
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        FirecrawlTools(
            search=True,
            crawl=True,
            mapping=True,
            formats=["markdown", "links", "html"],
            search_params={
                "limit": 2,
            },
            limit=5,
        ),
        ReasoningTools(
            add_instructions=True,
        ),
    ],
    instructions=[
        "1. Initial Research & Discovery:",
        "   - Use search tool to find information about the target company",
        "   - Search for '[company name] competitors', 'companies like [company name]'",
        "   - Search for industry reports and market analysis",
        "   - Use the think tool to plan your research approach",
        "2. Competitor Identification:",
        "   - Search for each identified competitor using Firecrawl",
        "   - Find their official websites and key information sources",
        "   - Map out the competitive landscape",
        "3. Website Analysis:",
        "   - Scrape competitor websites using Firecrawl",
        "   - Map their site structure to understand their offerings",
        "   - Extract product information, pricing, and value propositions",
        "   - Look for case studies and customer testimonials",
        "4. Deep Competitive Analysis:",
        "   - Use the analyze tool after gathering information on each competitor",
        "   - Compare features, pricing, and market positioning",
        "   - Identify patterns and competitive dynamics",
        "   - Think through the implications of your findings",
        "5. Strategic Synthesis:",
        "   - Conduct SWOT analysis for each major competitor",
        "   - Use reasoning to identify competitive advantages",
        "   - Analyze market trends and opportunities",
        "   - Develop strategic recommendations",
        "- Always use the think tool before starting major research phases",
        "- Use the analyze tool to process findings and draw insights",
        "- Search for multiple perspectives on each competitor",
        "- Verify information by checking multiple sources",
        "- Be thorough but focused in your analysis",
        "- Provide evidence-based recommendations",
    ],
    expected_output=dedent("""

{High-level overview of competitive landscape and key findings}

- Search queries used
- Websites analyzed
- Key information sources

- Market size and growth rate
- Key trends and drivers
- Regulatory environment

- Major players identified
- Market segmentation
- Competitive dynamics

- Website: {URL}
- Founded: {Year}
- Headquarters: {Location}
- Company size: {Employees/Revenue if available}

- Core offerings
- Key features and capabilities
- Pricing model and tiers
- Target market segments

- Website structure and user experience
- Key messaging and value propositions
- Content strategy and resources
- Customer proof points

**Strengths:**
- {Evidence-based strengths}

**Weaknesses:**
- {Identified weaknesses}

**Opportunities:**
- {Market opportunities}

**Threats:**
- {Competitive threats}

1. {Major insight with evidence}
2. {Competitive dynamics observed}
3. {Market gaps identified}

1. {Actionable recommendations}
2. {Competitive positioning advice}

{Summary of competitive position and strategic imperatives}
"""),
    markdown=True,
    add_datetime_to_context=True,
    stream_intermediate_steps=True,
)

def welcome():
    return {
        "welcome": "🔍 I'm your competitive intelligence specialist! I can analyze any company's competitive landscape using advanced web research and reasoning tools.",
        "prompts": [
            {
                "data": "Analyze OpenAI's main competitors in the LLM space",
                "contentType": "text/plain"
            },
            {
                "data": "Compare Uber vs Lyft in the ride-sharing market",
                "contentType": "text/plain"
            },
            {
                "data": "Research fintech competitors to Stripe",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        user_input = (await request.data.text()).strip()
        context.logger.info(f"Received competitive analysis request: {user_input}")
        
        result = competitor_analysis_agent.run(user_input)
        
        return response.text(result)
        
    except Exception as e:
        context.logger.error(f"Competitor Analysis Agent Error: {e}")
        context.logger.debug(traceback.format_exc())
        msg = str(e).lower()
        if "rate limit" in msg:
            return response.text("❌ API rate limit exceeded. Please try again later.")
        if "network" in msg:
            return response.text("❌ Network error. Please check your internet connection and try again later.")
        return response.text("❌ Unexpected error during competitive analysis. Please try again later.")
