from agentuity import AgentRequest, AgentResponse, AgentContext
from claude_code_sdk import AssistantMessage, ResultMessage, query, ClaudeCodeOptions
from pathlib import Path

def welcome():
    return {
        "welcome": "Welcome to the Claude Code Agent! I can help you build AI-powered applications using the Claude Code SDK!",
        "prompts": [
            {
                "data": {"session": "sess_123", "prompt": "Write a haiku about dog.py"},
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        ## Get the prompt and session from the request.
        data = await request.data.json()    
        prompt = data["prompt"]
        session = data["session"]

        ## Get the conversation history from the KV store.
        historyDataResult = await context.kv.get("claude-code-sessions", session)   
        if historyDataResult.exists and historyDataResult.data is not None:
            history = await historyDataResult.data.text()
            history += f"User: {prompt}\n\n"
        else:
            history = f"User: {prompt}\n\n"


        ## Send the prompt to the Claude Code.
        result = ""
        async for message in query(
            prompt = f"""
You are a helpful coding assistant with access to the codebase. You can read files, make changes, and run commands.

User prompt:
{prompt}

Conversation history:
{history}
""",
            options=ClaudeCodeOptions(
                max_turns=5, 
                permission_mode="acceptEdits",
                cwd=Path("claude-references/"), # This directory contains a list of example files for Claude Code to interact with.
                allowed_tools=["Read", "Write", "Bash"],
                )
        ):
            # print(message)

            ## If the message is a ResultMessage, that means the assistant has finished executing and we can return the result to the user.
            if(isinstance(message, ResultMessage)):
                result += message.result or ""
                history += f"Assistant: {message.result}\n\n"

        ## Save the conversation history to the KV store.
        await context.kv.set("claude-code-sessions", session, history)
        return response.text(result or "No result.")

    except Exception as e:
        context.logger.error(f"Error running agent: {e}")
        return response.text("Sorry, there was an error processing your request.")
