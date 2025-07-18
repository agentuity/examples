# Zep and Agentuity Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

This project showcases how to integrate Zep, a memory layer, with Agentuity.

In this project, Agentuity + Zep are used to create an agent that can have a conversation with a user, all the while using the information you provide to create a graph of user information.

## Quick Start

1. Clone this repository.
2. Make sure you have installed the Agentuity CLI (`curl -fsS https://agentuity.sh | sh`)
3. Run `agentuity project import` to import the project into your Agentuity account.
4. Sign up for Zep, create a project and an API Key. Then you can put the key in your `.env` file (match formatting in `.env.example`.)
5. Run `agentuity dev` to start the local development server.

## Implementation

This project supports three actions via requests to the Agent:

1. `seed` - This action is used to add data to Zep's memory with information about a sample user. (You may need to wait a minute after doing this to interact with the data, since we are sending a lot at once.)

```json
{
  "data": {
    "action": "seed",
    "content": {
      "text": "Run this to set up Zep with information about a test user, Jane Smith."
    }
  }
}
```

2. `addUser` - This action is used to add a user to Zep's memory.

```json
{
  "data": {
    "action": "addUser",
    "content": {
      "user_id": "",
      "user_first_name": "optional",
      "user_last_name": "optional",
      "user_email": "optional"
    }
  }
}
```

3. `message` - This action is used to send a message to the agent.

```json
{
  "data": {
    "action": "message",
    "content": {
      "user_id": "Jane536a",
      "session_id": "uuid",
      "user_message": "Here you can send a message from Jane Smith, and Zep respond using what it knows about her!"
    }
  }
}
```

## Example Flow

1. Create a new user in Zep's memory.

```json
{
  "data": {
    "action": "addUser",
    "content": {
      "user_id": "abc123",
      "user_first_name": "John",
      "user_last_name": "Doe",
      "user_email": "john.doe@example.com"
    }
  }
}
```

2. Send messages to the agent from the user you just created, and Zep will use the information you provided to respond. (You can use one or multiple session IDs which you generate yourself.)

```json
{
  "data": {
    "action": "message",
    "content": {
      "user_id": "abc123",
      "session_id": "<uuid>",
      "user_message": "My favorite food is pizza."
    }
  }
}
```

```json
{
  "data": {
    "action": "message",
    "content": {
      "user_id": "abc123",
      "session_id": "<uuid>",
      "user_message": "Do you remember my favorite food?"
    }
  }
}
```

### Note:

When you add information, you can check it out in the Zep Webapp: https://app.getzep.com/
