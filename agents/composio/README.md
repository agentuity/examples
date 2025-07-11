<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# 🤖 Composio Sample Agent

This agent demonstrates how to connect to over 300 different apps using Composio. Composio is a service that provides a simple method for connecting to a multitude of different apps, such as CRMs, ERP, financial tools, worksuite products and more.

To get started, sign up at [Composio.dev](https://composio.dev).

## Composio Configuration

There are two steps to enabling an integration with Composio.

The first is adding the integration to the app, such as Salesforce or Google. You can do this via the "Apps" explorer in Composio.

Next you'll have to create a connection by authenticating with the selected app. These connections are specific to users; you may only need to create a single connection if this tool is only used with a single instance, e.g. your own Salesforce account. You can create multiple connections if, for example, you plan on having multiple users connect to their instances of the 3rd-party app. When creating the connection, the `User ID` can be whatever you use to track users, or simply `default` if you're the only one connecting, but _you'll need to pass this ID to Composio from your agent code_ (in this sample repo, we chose `user_12345`).

Now you should have (a) an integration such as Salesforce and (b) a user-specific connection to that  integration. Add your `COMPOSIO_API_KEY` as a secret and you're ready to go.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: Version 1.2.4 or higher

## 🚀 Getting Started

### Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### Creating a New Agent

To create a new agent in your project:

```bash
agentuity agent new
```

Follow the interactive prompts to configure your agent.

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your agent to the Agentuity Console in DevMode, allowing you to test and debug your agent in real-time.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agents/             # Agent definitions and implementations
├── node_modules/       # Dependencies
├── package.json        # Project dependencies and scripts
└── agentuity.yaml      # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🛠️ Advanced Usage

### Environment Variables

You can set environment variables for your project:

```bash
agentuity env set KEY VALUE
```

### Secrets Management

For sensitive information, use secrets:

```bash
agentuity env set --secret KEY VALUE
```

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
