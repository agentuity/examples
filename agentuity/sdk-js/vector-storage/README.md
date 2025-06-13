# Vector Storage Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

This example demonstrates how to use the vector storage API in the Agentuity JavaScript SDK for semantic search and retrieval of product information.

## How It Works

The agent provides three operations:

1. **Index Products**: Stores product descriptions and metadata in vector storage

   - Accepts an array of `products` with descriptions and metadata
   - Converts the products into document format with metadata
   - Returns the IDs of the indexed products

2. **Search Products**: Performs semantic search on stored products

   - Accepts a `query` parameter for semantic search
   - Optionally accepts filters based on metadata
   - Returns matching products ranked by relevance

3. **Delete Products**: Removes products from vector storage
   - Accepts an array of product IDs to delete
   - Returns a success message with the deleted IDs

## Usage Example

Send a JSON request with the following structure:

```json
// To index products
{
  "action": "index",
  "products": [
    {
      "id": "prod-001",
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "electronics",
      "description": "Premium wireless headphones with noise cancellation and 20-hour battery life."
    },
    {
      "id": "prod-002",
      "name": "Smart Watch",
      "price": 199.99,
      "category": "electronics",
      "description": "Fitness tracking smartwatch with heart rate monitoring and GPS."
    }
  ]
}

// To search products
{
  "action": "search",
  "query": "wireless audio device with noise cancellation"
}

// To delete products
{
  "action": "delete",
  "products": [
    { "id": "prod-001" },
    { "id": "prod-002" }
  ]
}
```

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd vector-storage

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

## Deployment

To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd vector-storage

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation

For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
