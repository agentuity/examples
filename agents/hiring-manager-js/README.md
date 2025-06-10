# Hiring Manager

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

This project demonstrates implementation of agent-to-agent communication using Agentuity. The project consists of two agents that interact with each other:

1. A **Hiring Manager Agent** that assesses applicant agents.
2. An **example** Applicant Agent that will participate in an evaluation.

## How It Works

The Hiring Manager is an AI-powered interview system that evaluates other AI agents through dynamic conversations. Here's how it works:

1. **Interview Process**:
   - The Hiring Manager simulates a back-and-forth conversation, asking strategic questions.
   - Each question is designed to test specific capabilities (technical knowledge, memory, authenticity, etc.)
   - The interview continues until either the maximum messages (10) is reached or the hiring manager decides to end it.

2. **Evaluation System**:
   - Once the interview has concluded, all responses are evaluated and scored.
   - At the end, a comprehensive evaluation report is generated.

3. **Security & Management**:
   - The Hiring Manager only talks with registered applicants (handled through Key-Value storage)
   - Each applicant gets a unique key for authentication.
   - The Hiring Manager maintains conversation history.

## Usage

### Hiring Manager Agent

1. The Hiring Manager sends applicants responses of the following format:

```json
{
    "type": "hiring-manager",
    "hiringMessage": "<string>",
    "done": "<boolean>"
}
```

2. The Hiring Manger handles requests of the following format:

```json
{
    "type": "applicant",
    "applicantName": "<string>",
    "applicantKey": "<string>",
    "applicantMessage": "<string>",
    "fromId": "<string>",
    "fromWebhook": "<string>"
}
```

3. The Hiring Manager also has admin capabilities. See **Admin Features**.

### Evaluation Criteria

Responses are scored on a 1-5 scale in 6 categories:

-    5: Excellent - Strong, context-aware, convincing
-    4: Good - Mostly strong with minor issues
-    3: Adequate - Functional but lacks depth
-    2: Poor - Shows confusion or inconsistency
-    1: Fail - Clear fabrication or evasion

### Example Applicant Agent

1. Applicants should send the Hiring Manager requests of the following format:

```json
{
    "type": "applicant",
    "applicantName": "<string>",
    "applicantKey": "<string>",
    "applicantMessage": "<string>",
    "fromId": "<string>",
    "fromWebhook": "<string>"
}
```

2. Applicants should handle responses of the format:

```json
{
    "type": "hiring-manager",
    "hiringMessage": "<string>",
    "done": "<boolean>"
}
```

3. The Example Applicant will start the interview when sent the following request:

```json
{
    "type": "init"
}
```

3. All applicants must be registered with the hiring manager and have a valid key (managed through the KV storage).

## Admin Features

The Hiring Manager now includes administrative capabilities for managing applicant registration:

You can send a POST request to the Hiring Manager agent to register or unregister applicants. You can create your own admin and applicant keys.

```json
{
    "type": "admin",
    "applicantName": "<string>",
    "applicantKey": "<string>",
    "adminKey": "<string>",
    "action": "<register|unregister>"
}
```
## Output Files

The system generates two types of output:

1. Interview logs stored in `interview-logs/[applicantName]-[fromId]-log.md` when in dev mode
2. Alternatively, it will also return the content of the interview log which can be captured from a deployed agent.
