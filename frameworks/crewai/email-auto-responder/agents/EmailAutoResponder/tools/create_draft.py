from langchain.tools import tool
from langchain_community.agent_toolkits import GmailToolkit
from langchain_community.tools.gmail.create_draft import GmailCreateDraft

@tool("Create Draft")
def create_draft(data: str):
    """
    Useful to create an email draft.
    The input to this tool should be a pipe (|) separated text
    of length three, representing the email, subject, and message.
    For example, `jdoe@gmail.com|To Meet You|Hey it was great to meet you...`
    """
    email, subject, message = data.split("|")
    gmail = GmailToolkit()
    draft = GmailCreateDraft(api_resource=gmail.api_resource)
    result = draft({"to": [email], "subject": subject, "message": message})
    return f"Draft created: {result}\n"
