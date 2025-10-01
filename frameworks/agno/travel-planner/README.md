# Travel Planner Agent

Travel planning agent using the Agno framework, providing comprehensive itineraries and recommendations.

## Overview

This example demonstrates how to convert an Agno agent to run on the Agentuity platform. The agent uses:
- **Agno Framework**: For agent orchestration
- **OpenAI GPT-4o-mini**: For natural language processing
- **Exa Tools**: For real-time destination research

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Run the agent locally:
```bash
agentuity dev
```

## Example Prompts

- "Plan a 5-day cultural exploration trip to Kyoto for a family of 4"
- "Create a romantic weekend getaway in Paris with a $2000 budget"
- "Organize a 7-day adventure trip to New Zealand for solo travel"
- "Design a tech company offsite in Barcelona for 20 people"
- "Plan a luxury honeymoon in Maldives for 10 days"

## Features

The Travel Planner provides:
- **Comprehensive Itineraries**: Day-by-day schedules with time estimates
- **Accommodation Recommendations**: Options near key activities
- **Activity Curation**: Balanced mix of experiences
- **Budget Breakdown**: Itemized cost estimates
- **Local Insights**: Cultural notes and insider tips
- **Logistics Planning**: Transportation and transfer details

## How It Works

The agent follows a structured approach:
1. **Initial Assessment**: Understanding trip requirements
2. **Destination Research**: Using Exa to find current information
3. **Accommodation Planning**: Selecting suitable options
4. **Activity Curation**: Balancing interests and schedules
5. **Logistics Planning**: Transportation and contingencies
6. **Budget Breakdown**: Cost estimates and savings tips

## Architecture

This example uses the Agno-to-Agentuity bridge pattern:
- `agentuity_agents/TravelPlanner/travel_planner.py`: Original Agno agent definition
- `agentuity_agents/TravelPlanner/agent.py`: Agentuity async wrapper using `asyncio.run_in_executor`

The wrapper converts Agentuity's async interface to work with Agno's synchronous agent execution.
