import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'

export const aiAgentNodes: FlowchartNode[] = [
  { id: 'user', label: 'User', stereotype: 'actor', icon: 'User', layer: 0 },
  { id: 'ai-agent', label: 'AI Agent', stereotype: 'agent', icon: 'Bot', layer: 1 },
  { id: 'llm', label: 'LLM', stereotype: 'model', icon: 'Brain', layer: 2 },
  { id: 'tools-search', label: 'Tools: Search', stereotype: 'tool', icon: 'Search', layer: 2 },
  { id: 'tools-code', label: 'Tools: Code', stereotype: 'tool', icon: 'Code', layer: 2 },
  { id: 'memory', label: 'Memory', stereotype: 'storage', icon: 'Database', layer: 2 },
]

export const aiAgentEdges: FlowchartEdge[] = [
  { from: 'user', to: 'ai-agent' },
  { from: 'ai-agent', to: 'llm' },
  { from: 'ai-agent', to: 'tools-search' },
  { from: 'ai-agent', to: 'tools-code' },
  { from: 'ai-agent', to: 'memory' },
  { from: 'tools-search', to: 'ai-agent' },
  { from: 'tools-code', to: 'ai-agent' },
  { from: 'llm', to: 'ai-agent' },
  { from: 'ai-agent', to: 'user' },
]

export const aiAgentJourneys: Journey[] = [
  {
    id: 'query-journey',
    label: 'Query Journey',
    description: 'Shows how a user query flows through the AI Agent: received, processed by the LLM, routed to a search tool, and returned as a response.',
    steps: [
      { nodeId: 'user', description: 'User sends a query' },
      { nodeId: 'ai-agent', description: 'AI Agent receives the query' },
      { nodeId: 'llm', description: 'LLM processes the query' },
      { nodeId: 'ai-agent', description: 'AI Agent routes to search tool' },
      { nodeId: 'tools-search', description: 'Search tool is invoked' },
      { nodeId: 'ai-agent', description: 'AI Agent processes search results' },
      { nodeId: 'user', description: 'Response returned to user' },
    ],
  },
  {
    id: 'tool-use-journey',
    label: 'Tool Use Journey',
    description: 'Demonstrates the agent determining which tool to use, executing the code tool, and compiling results before responding to the user.',
    steps: [
      { nodeId: 'user', description: 'User sends a request' },
      { nodeId: 'ai-agent', description: 'AI Agent receives the request' },
      { nodeId: 'llm', description: 'LLM determines tool needed' },
      { nodeId: 'ai-agent', description: 'AI Agent routes to code tool' },
      { nodeId: 'tools-code', description: 'Code tool is executed' },
      { nodeId: 'ai-agent', description: 'AI Agent compiles results' },
      { nodeId: 'user', description: 'Response returned to user' },
    ],
  },
]
