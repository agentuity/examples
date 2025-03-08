# Error Handling Example

## Overview
This example demonstrates best practices for error handling in Agentuity agents using the JavaScript SDK. It shows how to create custom error classes, validate input, and return appropriate error responses.

## How It Works
The agent implements a simple banking service with two operations:

1. **Withdraw**: Simulates a withdrawal operation
   - Validates that the amount is a positive number
   - Checks for sufficient funds (fails if amount > 1000)
   - Returns a success message with transaction ID on success

2. **Deposit**: Simulates a deposit operation
   - Validates that the amount is a positive number
   - Returns a success message with transaction ID on success

The example demonstrates three types of error handling:

1. **Validation Errors**: For invalid input data (400 Bad Request)
2. **Business Errors**: For business rule violations (403 Forbidden)
3. **System Errors**: For unexpected errors (500 Internal Server Error)

## Usage Example
Send a JSON request with the following structure:

```json
// Successful withdrawal
{
  "action": "withdraw",
  "userId": "user123",
  "amount": 500
}

// Failed withdrawal (insufficient funds)
{
  "action": "withdraw",
  "userId": "user123",
  "amount": 1500
}

// Successful deposit
{
  "action": "deposit",
  "userId": "user123",
  "amount": 1000
}

// Validation error (missing amount)
{
  "action": "withdraw",
  "userId": "user123"
}
```

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd error-handling

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd error-handling

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
