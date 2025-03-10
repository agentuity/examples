import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  const { action, userId, preferences } = request.data.json;

  switch (action) {
    case 'get': {
      // Retrieve user preferences
      const data = await context.kv.get('user-preferences', userId);

      if (!data) {
        return await response.json({ message: 'No preferences found' });
      }

      // Convert ArrayBuffer to string and parse as JSON
      const prefsString = new TextDecoder().decode(data);
      const userPrefs = JSON.parse(prefsString);

      return await response.json({
        message: 'User preferences retrieved',
        preferences: userPrefs
      });
    }
    case 'set': {
      // Store user preferences
      if (!userId || !preferences) {
        return await response.json({ error: 'User ID and preferences are required' });
      }

      // Convert preferences to JSON string and then to ArrayBuffer
      const prefsString = JSON.stringify(preferences);
      const prefsBuffer = new TextEncoder().encode(prefsString);

      // Store in key-value storage with 24-hour TTL
      await context.kv.set('user-preferences', userId, prefsBuffer, { ttl: 86400 });

      return await response.json({
        message: 'User preferences saved',
        userId
      });
    }
    case 'delete': {
      // Delete user preferences
      if (!userId) {
        return await response.json({ error: 'User ID is required' });
      }

      await context.kv.delete('user-preferences', userId);

      return await response.json({
        message: 'User preferences deleted',
        userId
      });
    }
    default:
      return await response.json({ error: 'Invalid action. Use "get", "set", or "delete".' });
  }
}
