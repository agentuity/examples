<div align="center">
    <img src="../.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Agentuity Examples</strong> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
<br />
<a href="https://github.com/agentuity/examples"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-Examples-blue"></a>
<a href="https://github.com/agentuity/examples/blob/main/LICENSE.md"><img alt="License" src="https://badgen.now.sh/badge/license/Apache-2.0"></a>
<a href="https://discord.gg/agentuity"><img alt="Join the community on Discord" src="https://img.shields.io/discord/1332974865371758646.svg?style=flat"></a>
</div>
</div>

# Agentic Patterns in Agentuity

The following patterns, adapted from [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents), serve as building blocks that can be combined to create comprehensive workflows. Each pattern addresses specific aspects of task execution, and by combining them thoughtfully, you can build reliable solutions for complex problems.

## Tech Stack

- Language: TypeScript
- Runtime: NodeJS
- LLM Framework: [Vercel AI SDK](https://sdk.vercel.ai/)
- LLM Inference: [Anthropic](https://www.anthropic.com/)
- Schema Validation: [ZOD](https://zod.dev/)

## Getting Started

NodeJS or equivalent JS runtime is required

### Clone the repository and install dependencies

```
npm install
```

### Build the project

```
npm run build
```

### Configure the project

Setup environment variables necessary to communicate with Agentuity platform by making a copy of the example .env file

```
cp .env.example .env
code .env
```

# Patterns with Examples

## Single Shot

A single shot generation example to show the simpliest form of using the AI-SDK with GenOS Express V3.

```
node ./dist/single-shot
```

## Multi-Step Tool Usage

If your use case involves solving problems where the solution path is poorly defined or too complex to map out as a workflow in advance, you may want to provide the LLM with a set of lower-level tools and allow it to break down the task into small pieces that it can solve on its own iteratively, without discrete instructions. To implement this kind of agentic pattern, you need to call an LLM in a loop until a task is complete. The AI SDK makes this simple with the maxSteps parameter.

```
node ./dist/tools
```

### Structured Answers

When building an agent for tasks like mathematical analysis or report generation, it's often useful to have the agent's final output structured in a consistent format that your application can process. You can use an answer tool and the toolChoice: 'required' setting to force the LLM to answer with a structured output that matches the schema of the answer tool. The answer tool has no execute function, so invoking it will terminate the agent.

In this example you will get a response with a natural language response and with a structured response.

```
node ./dist/answer-tool
```

## Sequential Processing (Chains)

The simplest workflow pattern executes steps in a predefined order. Each step's output becomes input for the next step, creating a clear chain of operations. This pattern is ideal for tasks with well-defined sequences, like content generation pipelines or data transformation processes.

```
node ./dist/chains
```

## Routing

This pattern allows the model to make decisions about which path to take through a workflow based on context and intermediate results. The model acts as an intelligent router, directing the flow of execution between different branches of your workflow. This is particularly useful when handling varied inputs that require different processing approaches. In the example below, the results of the first LLM call change the properties of the second LLM call like model size and system prompt.

```
node ./dist/routing
```

## Parallel Processing

Some tasks can be broken down into independent subtasks that can be executed simultaneously. This pattern takes advantage of parallel execution to improve efficiency while maintaining the benefits of structured workflows. For example, analyzing multiple documents or processing different aspects of a single input concurrently (like code review).

```
node ./dist/parallel
```

## Orchestrator-Worker

In this pattern, a primary model (orchestrator) coordinates the execution of specialized workers. Each worker is optimized for a specific subtask, while the orchestrator maintains overall context and ensures coherent results. This pattern excels at complex tasks requiring different types of expertise or processing.

```
node ./dist/orchestrator
```

## Evaluator-Optimizer

This pattern introduces quality control into workflows by having dedicated evaluation steps that assess intermediate results. Based on the evaluation, the workflow can either proceed, retry with adjusted parameters, or take corrective action. This creates more robust workflows capable of self-improvement and error recovery.

```
node ./dist/optimizer
```
