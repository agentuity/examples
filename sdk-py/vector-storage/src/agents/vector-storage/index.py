from agentuity import AgentRequest, AgentResponse, AgentContext
import json


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.json()
    action = data.get("action")
    query = data.get("query")
    products = data.get("products")

    if action == "index":
        # Index products in vector storage
        if not isinstance(products, list) or len(products) == 0:
            return response.json({"error": "No products to index"})

        # Prepare documents for vector storage
        documents = [
            {
                "document": product["description"],
                "metadata": {
                    "id": product["id"],
                    "name": product["name"],
                    "price": product["price"],
                    "category": product["category"]
                }
            }
            for product in products
        ]

        # Store in vector database
        ids = await context.vector.upsert("products", *documents)

        return response.json({
            "message": f"Indexed {len(ids)} products successfully",
            "ids": ids
        })
    
    elif action == "search":
        # Search for products by semantic similarity
        if not query:
            return response.json({"error": "Query is required for search"})

        # Perform semantic search
        results = await context.vector.search("products", query, {
            "limit": 5,
            "filter": {
                # Optional: Add filters based on metadata
                # "category": "electronics"
            }
        })

        return response.json({
            "message": f"Found {len(results)} matching products",
            "results": results
        })
    
    elif action == "delete":
        # Delete products from vector storage
        if not isinstance(products, list) or len(products) == 0:
            return response.json({"error": "No product IDs to delete"})

        # Extract product IDs
        product_ids = [p["id"] for p in products]
        
        # Delete from vector database
        await context.vector.delete("products", *product_ids)
        
        return response.json({
            "message": f"Deleted {len(product_ids)} products successfully",
            "ids": product_ids
        })
    
    else:
        return response.json({"error": 'Invalid action. Use "index", "search", or "delete".'})
