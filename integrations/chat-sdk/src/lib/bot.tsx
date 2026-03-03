/** @jsxImportSource chat */
import { Chat, type Adapter, type Thread, type Message } from 'chat';
import { createSlackAdapter } from '@chat-adapter/slack';
import { createDiscordAdapter } from '@chat-adapter/discord';
import { createMemoryState } from '@chat-adapter/state-memory';
import chatAgent from '@agent/chat';

// Conditionally enable adapters based on env vars
const adapters = {
	...(process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET
		? { slack: createSlackAdapter() }
		: {}),
	...(process.env.DISCORD_BOT_TOKEN &&
	process.env.DISCORD_PUBLIC_KEY &&
	process.env.DISCORD_APPLICATION_ID
		? { discord: createDiscordAdapter() }
		: {}),
} satisfies Record<string, Adapter>;

if (Object.keys(adapters).length === 0) {
	console.warn('[chat-bot] No adapters configured. Set SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET for Slack, or DISCORD_BOT_TOKEN + DISCORD_PUBLIC_KEY + DISCORD_APPLICATION_ID for Discord.');
}

export const bot = new Chat({
	userName: 'agentuity-bot',
	adapters,
	// In-memory state: subscriptions are lost on restart.
	// Switch to @chat-adapter/state-redis for persistent state.
	state: createMemoryState(),
});

async function handleMessage(thread: Thread, message: Message) {
	if (!message.text.trim()) return;

	await thread.startTyping();

	try {
		const result = await chatAgent.run({ text: message.text, threadId: thread.id });
		await thread.post(result.response);
	} catch (err) {
		// ctx.logger is not available outside the agent handler, so console.error is used here
		console.error('[chat-bot] agent invocation failed', err);
		await thread.post('Sorry, I ran into an error. Please try again.');
	}
}

// When the bot is @mentioned in a new thread
bot.onNewMention(async (thread, message) => {
	await thread.subscribe();
	await handleMessage(thread, message);
});

// When a message arrives in a subscribed thread
bot.onSubscribedMessage(async (thread, message) => {
	await handleMessage(thread, message);
});

// When a user reacts to a message in a subscribed thread
bot.onReaction(async (event) => {
	if (!event.added) return;
	await event.thread.post(`Thanks for the ${event.emoji}!`);
});
