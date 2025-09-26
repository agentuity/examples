import base64
from pathlib import Path
from textwrap import dedent
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.openai import OpenAITools
from agno.tools.reasoning import ReasoningTools
from agno.utils.media import download_file, save_base64_data

meeting_summarizer = Agent(
    name="Meeting Summarizer & Visualizer Agent",
    instructions=dedent("""
        This script uses OpenAITools (transcribe_audio, generate_image, generate_speech)
        to process a meeting recording, summarize it, visualize it, and create an audio summary.
        
        Requires: pip install openai agno
        
        You are a meeting summarizer and visualizer. Your job is to:
        1. Transcribe audio recordings of meetings
        2. Extract key discussion points from meeting transcripts
        3. Identify action items and decisions made
        4. Summarize the main topics covered
        5. List attendees if mentioned
        6. Create visual representations of the meeting content
        7. Generate audio summaries
        
        Format your response with clear sections:
        - Meeting Overview
        - Key Discussion Points  
        - Decisions Made
        - Action Items
        - Next Steps (if any)
    """),
    model=Gemini(id="gemini-1.5-flash"),
    tools=[OpenAITools(), ReasoningTools()],
)
