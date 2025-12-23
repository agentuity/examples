# Agentuity CLI Skills

This directory contains auto-generated [Agent Skills](https://agentskills.io) for the Agentuity CLI.

## What are Agent Skills?

Agent Skills are modular capabilities that extend AI coding agents. Each skill is a directory
containing a `SKILL.md` file with instructions that agents read when performing relevant tasks.

Learn more at the [Agent Skills Specification](https://agentskills.io/specification).

## Generated From

- **CLI Version**: 0.0.103
- **Generated**: 2025-12-23
- **Total Skills**: 88

## Available Skills

### auth

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-auth-login](./agentuity-cli-auth-login) | `agentuity auth login` | Login to the Agentuity Platform using a browser-based authen... |
| [agentuity-cli-auth-logout](./agentuity-cli-auth-logout) | `agentuity auth logout` | Logout of the Agentuity Cloud Platform |
| [agentuity-cli-auth-ssh-add](./agentuity-cli-auth-ssh-add) | `agentuity auth ssh add` | Add an SSH public key to your account (reads from file or st... |
| [agentuity-cli-auth-ssh-delete](./agentuity-cli-auth-ssh-delete) | `agentuity auth ssh delete` | Delete an SSH key from your account |
| [agentuity-cli-auth-ssh-list](./agentuity-cli-auth-ssh-list) | `agentuity auth ssh list` | List all SSH keys on your account |
| [agentuity-cli-auth-whoami](./agentuity-cli-auth-whoami) | `agentuity auth whoami` | Display information about the currently authenticated user |

### build

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-build](./agentuity-cli-build) | `agentuity build` | Build Agentuity application for deployment |

### cloud

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-cloud-agent-get](./agentuity-cli-cloud-agent-get) | `agentuity cloud agent get` | Get details about a specific agent |
| [agentuity-cli-cloud-agent-list](./agentuity-cli-cloud-agent-list) | `agentuity cloud agent list` | List agents for a project |
| [agentuity-cli-cloud-apikey-create](./agentuity-cli-cloud-apikey-create) | `agentuity cloud apikey create` | Create a new API key |
| [agentuity-cli-cloud-apikey-delete](./agentuity-cli-cloud-apikey-delete) | `agentuity cloud apikey delete` | Delete an API key (soft delete) |
| [agentuity-cli-cloud-apikey-get](./agentuity-cli-cloud-apikey-get) | `agentuity cloud apikey get` | Get a specific API key by id |
| [agentuity-cli-cloud-apikey-list](./agentuity-cli-cloud-apikey-list) | `agentuity cloud apikey list` | List all API keys |
| [agentuity-cli-cloud-db-create](./agentuity-cli-cloud-db-create) | `agentuity cloud db create` | Create a new database resource |
| [agentuity-cli-cloud-db-delete](./agentuity-cli-cloud-db-delete) | `agentuity cloud db delete` | Delete a database resource |
| [agentuity-cli-cloud-db-get](./agentuity-cli-cloud-db-get) | `agentuity cloud db get` | Show details about a specific database |
| [agentuity-cli-cloud-db-list](./agentuity-cli-cloud-db-list) | `agentuity cloud db list` | List database resources |
| [agentuity-cli-cloud-db-logs](./agentuity-cli-cloud-db-logs) | `agentuity cloud db logs` | Get query logs for a specific database |
| [agentuity-cli-cloud-db-sql](./agentuity-cli-cloud-db-sql) | `agentuity cloud db sql` | Execute SQL query on a database |
| [agentuity-cli-cloud-deploy](./agentuity-cli-cloud-deploy) | `agentuity cloud deploy` | Deploy project to the Agentuity Cloud |
| [agentuity-cli-cloud-deployment-list](./agentuity-cli-cloud-deployment-list) | `agentuity cloud deployment list` | List deployments |
| [agentuity-cli-cloud-deployment-logs](./agentuity-cli-cloud-deployment-logs) | `agentuity cloud deployment logs` | View logs for a specific deployment |
| [agentuity-cli-cloud-deployment-remove](./agentuity-cli-cloud-deployment-remove) | `agentuity cloud deployment remove` | Remove a specific deployment |
| [agentuity-cli-cloud-deployment-rollback](./agentuity-cli-cloud-deployment-rollback) | `agentuity cloud deployment rollback` | Rollback the latest to the previous deployment |
| [agentuity-cli-cloud-deployment-show](./agentuity-cli-cloud-deployment-show) | `agentuity cloud deployment show` | Show details about a specific deployment |
| [agentuity-cli-cloud-deployment-undeploy](./agentuity-cli-cloud-deployment-undeploy) | `agentuity cloud deployment undeploy` | Undeploy the latest deployment |
| [agentuity-cli-cloud-env-delete](./agentuity-cli-cloud-env-delete) | `agentuity cloud env delete` | Delete an environment variable |
| [agentuity-cli-cloud-env-get](./agentuity-cli-cloud-env-get) | `agentuity cloud env get` | Get an environment variable value |
| [agentuity-cli-cloud-env-import](./agentuity-cli-cloud-env-import) | `agentuity cloud env import` | Import environment variables from a file to cloud and local ... |
| [agentuity-cli-cloud-env-list](./agentuity-cli-cloud-env-list) | `agentuity cloud env list` | List all environment variables |
| [agentuity-cli-cloud-env-pull](./agentuity-cli-cloud-env-pull) | `agentuity cloud env pull` | Pull environment variables from cloud to local .env.producti... |
| [agentuity-cli-cloud-env-push](./agentuity-cli-cloud-env-push) | `agentuity cloud env push` | Push environment variables from local .env.production file t... |
| [agentuity-cli-cloud-env-set](./agentuity-cli-cloud-env-set) | `agentuity cloud env set` | Set an environment variable |
| [agentuity-cli-cloud-keyvalue-create-namespace](./agentuity-cli-cloud-keyvalue-create-namespace) | `agentuity cloud keyvalue create-namespace` | Create a new keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-delete](./agentuity-cli-cloud-keyvalue-delete) | `agentuity cloud keyvalue delete` | Delete a key from the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-delete-namespace](./agentuity-cli-cloud-keyvalue-delete-namespace) | `agentuity cloud keyvalue delete-namespace` | Delete a keyvalue namespace and all its keys |
| [agentuity-cli-cloud-keyvalue-get](./agentuity-cli-cloud-keyvalue-get) | `agentuity cloud keyvalue get` | Get a value from the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-keys](./agentuity-cli-cloud-keyvalue-keys) | `agentuity cloud keyvalue keys` | List all keys in a keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-list-namespaces](./agentuity-cli-cloud-keyvalue-list-namespaces) | `agentuity cloud keyvalue list-namespaces` | List all keyvalue namespaces |
| [agentuity-cli-cloud-keyvalue-repl](./agentuity-cli-cloud-keyvalue-repl) | `agentuity cloud keyvalue repl` | Start an interactive repl for working with keyvalue database |
| [agentuity-cli-cloud-keyvalue-search](./agentuity-cli-cloud-keyvalue-search) | `agentuity cloud keyvalue search` | Search for keys matching a keyword in a keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-set](./agentuity-cli-cloud-keyvalue-set) | `agentuity cloud keyvalue set` | Set a key and value in the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-stats](./agentuity-cli-cloud-keyvalue-stats) | `agentuity cloud keyvalue stats` | Get statistics for keyvalue storage |
| [agentuity-cli-cloud-redis-show](./agentuity-cli-cloud-redis-show) | `agentuity cloud redis show` | Show Redis connection URL |
| [agentuity-cli-cloud-scp-download](./agentuity-cli-cloud-scp-download) | `agentuity cloud scp download` | Download a file using security copy |
| [agentuity-cli-cloud-scp-upload](./agentuity-cli-cloud-scp-upload) | `agentuity cloud scp upload` | Upload a file using security copy |
| [agentuity-cli-cloud-secret-delete](./agentuity-cli-cloud-secret-delete) | `agentuity cloud secret delete` | Delete a secret |
| [agentuity-cli-cloud-secret-get](./agentuity-cli-cloud-secret-get) | `agentuity cloud secret get` | Get a secret value |
| [agentuity-cli-cloud-secret-import](./agentuity-cli-cloud-secret-import) | `agentuity cloud secret import` | Import secrets from a file to cloud and local .env.productio... |
| [agentuity-cli-cloud-secret-list](./agentuity-cli-cloud-secret-list) | `agentuity cloud secret list` | List all secrets |
| [agentuity-cli-cloud-secret-pull](./agentuity-cli-cloud-secret-pull) | `agentuity cloud secret pull` | Pull secrets from cloud to local .env.production file |
| [agentuity-cli-cloud-secret-push](./agentuity-cli-cloud-secret-push) | `agentuity cloud secret push` | Push secrets from local .env.production file to cloud |
| [agentuity-cli-cloud-secret-set](./agentuity-cli-cloud-secret-set) | `agentuity cloud secret set` | Set a secret |
| [agentuity-cli-cloud-session-get](./agentuity-cli-cloud-session-get) | `agentuity cloud session get` | Get details about a specific session |
| [agentuity-cli-cloud-session-list](./agentuity-cli-cloud-session-list) | `agentuity cloud session list` | List recent sessions |
| [agentuity-cli-cloud-session-logs](./agentuity-cli-cloud-session-logs) | `agentuity cloud session logs` | Get logs for a specific session |
| [agentuity-cli-cloud-ssh](./agentuity-cli-cloud-ssh) | `agentuity cloud ssh` | SSH into a cloud project |
| [agentuity-cli-cloud-storage-create](./agentuity-cli-cloud-storage-create) | `agentuity cloud storage create` | Create a new storage resource |
| [agentuity-cli-cloud-storage-delete](./agentuity-cli-cloud-storage-delete) | `agentuity cloud storage delete` | Delete a storage resource or file |
| [agentuity-cli-cloud-storage-download](./agentuity-cli-cloud-storage-download) | `agentuity cloud storage download` | Download a file from storage bucket |
| [agentuity-cli-cloud-storage-get](./agentuity-cli-cloud-storage-get) | `agentuity cloud storage get` | Show details about a specific storage bucket |
| [agentuity-cli-cloud-storage-list](./agentuity-cli-cloud-storage-list) | `agentuity cloud storage list` | List storage resources or files in a bucket |
| [agentuity-cli-cloud-storage-upload](./agentuity-cli-cloud-storage-upload) | `agentuity cloud storage upload` | Upload a file to storage bucket |
| [agentuity-cli-cloud-stream-delete](./agentuity-cli-cloud-stream-delete) | `agentuity cloud stream delete` | Delete a stream by ID (soft delete) |
| [agentuity-cli-cloud-stream-get](./agentuity-cli-cloud-stream-get) | `agentuity cloud stream get` | Get detailed information about a specific stream |
| [agentuity-cli-cloud-stream-list](./agentuity-cli-cloud-stream-list) | `agentuity cloud stream list` | List recent streams with optional filtering |
| [agentuity-cli-cloud-thread-delete](./agentuity-cli-cloud-thread-delete) | `agentuity cloud thread delete` | Delete a thread |
| [agentuity-cli-cloud-thread-get](./agentuity-cli-cloud-thread-get) | `agentuity cloud thread get` | Get details about a specific thread |
| [agentuity-cli-cloud-thread-list](./agentuity-cli-cloud-thread-list) | `agentuity cloud thread list` | List recent threads |
| [agentuity-cli-cloud-vector-delete](./agentuity-cli-cloud-vector-delete) | `agentuity cloud vector delete` | Delete one or more vectors by key |
| [agentuity-cli-cloud-vector-delete-namespace](./agentuity-cli-cloud-vector-delete-namespace) | `agentuity cloud vector delete-namespace` | Delete a vector namespace and all its vectors |
| [agentuity-cli-cloud-vector-get](./agentuity-cli-cloud-vector-get) | `agentuity cloud vector get` | Get a specific vector entry by key |
| [agentuity-cli-cloud-vector-list-namespaces](./agentuity-cli-cloud-vector-list-namespaces) | `agentuity cloud vector list-namespaces` | List all vector namespaces |
| [agentuity-cli-cloud-vector-search](./agentuity-cli-cloud-vector-search) | `agentuity cloud vector search` | Search for vectors using semantic similarity |
| [agentuity-cli-cloud-vector-stats](./agentuity-cli-cloud-vector-stats) | `agentuity cloud vector stats` | Get statistics for vector storage |
| [agentuity-cli-cloud-vector-upsert](./agentuity-cli-cloud-vector-upsert) | `agentuity cloud vector upsert` | Add or update vectors in the vector storage |

### dev

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-dev](./agentuity-cli-dev) | `agentuity dev` | Build and run the development server |

### profile

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-profile-create](./agentuity-cli-profile-create) | `agentuity profile create` | Create a new configuration profile |
| [agentuity-cli-profile-current](./agentuity-cli-profile-current) | `agentuity profile current` | Show the name of the currently active profile |
| [agentuity-cli-profile-delete](./agentuity-cli-profile-delete) | `agentuity profile delete` | Delete a configuration profile |
| [agentuity-cli-profile-list](./agentuity-cli-profile-list) | `agentuity profile list` | List all available profiles |
| [agentuity-cli-profile-show](./agentuity-cli-profile-show) | `agentuity profile show` | Show the configuration of a profile |
| [agentuity-cli-profile-use](./agentuity-cli-profile-use) | `agentuity profile use` | Switch to a different configuration profile |

### project

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-project-create](./agentuity-cli-project-create) | `agentuity project create` | Create a new project |
| [agentuity-cli-project-delete](./agentuity-cli-project-delete) | `agentuity project delete` | Delete a project |
| [agentuity-cli-project-list](./agentuity-cli-project-list) | `agentuity project list` | List all projects |
| [agentuity-cli-project-show](./agentuity-cli-project-show) | `agentuity project show` | Show project detail |

### repl

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-repl](./agentuity-cli-repl) | `agentuity repl` | interactive REPL for testing |

## Usage

These skills are designed for AI coding agents that support the Agent Skills format.
Place this directory in your project or install globally for your agent to discover.

## Regenerating

To regenerate these skills with the latest CLI schema:

```bash
agentuity ai skills generate --output ./skills
```

---

*This file was auto-generated by the Agentuity CLI. Do not edit manually.*
