import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const toolAccessStep: TradeoffStep = {
  id: 'tool-access',
  title: 'Tool Integration',
  description: 'How should the agent access external tools and data?',
  recommended: 'mcp',
  choices: [
    {
      id: 'mcp',
      label: 'MCP (Model Context Protocol)',
      description: 'Use MCP as the standard for agent-to-tool communication.',
      metrics: { interop: 15, safety: 10, complexity: -10 },
      pros: [
        { title: 'Standard tool interface', description: 'Unified protocol for connecting agents to databases, APIs, calculators, and file systems.' },
        { title: 'Growing ecosystem', description: 'Large and expanding library of MCP-compatible tools and servers across the industry.' },
        { title: 'Simple to implement', description: 'Stateless call-response pattern with well-defined schemas for tools, resources, and prompts.' },
        { title: 'Complements A2A perfectly', description: 'MCP handles internal tool access; A2A handles external agent coordination. They are designed to work together.' },
      ],
      cons: [
        { title: 'Tool-only scope', description: 'MCP is not designed for agent-to-agent coordination or task lifecycle management.' },
      ],
      whyThisFits: 'MCP + A2A is the recommended combination. MCP handles tool access internally with its simple, stateless interface, while A2A handles agent coordination externally with stateful tasks and streaming.',
    },
    {
      id: 'direct-api',
      label: 'Direct API Calls',
      description: 'Agent calls external APIs directly without a standard protocol.',
      metrics: { interop: -10, safety: -5, complexity: 10 },
      pros: [
        { title: 'Direct access', description: 'No intermediary layer; agent calls the API with full control over requests and responses.' },
      ],
      cons: [
        { title: 'No standardization', description: 'Each API requires custom integration code, authentication, and error handling.' },
        { title: 'Security surface area', description: 'Agent needs direct credentials for every service, increasing exposure if compromised.' },
        { title: 'No tool ecosystem', description: 'Cannot reuse tools from other agents or share tools across the organization.' },
      ],
      whenToUse: 'When you have a single, well-documented API with no need for tool abstraction or reuse across agents.',
    },
    {
      id: 'function-calling',
      label: 'Native Function Calling',
      description: "Use the LLM provider's native function or tool calling feature.",
      metrics: { interop: -5, safety: 0, complexity: 0 },
      pros: [
        { title: 'Built into most LLMs', description: 'OpenAI, Anthropic, Google, and others provide native tool calling in their APIs.' },
        { title: 'Simple for basic use cases', description: 'Minimal setup for connecting a single agent to a handful of tools.' },
      ],
      cons: [
        { title: 'Provider-locked', description: 'Function calling schemas differ between providers, making it hard to switch LLMs or share tool definitions.' },
        { title: 'No standardization', description: 'Each provider has its own conventions for tool schemas, error handling, and streaming.' },
        { title: 'Limited tool ecosystem', description: 'Tools are tightly coupled to one agent and one provider, preventing reuse.' },
      ],
      whenToUse: 'Quick prototypes or when locked into a single LLM provider with no plans for multi-agent coordination.',
    },
  ],
}
