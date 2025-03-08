<div align="center">
    <strong>Agentuity Examples</strong> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
<a href="https://github.com/agentuity/examples"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-Examples-blue"></a>
<a href="https://github.com/agentuity/examples/blob/main/LICENSE.md"><img alt="License" src="https://badgen.now.sh/badge/license/Apache-2.0"></a>
<a href="https://discord.gg/vtn3hgUfuc"><img alt="Join the community on Discord" src="https://img.shields.io/discord/1332974865371758646.svg?style=flat"></a>
</div>
</div>

# Agentuity Examples

> [!WARNING]  
> This repository is under heavy development and it is not yet stable or ready for use.

This repository contains a collection of examples that demonstrate how to build and deploy agents using the Agentuity platform. These examples are designed to help you get started with Agentuity and provide reference implementations that you can use, copy, or adapt for your own projects.

## Documentation

For comprehensive documentation on Agentuity, visit our documentation site at [agentuity.dev](https://agentuity.dev).

## Examples

This repository contains various examples organized by framework:

### Mastra

The Mastra framework examples demonstrate how to build agents using Agentuity's Mastra framework:

- **mastra-simple-prompt**: A basic example showing how to create a simple prompt-based agent
- **mastra-simple-weather**: An example agent that retrieves weather information
- **mastra-bird-checker**: An agent that identifies birds from descriptions
- **mastra-weather-workflow**: A more complex weather agent with workflow capabilities
- **mastra-multi-step-workflow**: An example demonstrating multi-step workflows

Each example directory contains its own README with specific instructions and explanations.

## Getting Started

To use these examples, you'll need to have the Agentuity CLI installed. If you haven't installed it yet, you can do so using:

```bash
# For Mac (using Homebrew)
brew tap agentuity/tap && brew install agentuity

# For other platforms
# Download from https://github.com/agentuity/cli/releases
```

Once you have the CLI installed, you can clone this repository and explore the examples:

```bash
git clone https://github.com/agentuity/examples.git
cd examples
```

To run an example, navigate to its directory and follow the instructions in its README.

## Contributing

Contributions are welcome! If you have an example you'd like to add, please submit a pull request.

## Related Projects

- [Agentuity CLI](https://github.com/agentuity/cli): Command-line tools for building and deploying agents
- [Agentuity JavaScript SDK](https://github.com/agentuity/sdk-js): JavaScript SDK for building agents

## License

See the [LICENSE](LICENSE.md) file for details.
