# Recipe Creator Agent

This agent is ported from the [Agno recipe-creator example](https://docs.agno.com/examples/use-cases/agents/recipe-creator) and demonstrates how to create an intelligent recipe recommendation system using the Agentuity platform.

## Overview

The Recipe Creator agent (ChefGenius) is a passionate and knowledgeable culinary expert that helps users create delicious meals by providing detailed, personalized recipes based on their available ingredients, dietary restrictions, and time constraints.

## Features

- **Ingredient Analysis**: Understands available ingredients and dietary restrictions
- **Recipe Search**: Uses Exa semantic search to find relevant recipes
- **Detailed Instructions**: Provides complete ingredient lists, cooking steps, and nutritional information
- **Smart Recommendations**: Includes substitution options, cooking tips, and meal prep suggestions
- **Rich Formatting**: Uses markdown with emoji indicators for dietary preferences

## Example Prompts

- "I have chicken, rice, and vegetables. What can I make in 30 minutes?"
- "Create a vegetarian pasta recipe with mushrooms and spinach"
- "Suggest healthy breakfast options with oats and fruits"
- "What can I make with leftover turkey and potatoes?"
- "Need a quick dessert recipe using chocolate and bananas"

## Local Development

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Start the development server:
   ```bash
   agentuity dev
   ```

3. The agent will be available at the printed local URL (typically http://127.0.0.1:3500)

## Dependencies

- **agno**: Core framework for building AI agents
- **exa_py**: Semantic search tool for finding relevant recipes
- **agentuity**: Platform SDK for deployment and management

## Agent Architecture

The agent follows the Agentuity wrapper pattern:
- `recipe_agent.py`: Contains the core Agno agent implementation
- `agent.py`: Provides the Agentuity wrapper with `welcome()` and `run()` functions
- Uses async execution to handle the synchronous Agno agent calls
- Implements proper error handling and response formatting
