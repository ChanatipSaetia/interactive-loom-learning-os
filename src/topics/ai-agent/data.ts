import type { FlowchartNode, FlowchartEdge } from '../../sections/flowchart'

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
]
