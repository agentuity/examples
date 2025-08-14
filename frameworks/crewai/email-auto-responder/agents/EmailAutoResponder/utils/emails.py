import os
import time
from typing import List

from langchain_community.agent_toolkits import GmailToolkit
from langchain_community.tools.gmail.search import GmailSearch

from agents.EmailAutoResponder.types import Email

def check_emails(checked_emails_ids: set[str]) -> tuple[List[Email], set[str]]:
    print("🔍 Checking for new emails")
    
    gmail = GmailToolkit()
    search = GmailSearch(api_resource=gmail.api_resource)
    emails = search("after:newer_than:1d")
    thread = []
    new_emails: List[Email] = []
    for email in emails:
        if (
            (email["id"] not in checked_emails_ids)
            and (email["threadId"] not in thread)
            and (os.environ["MY_EMAIL"] not in email["sender"])
        ):
            thread.append(email["threadId"])
            new_emails.append(
                {
                    "id": email["id"],
                    "threadId": email["threadId"],
                    "subject": email["subject"],
                    "snippet": email["snippet"],
                    "sender": email["sender"],
                }
            )

    checked_emails_ids.update([email["id"] for email in emails])
    return new_emails, checked_emails_ids

def format_emails(new_emails, updated_checked_email_ids):
    print(f"📧 Checking for new emails")
    new_emails, updated_checked_email_ids = check_emails(
        checked_emails_ids=updated_checked_email_ids
    )
    print(f"📧 Found {len(new_emails)} new emails")
    return new_emails, updated_checked_email_ids
