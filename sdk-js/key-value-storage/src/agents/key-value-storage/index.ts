import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  const { action, userId, preferences } = request.json();

  switch (action) {
    case 'get': {
      // Retrieve user preferences
      const data = await context.kv.get('user-preferences', userId);

      if (!data) {
        return response.json({ message: 'No preferences found' });
      }

      // Convert ArrayBuffer to string and parse as JSON
      const prefsString = new TextDecoder().decode(data);
      const userPrefs = JSON.parse(prefsString);

      return response.json({ preferences: userPrefs });
    }
    case 'set': {
      // Store user preferences
      await context.kv.set(
        'user-preferences',
        userId,
        JSON.stringify(preferences),
        // Optional TTL (30 days in seconds)
        60 * 60 * 24 * 30
      );

      return response.json({ message: 'Preferences saved successfully!' });
    }
    case 'delete': {
      // Delete user preferences
      await context.kv.delete('user-preferences', userId);
      
      return response.json({ message: 'Preferences deleted successfully!' });
    }
    default:
      return response.json({ error: 'Invalid action. Use "get", "set", or "delete".' });
  }
}
