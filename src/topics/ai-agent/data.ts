import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'
import type { SituationChoice } from '../../sections/situation-choice'

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

// ─── Situation Choice: AI Agent design decisions ─────────────────────────────

export const aiAgentSituations: SituationChoice[] = [
  {
    title: 'Orchestration Strategy',
    situation: 'You\'re building an AI agent to research and summarize a topic. The task is well-defined, linear, and doesn\'t require parallel work.',
    recommended: 'react-loop',
    recommendationDetail: {
      why: 'For a well-defined, linear task, a single ReAct loop is simpler to implement, easier to debug, and has lower infrastructure overhead than a multi-agent pipeline.',
    },
    choices: [
      {
        id: 'react-loop',
        label: 'ReAct Loop',
        description: 'A single agent alternates between reasoning (Thought) and action (Act) steps, observing results before continuing to the next iteration.',
        pros: [
          'Simple to implement and debug',
          'Low infrastructure overhead',
          'Works well for linear, sequential tasks',
        ],
        cons: [
          'Blocks on each tool call (sequential)',
          'Context window fills up on long tasks',
          'Hard to parallelize sub-tasks',
        ],
      },
      {
        id: 'multi-agent-pipeline',
        label: 'Multi-Agent Pipeline',
        description: 'An orchestrator delegates sub-tasks to specialized sub-agents that can run concurrently, then aggregates their results.',
        pros: [
          'Parallel execution of independent sub-tasks',
          'Each agent has a focused, smaller context',
          'Easier to scale and specialize',
        ],
        cons: [
          'Higher coordination complexity',
          'Harder to debug cross-agent failures',
          'Requires robust inter-agent messaging',
        ],
        whenToUse: 'Best when the task has multiple independent sub-tasks that benefit from parallel execution.',
      },
    ],
  },
  {
    title: 'Component Placement',
    situation: 'You\'re designing the memory subsystem for an AI agent that needs to recall facts across sessions.',
    recommended: 'vector-db',
    recommendationDetail: {
      why: 'A vector database with embeddings enables semantic search over stored facts, making it ideal for cross-session recall where exact keyword matching is insufficient.',
    },
    choices: [
      {
        id: 'vector-db',
        label: 'Vector DB + Embeddings (Memory Layer)',
        description: 'Store facts as vector embeddings in a database like Pinecone or Chroma, then retrieve semantically similar memories at query time.',
        pros: [
          'Semantic similarity search',
          'Scales to millions of facts',
          'Cross-session persistent memory',
        ],
        cons: [
          'Requires embedding model overhead',
          'Approximate nearest neighbor may miss exact matches',
        ],
      },
      {
        id: 'code-sandbox',
        label: 'Code Sandbox (Tool Layer)',
        description: 'Use an isolated execution environment where the agent can run code to process or transform data at runtime.',
        pros: [
          'Full computational power',
          'Can execute arbitrary logic',
          'Good for data processing tasks',
        ],
        cons: [
          'Security concerns with untrusted code',
          'Slower than simple lookups',
          'Not designed for persistent memory',
        ],
        whenToUse: 'Use when the agent needs to execute code, run computations, or process data dynamically.',
      },
      {
        id: 'chain-of-thought',
        label: 'Chain-of-Thought (Reasoning Layer)',
        description: 'Prompt the LLM to reason step-by-step, showing its internal thought process before producing the final answer.',
        pros: [
          'Improves reasoning accuracy',
          'Makes decision process transparent',
          'No external dependencies',
        ],
        cons: [
          'Does not persist across sessions',
          'Limited by context window',
          'More tokens consumed per query',
        ],
        whenToUse: 'Use when the agent needs to show its reasoning process or tackle complex multi-step problems within a single session.',
      },
    ],
  },
]
