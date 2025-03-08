import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  const { action, query, products } = request.json();

  switch (action) {
    case 'index': {
      // Index products in vector storage
      if (!Array.isArray(products) || products.length === 0) {
        return response.json({ error: 'No products to index' });
      }

      // Prepare documents for vector storage
      const documents = products.map(product => ({
        document: product.description,
        metadata: {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category
        }
      }));

      // Store in vector database
      const ids = await context.vector.upsert('products', ...documents);

      return response.json({
        message: `Indexed ${ids.length} products successfully`,
        ids
      });
    }
    case 'search': {
      // Search for products by semantic similarity
      if (!query) {
        return response.json({ error: 'Query is required for search' });
      }

      // Perform semantic search
      const results = await context.vector.search('products', query, {
        limit: 5,
        filter: {
          // Optional: Add filters based on metadata
          // category: 'electronics'
        }
      });

      return response.json({
        message: `Found ${results.length} matching products`,
        results
      });
    }
    case 'delete': {
      // Delete products from vector storage
      if (!Array.isArray(products) || products.length === 0) {
        return response.json({ error: 'No product IDs to delete' });
      }

      // Extract product IDs
      const productIds = products.map(p => p.id);
      
      // Delete from vector database
      await context.vector.delete('products', ...productIds);
      
      return response.json({
        message: `Deleted ${productIds.length} products successfully`,
        ids: productIds
      });
    }
    default:
      return response.json({ error: 'Invalid action. Use "index", "search", or "delete".' });
  }
}
