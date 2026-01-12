# TensorLake Document AI Agent

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

A serverless document processing agent built with Agentuity and TensorLake DocumentAI to parse documents, extract structured data, and detect signatures — all through a simple HTTP endpoint.

## Introduction

This repository contains a single powerful agent:

- **TensorLake Agent**: Parses PDFs and documents using TensorLake's DocumentAI, extracts structured data using Pydantic schemas, and optionally detects signatures on document pages.

The agent uses TensorLake's cloud-based document processing to handle OCR, text extraction, and schema-based data extraction, while Agentuity provides instant deployment as an HTTP endpoint with zero infrastructure.

## Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/agentuity/tensorlake-agent.git
   cd tensorlake-agent
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

## Configuration


1. Open `.env` and set:
   ```
   TENSORLAKE_API_KEY=your_tensorlake_api_key
   ```

   Get your API key from the [TensorLake Dashboard](https://docs.tensorlake.ai/platform/authentication#api-keys).

## Project Structure

```
.
├── agentuity_agents
│   └── tensorlake_agent
│       └── agent.py          # Main agent logic with schemas
├── agentuity.yaml            # Agentuity project configuration
├── pyproject.toml            # Python dependencies
├── server.py                 # Agentuity server entry point
└── README.md
```

## Agent

### TensorLake Agent

- **File**: `agentuity_agents/tensorlake_agent/agent.py`
- **Purpose**:
  1. Parse documents (PDFs, images) and extract content as markdown chunks.
  2. Extract structured data using pre-defined Pydantic schemas.
  3. Optionally detect signatures on document pages.
  4. Provide demo mode for testing without API quota.

### Available Actions

| Action | Description |
|--------|-------------|
| `parse` | Parse a document and extract structured data |
| `status` | Check status of a parse job |
| `analyze` | Run local text analysis on provided text |
| `schemas` | List all available extraction schemas |

### Available Schemas

| Schema | Use Case |
|--------|----------|
| `real-estate` | Purchase agreements, leases — extracts buyer/seller info and signatures |
| `invoice` | Invoices, receipts — extracts line items, totals, vendor info |
| `contract` | General contracts — extracts parties, terms, key dates |

### Example Request

```json
{
  "action": "parse",
  "file_url": "https://tlake.link/lease-agreement",
  "schema": "real-estate",
  "detect_signatures": false
}
```

### Example Response

```json
{
  "status": "success",
  "parse_id": "parse_WhgLQtzb6wTmBq6cGFtrM",
  "structured_data": [{
    "buyer": {
      "buyer_name": "Nova Ellison",
      "buyer_signature_date": "September 10, 2025",
      "buyer_signed": true
    },
    "seller": {
      "seller_name": "Juno Vega",
      "seller_signature_date": "September 10, 2025",
      "seller_signed": true
    }
  }],
  "chunk_count": 1,
  "chunk_preview": [{
    "index": 0,
    "content_preview": "## RESIDENTIAL REAL ESTATE PURCHASE AGREEMENT..."
  }]
}
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher (< 3.13)
- **uv**: Python package manager
- **TensorLake API Key**: From [TensorLake Dashboard](https://docs.tensorlake.ai/platform/authentication#api-keys)

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

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

### Request Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `file_url` | string | — | URL to the document (PDF, image, etc.) |
| `schema` | string | — | Schema name for structured extraction |
| `detect_signatures` | boolean | `false` | Enable signature detection (uses quota) |
| `wait` | boolean | `true` | Wait for completion or return immediately |
| `demo` | boolean | `false` | Return sample data without API call |

## 🛠️ Advanced Usage

### Environment Variables

You can set environment variables for your project:

```bash
agentuity env set TENSORLAKE_API_KEY your_api_key
```

### Secrets Management

For sensitive information, use secrets:

```bash
agentuity env set --secret TENSORLAKE_API_KEY your_api_key
```

### Adding Custom Schemas

Define your own Pydantic model in `agent.py`:

```python
class MyCustomSchema(BaseModel):
    field_one: str
    field_two: int

# Register it in the SCHEMAS dict:
SCHEMAS["my-custom"] = MyCustomSchema
```

Then use `"schema": "my-custom"` in your requests.

## 📖 Documentation

- **Agentuity SDK**: [agentuity.dev/SDKs/python](https://agentuity.dev/SDKs/python)
- **TensorLake Docs**: [docs.tensorlake.ai](https://docs.tensorlake.ai)
- **Sample Document**: [tlake.link/lease-agreement](https://tlake.link/lease-agreement)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [Agentuity documentation](https://agentuity.dev/SDKs/python)
2. Check the [TensorLake documentation](https://docs.tensorlake.ai)
3. Join the [Agentuity Discord community](https://discord.gg/agentuity) for support
4. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
