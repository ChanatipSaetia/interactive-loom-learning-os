import type { BulletItem } from "../../../sections/bullets";

export const agentTextParagraphs: string[] = [
  "An **AI agent** is a software system that perceives its environment, reasons about a goal, and takes autonomous actions — potentially across multiple steps — to achieve that goal.",
  "Modern agents combine a large language model with a memory store, a tool registry, and a feedback loop. The LLM acts as the reasoning engine; tools extend what the agent can *do* in the real world.",
  "The key design decision is the **orchestration strategy**: single-agent vs multi-agent, synchronous ReAct loop vs async event-driven pipeline.",
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
