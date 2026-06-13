import { Wrench } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const mcpCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Wrench as unknown as ComponentType<any>,
  title: 'MCP — Agent-to-Tool',
  subtitle: 'Stateless function calls to external resources',
  description: 'Model Context Protocol connects agents to data and tools through stateless function calls. The agent invokes tools like a developer calls APIs — query a database, call an HTTP endpoint, run a calculator — and receives results immediately.',
  details: 'MCP uses a request-response pattern where the agent sends a tool call with parameters and gets back a result. It is stateless per call: the tool does not remember previous interactions. MCP defines a standard schema for tool capabilities so any MCP-compatible client can discover and invoke tools from any MCP-compatible server.',
  analogy: 'Like a developer using CLI tools and APIs — you call them to get things done, they return a result, and the conversation is over.',
  primaryFocus: 'Tool schema, stateless function calls, request-response pattern',
  inScope: ['Database queries', 'API calls', 'File system access', 'Calculations', 'Stateless operations'],
  outOfScope: ['Multi-turn collaboration', 'Task lifecycle management', 'Agent-to-agent negotiation'],
  color: 'teal',
}
