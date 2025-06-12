# REMEMBER TO INSTALL ALL DEPENDENCIES IN REQUIREMENTS.TXT

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>


## Agents added from Agno

These agents were ported directly from Agno's official examples and added into the Agentuity framework.

## Finance Agent  
Ported from: https://docs.agno.com/examples/agents/finance-agent  
This agent first uses a query parser to understand the user’s request and extract relevant stock tickers and intent, then pulls real-time pricing, fundamentals, analyst ratings, and news from Yahoo! Finance, and finally feeds all of that into GPT-4o to produce a structured, up-to-date market analysis.

## YouTube Agent  
Ported from: https://docs.agno.com/examples/agents/youtube-agent  
This agent fetches YouTube video transcripts, inspects video metadata and structure, generates precise, meaningful timestamps for key segments, groups related content, and leverages GPT-4o to produce comprehensive video breakdowns, summaries, and highlight notes—perfect for content creators, researchers, and viewers.

## Recipe Agent  
Ported from: https://docs.agno.com/examples/agents/recipe-creator  
This agent takes in ingredient lists or recipe preferences, performs a semantic search to find relevant recipes, and uses GPT-4o to generate a fully formatted, easy-to-follow recipe with instructions, ingredients, and cooking tips. It’s ideal for home cooks, meal planners, or anyone looking to create a dish from what they have on hand.

## Movie Agent  
Ported from: https://docs.agno.com/examples/agents/movie-recommender  
This agent takes user preferences (genres, favorite movies, desired themes), performs a semantic search using Exa, and leverages GPT-4o to generate personalized movie recommendations. It returns titles with release dates, genres, ratings, summaries, and more—ideal for film lovers, casual viewers, and anyone planning their next movie night.

## Book Agent  
Ported from: https://docs.agno.com/examples/agents/books-recommender  
This agent takes in favorite books, genres, and reading preferences, uses Exa for a semantic search of literary databases, and calls GPT-4o to deliver personalized book recommendations. Each suggestion includes title, author, rating, plot summary, and content tags—great for avid readers, book clubs, or anyone searching for their next great read.

## Travel Agent  
Ported from: https://docs.agno.com/examples/agents/travel-planner  
This agent takes in a user’s travel goals—like destination, group size, trip type, and budget—and generates a detailed, multi-day itinerary using GPT-4o and Exa. It provides curated accommodation suggestions, activity planning, transportation logistics, and local tips. Ideal for individuals, families, or teams planning anything from vacations to offsites.

## Research Agent
Ported from: https://docs.agno.com/examples/agents/research-agent
This agent combines powerful web search (DuckDuckGo + Newspaper4k) with GPT-4o to produce professional, New York Times-style investigative reports. It performs multi-source research, cross-verifies facts, and delivers polished, objective long-form articles on any topic. Ideal for researchers, journalists, analysts, or anyone who needs in-depth reporting and synthesis.

## Academic Research Agent  
Ported from: https://docs.agno.com/examples/agents/research-agent-exa
This agent is designed for scholarly research and academic reporting. It uses Exa’s academic search tools to find the latest peer-reviewed literature, synthesize insights across disciplines, and produce well-structured, citation-rich reports. It’s ideal for researchers, students, and professionals seeking rigorous academic analysis.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))

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
