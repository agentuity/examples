from agentuity import AgentRequest, AgentResponse, AgentContext


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.data.json
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
                "key": product["id"],
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
        ids = await context.vector.upsert("products", documents)

        return response.json({
            "message": f"Indexed {len(ids)} products successfully",
            "ids": ids
        })
    
    elif action == "search":
        # Search for products by semantic similarity
        if not query:
            return response.json({"error": "Query is required for search"})

        # Perform semantic search
        results = await context.vector.search(
            "products",
            query,
            limit=5,
            similarity=0.5,
            metadata={}
        )

        # Format results
        formatted_results = [
            {
                "id": result.id,
                "key": result.key,
                "similarity": 1.0 - result.distance,
                "metadata": result.metadata
            }
            for result in results
        ]

        return response.json({
            "message": f"Found {len(results)} matching products",
            "results": formatted_results
        })
    
    elif action == "delete":
        # Delete products from vector storage
        if not isinstance(products, list) or len(products) == 0:
            return response.json({"error": "No product IDs to delete"})

        # Extract product IDs
        product_ids = [p["id"] for p in products]
        
        # Delete from vector database
        count = await context.vector.delete("products", product_ids[0])
        
        return response.json({
            "message": f"Deleted {count} products successfully",
            "ids": product_ids
        })
    
    else:
        return response.json({"error": 'Invalid action. Use "index", "search", or "delete".'})
