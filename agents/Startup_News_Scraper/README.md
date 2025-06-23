# 🚀 Daily Startup Digest – n8n + Agentuity Automation

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

This project combines an AI-powered startup summarization agent (built with [Agentuity](https://agentuity.com)) and a scheduled [n8n](https://n8n.io) automation to deliver a **daily digest** of startup news via **Email**, **Slack**, and **Discord**.

## 🧠 What It Does

Each morning at 7 AM (or your specified time):

1. **Triggers** automatically on a schedule.
2. **Sends a POST request** to your hosted Agentuity agent, which returns a list of summarized startup stories.
3. **Processes and formats** those summaries into a clean HTML digest.
4. **Sends the digest** to your configured Email, Slack, and Discord recipients.

## 🛠 Prerequisites

You’ll need:

- An **Agentuity account** and CLI access
- A deployed **Startup Scraper Agent**
- An active **n8n instance**
- Your own:
  - **SMTP credentials** (for email)
  - Slack workspace with bot permissions (optional)
  - Discord webhook or bot (optional)

## Project Layout:

Startup_News_Scraper/
└─ src/agents/startup_scraper/
   ├─ fetchFeeds.ts   # grabs RSS + filters tech/startup keywords
   ├─ summarize.ts    # OpenAI call → JSON summary
   ├─ index.ts        # agent entry-point for Agentuity
   └─ types.ts        # shared TypeScript types
n8n_workflow/
└─ workflow.json      # downloaded workflow for n8n

## ⚙️ Step-by-Step Setup

### 1. Clone the Agent

```bash
git clone https://github.com/agentuity/examples
cd agents/Startup_News_Scraper
bun install
bun dev
```

### 2. Deploy (or run) the Agent
```bash
agentuity deploy
```

### 3. Import the n8n workflow
1. Download the JSON file from n8n_workflow/workflow.json
2. Open n8n → **Workflows → Import from file**.  
3. Select **`workflow.json`** (included in this repo).  
4. You should see a canvas with: `Schedule Trigger → HTTP Request → Code → Email / Slack / Discord`.

### 4. Set up the Agentuity API endpoint
1. In your **Agentuity** dashboard open the deployed agent, click the **➕** icon under *IO Visualization* and choose **API**.  
2. Copy the Bearer Authentication Token (You will need to add this in the HTTP Request Node in the n8n workflow)
3. Save the API Endpoint

### 5. Configure the **HTTP Request** node in n8n
1. Method – set to `POST`
2. URL – `https://agentuity.ai/api/<your-agent-id>?wait=true` (Grab this from the bottom of API pop-up in agentuity)
3. Send Headers – **enable / turn on**
    - Header 1 – Name → `Authorization`
    - Header 1 – Value → `Bearer wht_XXXXXXXXXXXXXXXXXXXXXXXX`
    - Header 2 – Name → `Content-Type`
    - Header 2 – Value → `application/json`
4. Send Body – **enable / turn on**
    - Body Content Type – select **JSON**
    - JSON Body – `{}`  (a single empty JSON object)
Query Parameters – leave **blank**

### 6. Do not adjust Code Node
1. Code node is preconfigured with the logic to transform the JSON formatted summaries to human-readable HTML.
2. Do not change.

### 7. Third Party Configuration (Email, Slack, Discord, etc.)
1. Email Send node
    - **Credentials** → *select your* **SMTP account**  
    - **Operation** → `Send`  
    - **From Email** → *your sender address*  
    - **To Email** → *recipient address(es)*  
    - **Subject** → `📬 Daily Startup Digest – {{ new Date().toLocaleDateString() }}`   *(do not change)*  
    - **Email Format** → `html`  
    - **HTML** → `{{$json["html"]}}`  *(do not change)*

2. **Slack** node  
   - **Credentials** → *select your* **Slack OAuth (bot)** credential  
   - **Resource** → `Message`  
   - **Operation** → `Send`  
   - **Send Message To** → *choose the channel or user* 
   - **Message Type** → `{{$json["html"]}}`  *(do not change)*

3. **Discord** node  
   - **Credentials** → *select your* **Discord Bot Token / Webhook** credential  
   - **Resource** → `Message`  
   - **Operation** → `Send`  
   - **Server** → *pick the target server / guild*  
   - **Send To** → *Channel* (or *User*)  
   - **Channel/User** → *select the destination*  
   - **Message** → `{{$json["html"]}}`  *(do not change)*

- You can also implement other n8n nodes:
    - Notion – create or append to a database
    - Google Sheets – log each day’s stories
    - Telegram / Teams – forward to other chat apps
    - Webhooks – POST the digest JSON to any backend
    

## 📖 Documentation

For comprehensive documentation on the Agentuity JavaScript SDK, visit:
[https://agentuity.dev/SDKs/javascript](https://agentuity.dev/SDKs/javascript)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/javascript)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
