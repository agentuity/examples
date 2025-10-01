from textwrap import dedent
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.youtube import YouTubeTools
from agentuity import AgentRequest, AgentResponse, AgentContext


def welcome():
    """Return welcome message and example prompts for the Agentuity Console."""
    return {
        "welcome": "🎥 YouTube Agent - Your intelligent YouTube content analyzer! I provide detailed video breakdowns, timestamps, and summaries. Perfect for content creators, researchers, and viewers who want to efficiently navigate video content.",
        "prompts": [
            {
                "data": "Analyze this tech review: https://www.youtube.com/watch?v=zjkBMFhNj_g",
                "contentType": "text/plain"
            },
            {
                "data": "Get timestamps for this coding tutorial: [paste your video URL]",
                "contentType": "text/plain"
            },
            {
                "data": "Break down the key points of this lecture: [paste your video URL]",
                "contentType": "text/plain"
            },
            {
                "data": "Summarize the main topics in this documentary: [paste your video URL]",
                "contentType": "text/plain"
            },
            {
                "data": "Create a study guide from this educational video: [paste your video URL]",
                "contentType": "text/plain"
            }
        ]
    }


youtube_agent = Agent(
    name="YouTube Agent",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[YouTubeTools()],
    instructions=dedent("""
        You are an expert YouTube content analyst with a keen eye for detail! 🎓
        
        Follow these steps for comprehensive video analysis:
        
        1. Video Overview
           - Check video length and basic metadata
           - Identify video type (tutorial, review, lecture, etc.)
           - Note the content structure
        
        2. Timestamp Creation
           - Create precise, meaningful timestamps
           - Focus on major topic transitions
           - Highlight key moments and demonstrations
           - Format: [start_time, end_time, detailed_summary]
        
        3. Content Organization
           - Group related segments
           - Identify main themes
           - Track topic progression
        
        Your analysis style:
        - Begin with a video overview
        - Use clear, descriptive segment titles
        - Include relevant emojis for content types:
          📚 Educational
          💻 Technical
          🎮 Gaming
          📱 Tech Review
          🎨 Creative
        - Highlight key learning points
        - Note practical demonstrations
        - Mark important references
        
        Quality Guidelines:
        - Verify timestamp accuracy
        - Avoid timestamp hallucination
        - Ensure comprehensive coverage
        - Maintain consistent detail level
        - Focus on valuable content markers
    """),
    add_datetime_to_context=True,
    markdown=True,
)


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """Main agent handler for Agentuity."""
    try:
        user_input = await request.data.text()
        
        context.logger.info("Processing YouTube video analysis request")
        
        result = youtube_agent.run(user_input, stream=False)
        
        return response.text(result.content)
        
    except Exception as e:
        context.logger.error(f"Error processing YouTube agent request: {e}")
        return response.json({
            "error": str(e),
            "message": "Failed to analyze YouTube video"
        }, metadata={"status": 500})
