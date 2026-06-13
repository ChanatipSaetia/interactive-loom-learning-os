import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const agentCommStep: TradeoffStep = {
  id: 'agent-comm',
  title: 'Agent Communication',
  description: 'How should agents talk to each other?',
  recommended: 'a2a',
  choices: [
    {
      id: 'a2a',
      label: 'A2A (Agent-to-Agent)',
      description: 'Use the open A2A standard for agent-to-agent coordination with task lifecycle, multi-turn support, and discovery.',
      metrics: { interop: 20, safety: 10, complexity: -5 },
      pros: [
        { title: 'Framework-agnostic', description: 'Agents built on LangGraph, CrewAI, Semantic Kernel, or ADK can all communicate through the same protocol.' },
        { title: 'Task lifecycle management', description: 'Built-in SUBMITTED → WORKING → COMPLETED states with streaming updates for long-running tasks.' },
        { title: 'Agent discovery', description: 'Agent Cards at /.well-known/agent-card enable automatic discovery of agent capabilities.' },
        { title: 'Multi-turn collaboration', description: 'Stateful task tracking supports iterative negotiation and multi-step coordination between agents.' },
      ],
      cons: [
        { title: 'Endpoint implementation required', description: 'Each agent must implement A2A endpoints (/sendMessage, /sendMessageStream).' },
      ],
      whyThisFits: 'A2A is the mature, widely-adopted standard for agent coordination. It preserves agent opacity while enabling interoperability across frameworks, with task lifecycle, streaming, and discovery built in.',
    },
    {
      id: 'custom-http',
      label: 'Custom HTTP APIs',
      description: 'Build bespoke REST/GraphQL endpoints for each agent integration.',
      metrics: { interop: -10, safety: -10, complexity: 10 },
      pros: [
        { title: 'Full control', description: 'Complete freedom over the interface design, data shapes, and authentication.' },
        { title: 'No protocol learning curve', description: 'Standard HTTP patterns everyone already knows.' },
      ],
      cons: [
        { title: 'No standardization', description: 'Each integration is custom code with its own conventions and edge cases.' },
        { title: 'No discovery', description: 'Consumers must be hardcoded to know each agent endpoint and its schema.' },
        { title: 'Reinventing the wheel', description: 'Task lifecycle, streaming, auth, and error handling must be built from scratch for every integration.' },
      ],
      whenToUse: 'Only suitable for single-vendor, tightly controlled environments with no interoperability requirements.',
    },
    {
      id: 'mcp-only',
      label: 'MCP Only (Agent-to-Tool)',
      description: 'Use MCP for everything, including agent coordination.',
      metrics: { interop: -5, safety: 5, complexity: 5 },
      pros: [
        { title: 'Simple tool-based interface', description: 'Agents expose capabilities as tools with a straightforward call-response pattern.' },
        { title: 'Growing ecosystem', description: 'Large and rapidly expanding library of MCP-compatible tools and servers.' },
      ],
      cons: [
        { title: 'Not designed for agent-to-agent', description: 'MCP is a stateless tool-calling protocol; it lacks task lifecycle, multi-turn negotiation, and agent discovery.' },
        { title: 'Flattens agent capabilities', description: 'Wrapping an agent as an MCP tool hides its ability to negotiate, iterate, and provide intermediate progress.' },
      ],
      whenToUse: 'MCP excels at tool calling within a single agent. It is not designed for cross-agent coordination and will force you to reimplement patterns A2A provides natively.',
    },
  ],
}
