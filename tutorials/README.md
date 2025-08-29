<div align="center">
    <img src="../.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Agentuity Examples</strong> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
<a href="https://github.com/agentuity/examples"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-Examples-blue"></a>
<a href="https://github.com/agentuity/examples/blob/main/LICENSE.md"><img alt="License" src="https://badgen.now.sh/badge/license/Apache-2.0"></a>
<a href="https://discord.gg/agentuity"><img alt="Join the community on Discord" src="https://img.shields.io/discord/1332974865371758646.svg?style=flat"></a>
</div>
</div>

# Tutorials

This directory contains step-by-step tutorials for getting started with the Agentuity platform.

These tutorials are designed to help you learn the fundamentals of building AI agents, from basic concepts to advanced features like storage and scheduling. Each tutorial includes complete code examples and can be deployed directly to the Agentuity platform.

## Video Tutorials

**YouTube Playlist**: [Agentuity Tutorials](https://www.youtube.com/playlist?list=PLnOYEHNTwKeOA0OKAphsqRfUEQuACOPA3)

## Available Tutorials

### 1. [01-intro-agent](./01-intro-agent/)
**GitHub Issue Responder Agent**  
Learn the basics of building an AI agent that automatically triages GitHub issues. This tutorial covers:
- Setting up your first Agentuity agent
- Processing incoming requests
- Integrating with external APIs (GitHub)
- Using AI for classification and response generation

### 2. [02-storage-types](./02-storage-types/)
**Documentation Storage Agent**  
Explore different storage options available in Agentuity. This tutorial demonstrates:
- Key-Value storage for simple data
- Vector storage for semantic search
- Object storage for files and documents
- Building a documentation search agent

### 3. [03-cron-demo](./03-cron-demo/)
**Scheduled News Digest Agent**  
Learn how to create agents that run on a schedule. This tutorial shows:
- Setting up cron-based scheduling
- Fetching data from external sources (Hacker News)
- Generating AI-powered summaries
- Storing and retrieving digest data

## Getting Started

Each tutorial folder contains:
- Complete source code
- README with detailed instructions
- `agentuity.yaml` configuration file
- All necessary dependencies

To run any tutorial:
1. Navigate to the tutorial directory
2. Follow the setup instructions in that tutorial's README
3. Run in development mode: `agentuity dev`
4. Deploy to production: `agentuity deploy`

## Learn More

- [Agentuity Documentation](https://agentuity.dev)
- [JavaScript SDK Reference](https://agentuity.dev/SDKs/javascript)
- [Python SDK Reference](https://agentuity.dev/SDKs/python)
- [Join our Discord](https://discord.gg/agentuity)