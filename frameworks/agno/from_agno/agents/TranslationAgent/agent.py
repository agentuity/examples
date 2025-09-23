from textwrap import dedent
from agentuity import AgentRequest, AgentResponse, AgentContext
import traceback
import asyncio

try:
    from agno.agent import Agent as AgnoAgent
    from agno.models.openai import OpenAIChat
    from agno.tools.cartesia import CartesiaTools
    from agno.utils.media import save_audio
except ImportError:
    AgnoAgent = None
    OpenAIChat = None
    CartesiaTools = None
    save_audio = None

class TranslationAgent:
    def __init__(self):
        if AgnoAgent is None:
            raise ImportError("Agno dependencies not available. Please install agno and cartesia packages.")
        
        agent_instructions = dedent("""\
            Follow these steps SEQUENTIALLY to translate text and generate a localized voice note:
            1. Identify the text to translate and the target language from the user request.
            2. Translate the text accurately to the target language. Keep this translation to use in step 9.
            3. Analyze the emotion conveyed by the translated text for a digital, happy, or neutral tone.
            4. List available voices using the list_voices tool.
            5. Select an appropriate voice based on the target language and emotion.
            6. Use the localize_voice tool to create a localized version of the selected voice.
            7. Generate audio using the text_to_speech tool with the localized voice and translated text.
            8. Save the generated audio using the save_audio function.
            9. Provide the user with both the translated text and confirmation that a voice note has been generated.
            
            Important guidelines:
            - Always translate first, then analyze emotion from the translated text
            - Choose voices that match both the target language and emotional tone
            - Use voice localization to create culturally appropriate speech patterns
            - Generate audio with emotion-appropriate voice characteristics
            - Save audio files with descriptive names
            - Provide clear feedback about both translation and voice generation
        """)
        
        self.agent = AgnoAgent(
            name="Emotion-Aware Translator Agent",
            description="Translates text, analyzes emotion, selects a suitable voice, creates a localized voice, and generates a voice note using Cartesia TTS tools.",
            instructions=agent_instructions,
            model=OpenAIChat(id="gpt-4o-mini"),
            tools=[CartesiaTools(voice_localize_enabled=True)],
        )

    async def run(self, request: AgentRequest, response: AgentResponse, context: AgentContext):
        try:
            user_input = (await request.data.text()).strip()
            context.logger.info(f"Received translation request: {user_input}")
            
            if AgnoAgent is None:
                return response.text("❌ Translation agent not available. Missing agno or cartesia dependencies.")
            
            agno_response = await asyncio.to_thread(self.agent.run, user_input)
            
            response_text = str(agno_response)
            
            if hasattr(agno_response, 'audio') and agno_response.audio:
                response_text += "\n\n🎵 Voice note has been generated successfully!"
            
            return response.text(response_text)
            
        except Exception as e:
            context.logger.error(f"TranslationAgent Error: {e}")
            context.logger.debug(traceback.format_exc())
            msg = str(e).lower()
            if "rate limit" in msg:
                return response.text("❌ API rate limit exceeded. Please try again later.")
            if "network" in msg:
                return response.text("❌ Network error. Please check your internet connection and try again later.")
            if "import" in msg or "module" in msg:
                return response.text("❌ Missing dependencies. Please ensure agno and cartesia packages are installed.")
            return response.text("❌ Translation failed. Please try again later.")

def welcome():
    return {
        "welcome": "🌍 I can translate text to any language and create emotion-aware voice notes using advanced voice localization!",
        "prompts": [
            {
                "data": "Translate 'Hello, how are you today?' to French and create a voice note",
                "contentType": "text/plain"
            },
            {
                "data": "Convert 'I'm so excited about this project!' to Spanish with an enthusiastic voice",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        agent = TranslationAgent()
        return await agent.run(request, response, context)
    except ImportError:
        return response.text("❌ Translation agent not available. Missing agno or cartesia dependencies.")
