from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI
import re
import json
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi
import textwrap

client = AsyncOpenAI()


# Agent welcome message with example prompts
def welcome():
    return {
        "welcome": "Welcome to the YouTube to Blog Agent! I can help you convert YouTube videos into blog posts.",
        "prompts": [
            {
                "data": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "contentType": "text/plain"
            },
            {
                "data": "Convert this YouTube video to a blog post: https://youtu.be/example",
                "contentType": "text/plain"
            }
        ]
    }

# Extract YouTube video ID from various URL formats
def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[-1].split('?')[0]
    elif 'youtube.com/watch' in url:
        parsed_url = urlparse(url)
        return parse_qs(parsed_url.query).get('v', [None])[0]
    elif 'youtube.com/embed/' in url:
        return url.split('youtube.com/embed/')[-1].split('?')[0]
    else:
        return None

# Fetch transcript from YouTube using video ID
def get_youtube_transcript(video_id):
    """Get transcript from YouTube video"""
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        full_transcript = ' '.join([snippet.text for snippet in transcript])
        return full_transcript
    except Exception as e:
        raise Exception(f"Error fetching transcript: {str(e)}")

# Find YouTube URL in input text using regex patterns
def extract_youtube_url(text):
    """Extract YouTube URL from input text"""
    url_patterns = [
        r'https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+',
        r'https?://youtu\.be/[\w-]+',
        r'https?://(?:www\.)?youtube\.com/embed/[\w-]+'
    ]
    
    for pattern in url_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    
    return None

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Get user input text
        user_input = await request.data.text() or ""
        
        # Extract YouTube URL from input
        youtube_url = extract_youtube_url(user_input)
        
        if not youtube_url:
            return response.text("Please provide a valid YouTube URL to convert to a blog post. Supported formats: youtube.com/watch?v=..., youtu.be/..., or youtube.com/embed/...")
        
        context.logger.info(f"Processing YouTube URL: {youtube_url}")
        
        # Parse video ID from URL
        video_id = extract_video_id(youtube_url)
        if not video_id:
            return response.text("Unable to extract video ID from the provided URL. Please check the URL format.")
        
        context.logger.info(f"Extracted video ID: {video_id}")
        
        # Fetch transcript from YouTube
        try:
            transcript = get_youtube_transcript(video_id)
            context.logger.info(f"Retrieved transcript with {len(transcript)} characters")
        except Exception as e:
            return response.text(f"Error retrieving transcript: {str(e)}. Make sure the video has captions available.")
        
        context.logger.info(f"Using full transcript with {len(transcript)} characters")
        
        # Generate blog post using OpenAI
        result = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are an assistant for YouTube Transcript to Blog conversion. 
                    Your task is to analyze the provided YouTube transcript chunks and create a well-structured, engaging blog post.
                    
                    Guidelines:
                    - Create a compelling title
                    - Write an engaging introduction
                    - Organize content with clear headings and subheadings
                    - Extract key points and insights from the transcript
                    - Maintain a conversational yet professional tone
                    - Add a conclusion that summarizes main takeaways
                    - Make the content readable and engaging for a blog audience"""
                },
                {
                    "role": "user",
                    "content": f"Convert this YouTube transcript to a blog post:\n\n{transcript}"
                },
            ],
        )

        blog_content = result.choices[0].message.content
        
        context.logger.info("Successfully generated blog post")
        
        return response.text(blog_content)

    except Exception as e:
        context.logger.error(f"Error running agent: {e}")
        return response.text(f"Sorry, there was an error processing your request: {str(e)}")