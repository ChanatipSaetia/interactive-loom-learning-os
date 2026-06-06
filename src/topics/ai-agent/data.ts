import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'

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

// ─── Tradeoff Sandbox: AI Agent design decisions ─────────────────────────────

export const aiAgentScenarios: TradeoffScenario[] = [
  {
    id: 'ai-agent-design',
    title: 'AI Agent Design Decisions',
    description: 'Evaluate trade-offs across orchestration strategies and component placements.',
    metrics: [
      { id: 'reasoning', label: 'Reasoning Accuracy', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'speed', label: 'Execution Speed', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Infrastructure Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'cost', label: 'Token Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'orchestration',
        title: 'Orchestration Strategy',
        description: 'You\'re building an AI agent to research and summarize a topic. The task is well-defined, linear, and doesn\'t require parallel work.',
        recommended: 'react-loop',
        choices: [
          {
            id: 'react-loop',
            label: 'ReAct Loop',
            description: 'A single agent alternates between reasoning (Thought) and action (Act) steps, observing results before continuing to the next iteration.',
            metrics: { reasoning: 5, speed: -5, complexity: -10, cost: -5 },
            pros: [
              { title: 'Simple to implement', description: 'Easy to build and debug' },
              { title: 'Low infrastructure', description: 'Minimal setup overhead' },
              { title: 'Linear task support', description: 'Works well for sequential tasks' },
            ],
            cons: [
              { title: 'Sequential execution', description: 'Blocks on each tool call' },
              { title: 'Context window limits', description: 'Fills up on long tasks' },
              { title: 'Hard to parallelize', description: 'Sub-tasks run sequentially' },
            ],
            whyThisFits: 'For a well-defined, linear task, a single ReAct loop is simpler to implement, easier to debug, and has lower infrastructure overhead than a multi-agent pipeline.',
          },
          {
            id: 'multi-agent-pipeline',
            label: 'Multi-Agent Pipeline',
            description: 'An orchestrator delegates sub-tasks to specialized sub-agents that can run concurrently, then aggregates their results.',
            metrics: { reasoning: 15, speed: 10, complexity: 20, cost: 20 },
            pros: [
              { title: 'Parallel execution', description: 'Independent sub-tasks run concurrently' },
              { title: 'Focused context', description: 'Each agent has a smaller context' },
              { title: 'Easier to scale', description: 'Simple to add specialized agents' },
            ],
            cons: [
              { title: 'Coordination complexity', description: 'More complex orchestration logic' },
              { title: 'Cross-agent debugging', description: 'Harder to trace failures' },
              { title: 'Messaging overhead', description: 'Requires robust inter-agent messaging' },
            ],
            whenToUse: 'Best when the task has multiple independent sub-tasks that benefit from parallel execution.',
          },
        ],
      },
      {
        id: 'component-placement',
        title: 'Component Placement',
        description: 'You\'re designing the memory subsystem for an AI agent that needs to recall facts across sessions.',
        recommended: 'vector-db',
        choices: [
          {
            id: 'vector-db',
            label: 'Vector DB + Embeddings (Memory Layer)',
            description: 'Store facts as vector embeddings in a database like Pinecone or Chroma, then retrieve semantically similar memories at query time.',
            metrics: { reasoning: 10, speed: 5, complexity: 5, cost: 5 },
            pros: [
              { title: 'Semantic search', description: 'Finds similar facts by meaning' },
              { title: 'Scales massively', description: 'Handles millions of facts' },
              { title: 'Persistent memory', description: 'Survives across sessions' },
            ],
            cons: [
              { title: 'Embedding overhead', description: 'Requires embedding model' },
              { title: 'Approximate matches', description: 'May miss exact keyword matches' },
            ],
            whyThisFits: 'A vector database with embeddings enables semantic search over stored facts, making it ideal for cross-session recall where exact keyword matching is insufficient.',
          },
          {
            id: 'code-sandbox',
            label: 'Code Sandbox (Tool Layer)',
            description: 'Use an isolated execution environment where the agent can run code to process or transform data at runtime.',
            metrics: { reasoning: 5, speed: -5, complexity: 15, cost: 10 },
            pros: [
              { title: 'Full computation', description: 'Complete computational power' },
              { title: 'Arbitrary logic', description: 'Execute any code at runtime' },
              { title: 'Data processing', description: 'Good for transforming data' },
            ],
            cons: [
              { title: 'Security concerns', description: 'Risky with untrusted code' },
              { title: 'Slower execution', description: 'Slower than simple lookups' },
              { title: 'No persistence', description: 'Not designed for persistent memory' },
            ],
            whenToUse: 'Use when the agent needs to execute code, run computations, or process data dynamically.',
          },
          {
            id: 'chain-of-thought',
            label: 'Chain-of-Thought (Reasoning Layer)',
            description: 'Prompt the LLM to reason step-by-step, showing its internal thought process before producing the final answer.',
            metrics: { reasoning: 15, speed: -10, complexity: -5, cost: 15 },
            pros: [
              { title: 'Better reasoning', description: 'Improves reasoning accuracy' },
              { title: 'Transparent decisions', description: 'Shows decision process' },
              { title: 'No dependencies', description: 'No external tools needed' },
            ],
            cons: [
              { title: 'No persistence', description: 'Does not persist across sessions' },
              { title: 'Context limits', description: 'Limited by context window' },
              { title: 'Token heavy', description: 'More tokens per query' },
            ],
            whenToUse: 'Use when the agent needs to show its reasoning process or tackle complex multi-step problems within a single session.',
          },
        ],
      },
    ],
  },
]
