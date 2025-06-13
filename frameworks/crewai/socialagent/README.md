# 🧠 CrewAI Social Agent

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

This project is adapted from [MxMnr/crew-ai-simple-social-template](https://github.com/MxMnr/crew-ai-simple-social-template) and restructured to work with [Agentuity](https://agentuity.com).

The **CrewAI Social Agent** is a multi-agent app that takes a topic and generates LinkedIn-ready social media content. It uses a structured CrewAI workflow with three roles: **researcher**, **writer**, and **editor**.

---

## 📌 What It Does

- Accepts a user-defined topic (e.g., _"Why small teams outperform incumbents"_)
- Searches for relevant articles using a web search tool
- Summarizes insights and extracts key quotes
- Generates polished LinkedIn-style posts using markdown formatting

Each run produces:
- ✅ A few complete LinkedIn posts
- 📝 Summaries of each article
- 🔗 Reference links to the sources

---

## 🔧 Requirements

To run this agent, you’ll need:

- ✅ An API key from [Serper.dev](https://serper.dev/) (used for Google Search)

---

## 🔑 Environment Setup

Create a `.env` file in the project root and add your Serper API key:

SERPER_API_KEY=your-key-here

## 🚀 How to Run the Agent

### 1. Clone the Repository

```bash
git clone https://github.com/dhilanfye34/examples.git
cd examples/frameworks/crewai/socialagent
```

### 2. Set Up Environment & Dependencies

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install required Python packages:

```bash
pip install crewai crewai-tools python-dotenv uv
```

### 3. Run in Development Mode

Start the agent in dev mode:

```bash
agentuity dev
```

When prompted in the UI, enter a topic like:

```
How small teams out-execute large corporations
```

The agent will generate:
- A markdown file in the `outputs/` folder
- LinkedIn-ready content
- Article summaries
- Reference links

---

## ☁️ Deploy to Agentuity Cloud

To deploy your agent:

```bash
agentuity deploy
```


# Agentuity CLI Help

Welcome to your Agentuity Python Agent project! This README provides essential information to help you get started with developing, testing, and deploying your AI agents.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

## 🚀 Getting Started

### Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### Creating a New Agent

To create a new agent in your project:

```bash
agentuity agent new
```

Follow the interactive prompts to configure your agent.

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your Agent to the Agentuity Console in Live Mode, allowing you to test and debug your agent in real-time.

You can also start your project in development mode without connecting to the Agentuity Console:

```bash
uv run server.py
```

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agents/             # Agent definitions and implementations
├── .venv/              # Virtual environment (created by UV)
├── pyproject.toml      # Project dependencies and metadata
├── server.py           # Server entry point
└── agentuity.yaml      # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🛠️ Advanced Usage

### Environment Variables

You can set environment variables for your project:

```bash
agentuity env set KEY VALUE
```

### Secrets Management

For sensitive information, use secrets:

```bash
agentuity env set --secret KEY VALUE
```

## 📖 Documentation

For comprehensive documentation on the Agentuity Python SDK, visit:
[https://agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/python)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
