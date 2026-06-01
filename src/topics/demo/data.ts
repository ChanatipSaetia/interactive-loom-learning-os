import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'
import type { SituationChoice } from '../../sections/situation-choice'

// ─── Flowchart: AI Agent Architecture ────────────────────────────────────────

export const agentNodes: FlowchartNode[] = [
  {
    id: 'user',
    label: 'User',
    stereotype: 'Actor',
    icon: 'User',
    layer: 0,
    description: 'The human (or system) that sends goals, queries, or instructions to the agent.',
  },
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    stereotype: 'Controller',
    icon: 'Brain',
    layer: 1,
    description: 'Decomposes the user goal into sub-tasks and coordinates all other components.',
  },
  {
    id: 'planner',
    label: 'Planner',
    stereotype: 'Service',
    icon: 'ClipboardList',
    layer: 2,
    description: 'Produces a step-by-step plan (chain-of-thought or ReAct loop) to achieve the goal.',
  },
  {
    id: 'memory',
    label: 'Memory',
    stereotype: 'Store',
    icon: 'Database',
    layer: 2,
    description: 'Stores short-term context (conversation history) and long-term facts (vector DB).',
  },
  {
    id: 'tools',
    label: 'Tool Router',
    stereotype: 'Gateway',
    icon: 'Wrench',
    layer: 3,
    description: 'Selects and invokes the right tool (search, code executor, API, browser, etc.).',
  },
  {
    id: 'llm',
    label: 'LLM',
    stereotype: 'Model',
    icon: 'Sparkles',
    layer: 3,
    description: 'Large language model that performs reasoning, summarisation, and generation.',
  },
  {
    id: 'executor',
    label: 'Executor',
    stereotype: 'Runtime',
    icon: 'Settings2',
    layer: 4,
    description: 'Runs tool calls (shell commands, HTTP requests, code sandboxes) and returns results.',
  },
  {
    id: 'evaluator',
    label: 'Evaluator',
    stereotype: 'Guard',
    icon: 'ShieldCheck',
    layer: 4,
    description: 'Checks whether the current output meets the success criteria; triggers re-planning if not.',
  },
  {
    id: 'output',
    label: 'Response',
    stereotype: 'Output',
    icon: 'Send',
    layer: 5,
    description: 'Final answer or artefact delivered back to the user.',
  },
]

export const agentEdges: FlowchartEdge[] = [
  { from: 'user', to: 'orchestrator', description: 'Goal or query submitted by the user' },
  { from: 'orchestrator', to: 'planner', description: 'Request a task plan' },
  { from: 'orchestrator', to: 'memory', description: 'Retrieve relevant context' },
  { from: 'planner', to: 'llm', description: 'Prompt the LLM with the plan request' },
  { from: 'memory', to: 'llm', description: 'Inject retrieved facts into the prompt' },
  { from: 'llm', to: 'tools', description: 'LLM emits a tool-call directive' },
  { from: 'tools', to: 'executor', description: 'Dispatch selected tool with arguments' },
  { from: 'executor', to: 'evaluator', description: 'Return raw tool output for evaluation' },
  { from: 'evaluator', to: 'orchestrator', description: 'Goal not met — re-plan' },
  { from: 'evaluator', to: 'output', description: 'Goal met — emit final response' },
  { from: 'output', to: 'user', description: 'Deliver answer to the user' },
]

export const agentJourneys: Journey[] = [
  {
    id: 'happy-path',
    label: 'Happy Path',
    description: 'The agent completes the goal in a single pass: plan, execute tools, evaluate success, and return the response.',
    steps: [
      { nodeId: 'user', description: 'User submits a goal: "Research top 3 competitors and summarise."' },
      { nodeId: 'orchestrator', description: 'Orchestrator receives the goal and kicks off planning.' },
      { nodeId: 'memory', description: 'Memory retrieves any prior research stored from previous sessions.' },
      { nodeId: 'planner', description: 'Planner generates a step list: search, scrape, summarise.' },
      { nodeId: 'llm', description: 'LLM reasons over the plan and decides to call the web-search tool.' },
      { nodeId: 'tools', description: 'Tool Router selects the web-search tool and prepares arguments.' },
      { nodeId: 'executor', description: 'Executor fires the HTTP search request and collects results.' },
      { nodeId: 'evaluator', description: 'Evaluator confirms all 3 competitors found — goal met.' },
      { nodeId: 'output', description: 'A concise markdown summary is returned to the user.' },
    ],
  },
  {
    id: 'replan',
    label: 'Re-plan Loop',
    description: 'The agent attempts a fix, evaluates failure, re-plans with new context, and iterates until the goal is met.',
    steps: [
      { nodeId: 'user', description: 'User asks: "Fix the failing unit tests in my repo."' },
      { nodeId: 'orchestrator', description: 'Orchestrator decomposes into: read tests → identify failures → patch code → re-run.' },
      { nodeId: 'planner', description: 'Planner drafts an initial fix strategy.' },
      { nodeId: 'llm', description: 'LLM generates a code patch.' },
      { nodeId: 'tools', description: 'Tool Router picks the code-executor tool.' },
      { nodeId: 'executor', description: 'Executor applies the patch and runs tests — some still fail.' },
      { nodeId: 'evaluator', description: 'Evaluator detects remaining failures and signals re-plan.' },
      { nodeId: 'orchestrator', description: 'Orchestrator requests a revised plan with the new failure context.' },
      { nodeId: 'llm', description: 'LLM generates a second, more targeted patch.' },
      { nodeId: 'executor', description: 'Executor re-runs — all tests pass.' },
      { nodeId: 'evaluator', description: 'Evaluator confirms success.' },
      { nodeId: 'output', description: 'Agent reports the patched files and test results to the user.' },
    ],
  },
]

// ─── Text paragraphs ─────────────────────────────────────────────────────────

export const agentTextParagraphs: string[] = [
  'An **AI agent** is a software system that perceives its environment, reasons about a goal, and takes autonomous actions — potentially across multiple steps — to achieve that goal.',
  'Modern agents combine a large language model with a memory store, a tool registry, and a feedback loop. The LLM acts as the reasoning engine; tools extend what the agent can *do* in the real world.',
  'The key design decision is the **orchestration strategy**: single-agent vs multi-agent, synchronous ReAct loop vs async event-driven pipeline.',
]

export const agentLifecycleMarkdown: string[] = [
  `## Agent Lifecycle

1. **Goal Intake** — The user submits a natural-language goal. The orchestrator parses intent, identifies required capabilities, and selects relevant tools from the registry.
2. **Context Retrieval** — The memory module performs a semantic search over stored embeddings to surface prior facts, tool outputs, or conversation history relevant to the current goal.
3. **Planning** — The planner prompts the LLM with the goal plus retrieved context. The LLM returns an ordered action plan — either as structured JSON or a chain-of-thought trace.
4. **Tool Execution** — The tool router dispatches each planned action to the executor. Tools include web search, code sandboxes, browser control, file I/O, and external APIs.
5. **Evaluation & Loop** — The evaluator checks whether the execution result satisfies the success criteria. If not, it feeds failure context back to the orchestrator and triggers a new planning iteration.
6. **Response Delivery** — Once the evaluator confirms success, the final artefact (answer, code diff, report) is formatted and returned to the user. Results are optionally persisted to memory.`,
]

export const agentCapabilitiesMarkdown: string[] = [
  `## Key Agent Capabilities

- **Tool use** — call external APIs, run code, browse the web
  - Web search (Tavily, Brave, Google)
  - Code execution (sandboxed interpreter)
  - Browser automation (Playwright)
- **Long-horizon planning** via chain-of-thought or ReAct
- **Persistent memory** across sessions (vector store)
- **Self-evaluation** and automatic re-planning on failure
- **Multi-agent coordination** — delegating sub-tasks to specialised agents`,
]

// ─── Bullets: key agent capabilities ─────────────────────────────────────────

export interface BulletItem {
  text: string
  children?: BulletItem[]
}

export const agentCapabilityBullets: BulletItem[] = [
  {
    text: 'Tool use — call external APIs, run code, browse the web',
    children: [
      { text: 'Web search (Tavily, Brave, Google)' },
      { text: 'Code execution (sandboxed interpreter)' },
      { text: 'Browser automation (Playwright)' },
    ],
  },
  { text: 'Long-horizon planning via chain-of-thought or ReAct' },
  { text: 'Persistent memory across sessions (vector store)' },
  { text: 'Self-evaluation and automatic re-planning on failure' },
  { text: 'Multi-agent coordination (delegating sub-tasks)' },
]

// ─── Choice: orchestration strategy ──────────────────────────────────────────

export interface ChoiceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
}

export const orchestrationChoices: ChoiceOption[] = [
  {
    id: 'react',
    label: 'ReAct Loop',
    description: 'Synchronous Reason → Act → Observe cycle driven by a single LLM prompt per iteration.',
    pros: [
      'Simple to implement and debug',
      'Works well for focused, linear tasks',
      'Low infrastructure overhead',
    ],
    cons: [
      'Blocks on each tool call (sequential)',
      'Context window fills up on long tasks',
      'Hard to parallelise sub-tasks',
    ],
  },
  {
    id: 'multi-agent',
    label: 'Multi-Agent Pipeline',
    description: 'An orchestrator delegates sub-tasks to specialised sub-agents running concurrently.',
    pros: [
      'Parallel execution of independent sub-tasks',
      'Each agent has a focused, smaller context',
      'Easier to scale and specialise',
    ],
    cons: [
      'Higher coordination complexity',
      'Harder to debug cross-agent failures',
      'Requires robust inter-agent messaging',
    ],
  },
]

// ─── Drag-drop: match component to role ──────────────────────────────────────

export interface DragItem {
  id: string
  label: string
  correctZone: string
}

export interface DragZone {
  id: string
  label: string
}

export const agentDragItems: DragItem[] = [
  { id: 'vector-db', label: 'Vector DB', correctZone: 'memory' },
  { id: 'code-sandbox', label: 'Code Sandbox', correctZone: 'tool' },
  { id: 'cot-prompt', label: 'Chain-of-Thought Prompt', correctZone: 'reasoning' },
  { id: 'web-search', label: 'Web Search API', correctZone: 'tool' },
  { id: 'embeddings', label: 'Embedding Model', correctZone: 'memory' },
  { id: 'reward-model', label: 'Reward / Evaluator', correctZone: 'reasoning' },
]

export const agentDragZones: DragZone[] = [
  { id: 'memory', label: 'Memory Layer' },
  { id: 'tool', label: 'Tool Layer' },
  { id: 'reasoning', label: 'Reasoning Layer' },
]

// ─── Situation Choice: API communication pattern ──────────────────────────────

export const apiPatternSituations: SituationChoice[] = [
  {
    title: 'Real-time Communication',
    situation: 'You need to build a chat application where messages must appear instantly for all connected users.',
    recommended: 'websocket',
    recommendationDetail: {
      why: 'WebSocket provides full-duplex, persistent connections ideal for low-latency bidirectional messaging required in real-time chat.',
    },
    choices: [
      {
        id: 'rest',
        label: 'REST API',
        description: 'Use HTTP request-response pattern for each message.',
        pros: ['Simple to implement', 'Built-in caching'],
        cons: ['Higher latency', 'Requires polling for new messages'],
        whenToUse: 'Useful when message frequency is low and real-time delivery is not critical.',
      },
      {
        id: 'websocket',
        label: 'WebSocket',
        description: 'Use persistent full-duplex connection for instant message delivery.',
        pros: ['Real-time delivery', 'Low latency', 'Efficient for frequent messages'],
        cons: ['More complex server setup', 'Connection management overhead'],
      },
    ],
  },
]
