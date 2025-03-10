import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  const { action, query, products } = request.data.json;

  switch (action) {
    case 'index': {
      // Index products in vector storage
      if (!Array.isArray(products) || products.length === 0) {
        return await response.json({ error: 'No products to index' });
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

      return await response.json({
        message: `Indexed ${ids.length} products`,
        ids
      });
    }
    case 'search': {
      // Search for products by description
      if (!query) {
        return await response.json({ error: 'Search query is required' });
      }

      // Search vector database
      const results = await context.vector.search('products', query, {
        limit: 5,
        similarity: 0.7
      });

      return await response.json({
        message: `Found ${results.length} matching products`,
        results
      });
    }
    case 'delete': {
      // Delete products from vector storage
      if (!Array.isArray(products) || products.length === 0) {
        return await response.json({ error: 'No product IDs to delete' });
      }

      // Extract product IDs
      const productIds = products.map(product => product.id);

      // Delete from vector database
      await context.vector.delete('products', ...productIds);

      return await response.json({
        message: `Deleted ${productIds.length} products`,
        ids: productIds
      });
    }
    default:
      return await response.json({ error: 'Invalid action. Use "index", "search", or "delete".' });
  }
}
