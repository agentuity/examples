# Platform Setup Guide

This guide covers creating and configuring Slack and Discord bots for this integration. You only need to set up the platforms you want to use — adapters are enabled conditionally based on which environment variables are present.

---

## Slack Setup

### 1. Deploy to get your project URL

Deploy to Agentuity cloud first — you'll need the URL for the Slack manifest:

```bash
bun run deploy
```

Copy the project URL shown after deployment (e.g., `https://<your-project>.agentuity.run`).

> **Tip:** Set a vanity hostname for a cleaner URL:
> ```bash
> agentuity project hostname set my-bot
> ```
> You can also attach a custom domain with `agentuity project domain`.

### 2. Create the app from a manifest

Go to [api.slack.com/apps](https://api.slack.com/apps), click **Create New App**, then choose **From an app manifest**.

Select your workspace, then paste the manifest from [`slack-manifest.yaml`](./slack-manifest.yaml). Replace the two placeholders:

- `{YOUR_BOT_NAME}` — Your bot's display name
- `{YOUR_WEBHOOK_URL}` — Your project URL from step 1

Click **Next**, review the summary, then click **Create**. Slack will verify the webhook URL immediately — since you already deployed, verification will succeed.

### 3. Get your credentials

After creating the app:

1. Go to **Install App** in the left sidebar (under Settings). Click **Install to Workspace** and authorize the app. Copy the **Bot User OAuth Token** (`xoxb-...`) shown on the page.
2. Go to **Basic Information** in the left sidebar. Under **App Credentials**, copy the **Signing Secret**.

### 4. Update .env and redeploy

Add both values to your `.env` file:

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

Redeploy so the credentials are live:

```bash
bun run deploy
```

### 5. Invite the bot and test

In any Slack channel, run:

```
/invite @YourBotName
```

Then @mention the bot to start a conversation:

```
@YourBotName hello
```

The bot will subscribe to the thread and respond to subsequent messages without needing further @mentions.

---

## Discord Setup

### 1. Create the application

Go to [discord.com/developers/applications](https://discord.com/developers/applications) and click **New Application**. Give it a name (e.g., "Agentuity Bot") and click **Create**.

### 2. Get your credentials

Gather all three values from the Developer Portal:

1. In **General Information**, copy the **Application ID** and **Public Key**.
2. Go to **Bot** in the left sidebar. Click **Reset Token** and confirm. Copy the token — this is only displayed once.

### 3. Enable Message Content Intent

Still in the **Bot** section, scroll down to **Privileged Gateway Intents**. Enable **Message Content Intent**.

This is required for the bot to read message text in servers.

### 4. Generate an invite URL and invite the bot

Go to **OAuth2 > URL Generator** in the left sidebar.

Under **Scopes**, select:
- `bot`
- `applications.commands`

Under **Bot Permissions**, select:
- Send Messages
- Create Public Threads
- Send Messages in Threads
- Read Message History
- Add Reactions

Copy the generated URL at the bottom of the page. Open it in your browser, select your server, and click **Authorize**.

> **Note:** These permissions are granted per-server during the invite flow. The **Bot Permissions** checkboxes in the Developer Portal's Bot section only control defaults for new invite URLs — they don't affect permissions already granted to your bot in a server.

### 5. Update .env and deploy

Add all three values to your `.env` file:

```bash
DISCORD_BOT_TOKEN=...
DISCORD_PUBLIC_KEY=...
DISCORD_APPLICATION_ID=...
```

Deploy to Agentuity:

```bash
bun run deploy
```

### 6. Test

@mention the bot in your Discord server to start a conversation.

### How Discord Messages Work

Unlike Slack (which pushes all events via HTTP webhooks), Discord delivers regular messages over a persistent WebSocket connection called the Gateway. The Chat SDK Discord adapter opens this Gateway connection automatically when the server starts.

The adapter uses **Gateway forwarding mode**: events arrive over WebSocket and are forwarded to the local webhook endpoint (`/api/webhooks/discord`) internally. This bypasses Discord's Ed25519 signature verification, which is incompatible with platform proxies that modify request bytes. The setup is automatic — as long as your bot token and Message Content Intent are configured, the Gateway connection starts when the server boots.

No Interactions Endpoint URL configuration is needed for @mention-based conversations.

> **Slash commands (optional):** If you later add slash commands or button interactions, you'll need to set the Interactions Endpoint URL in the Discord Developer Portal to `https://<your-project>.agentuity.run/api/webhooks/discord`. These interaction payloads use HTTP webhooks with Ed25519 verification, which is separate from Gateway forwarding.

---

## Environment Variables Reference

| Variable | Platform | Description |
|----------|----------|-------------|
| `AGENTUITY_SDK_KEY` | Agentuity | SDK key for AI Gateway and KV storage access |
| `SLACK_BOT_TOKEN` | Slack | Bot User OAuth Token (`xoxb-...`), from OAuth & Permissions |
| `SLACK_SIGNING_SECRET` | Slack | Request signing secret, from Basic Information > App Credentials |
| `DISCORD_BOT_TOKEN` | Discord | Bot token, from the Bot section (only shown once after reset) |
| `DISCORD_PUBLIC_KEY` | Discord | Public key for verifying interaction payloads, from General Information |
| `DISCORD_APPLICATION_ID` | Discord | Application (client) ID, from General Information |

Adapters are enabled automatically: Slack activates when both `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` are set. Discord activates when all three Discord variables are set. Unset platforms are ignored.

---

## Local Development

Use `bun run dev` to iterate on agent logic locally. When you're ready to test with real Slack/Discord webhooks, redeploy with `bun run deploy`. Your `.env` variables are synced to the cloud automatically on each deploy.

---

## References

- [Chat SDK Adapters Overview](https://chat-sdk.dev/docs/adapters)
- [Chat SDK Discord Adapter](https://chat-sdk.dev/docs/adapters/discord)
- [Chat SDK Slack Adapter](https://chat-sdk.dev/docs/adapters/slack)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Slack API Apps](https://api.slack.com/apps)
