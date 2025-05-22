# Key-Value Storage Example (Python)

## Overview
This example demonstrates how to use the key-value storage API in the Agentuity Python SDK to store and retrieve user preferences.

## How It Works
The agent provides three operations:

1. **Get Preferences**: Retrieves stored user preferences
   - Accepts a `userId` parameter
   - Returns the stored preferences or a "not found" message

2. **Set Preferences**: Stores user preferences
   - Accepts `userId` and `preferences` parameters
   - Stores the preferences with a 30-day TTL (Time To Live)
   - Returns a success message

3. **Delete Preferences**: Removes stored user preferences
   - Accepts a `userId` parameter
   - Returns a success message

## Usage Example
Send a JSON request with the following structure:

```json
// To store preferences
{
  "action": "set",
  "userId": "user123",
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en"
  }
}

// To retrieve preferences
{
  "action": "get",
  "userId": "user123"
}

// To delete preferences
{
  "action": "delete",
  "userId": "user123"
}
```

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd py-key-value-storage

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Run the agent locally
agentuity run
```

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd py-key-value-storage

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
