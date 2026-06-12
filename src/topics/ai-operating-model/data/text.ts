import type { BulletItem } from '../../../sections/bullets'

export const introParagraphs: string[] = [
  'An **AI Operating Model** is a working specification for how AI agents enter a business. It defines the contracts between humans, agents, and software systems so work executes predictably.',
  'In a traditional operating model, people use software to execute work. In an AI operating model, **people, agents, and software systems execute work together** — and the operating model specifies exactly how work moves between them.',
  'Without this specification, you are not deploying agents into production — you are letting a system with judgment, uncertainty, and tool access operate inside the business without clear contracts.',
]

export const workflowMapParagraphs: string[] = [
  'The first deliverable is the **workflow itself**, not the agent. A documented description of what work the agent will perform, before any model is chosen or prompt is written.',
  'A useful workflow map identifies: the **trigger event**, the **input data** the work depends on, every **decision point** along the way, which **systems** the work writes to, and where **human approval gates** sit.',
  'The workflow map is also a *scope contract*. Anything outside the documented trigger, inputs, decision points, systems, and approvals is outside the agent\'s authority. If the agent encounters a case the map does not describe, the right behavior is to **escalate**, not to improvise.',
]

export const dataContextParagraphs: string[] = [
  'Agents do not infer business reality from scratch. They operate on what they can read at runtime. There are two failure modes: the agent reads a **stale field** and acts on it, or the agent reads correct data that **lacks the context** a human would have used to interpret it.',
  '> The operating model categorizes agent memory into four types: **Working** (current task context), **Episodic** (past interactions and outcomes), **Semantic** (facts and business rules), and **Procedural** (learned action sequences).',
]

export const runtimeControlsParagraphs: string[] = [
  'A deployed agent is a digital insider with write access. Runtime controls are the enforcement mechanisms that bound an agent\'s behavior when it encounters edge cases the design team did not anticipate.',
  'Four runtime controls: **API contracts** define what calls the agent can make at every tool call. **Permission scoping** separates read from write access, scoped per workflow. **Kill switches** stop an agent when drift or failure is detected. **Reasoning sandboxes** dry-run proposed tool calls against policy before execution.',
]

export const accountabilityParagraphs: string[] = [
  'Accountability Diffusion is the predictable outcome when ownership of AI agent outcomes is left undefined. Autonomous failures get distributed across the model provider, the platform vendor, the integration team, and the business unit — until no one carries the result.',
  'The operating model prevents this through **four named roles**: Business Owner (workflow purpose and risk), Technical Owner (architecture and deployment), Data Owner (source-of-truth governance), and Model Oversight (drift and behavioral change).',
  'Business Owner and Technical Owner are **dual-key** — neither can act alone. Data Owner and Model Oversight are specialist functions that report to the dual-key owners.',
]

// Autonomy tier bullets
export const autonomyTierBullets: BulletItem[] = [
  {
    text: 'Shadow — Agent suggests, human acts',
    children: [
      { text: 'Agent produces recommendations; human makes final decision' },
      { text: 'Used for calibration and building confidence in the system' },
      { text: 'Appropriate for financial transactions, legal commitments' },
    ],
  },
  {
    text: 'Supervised — Agent drafts, human approves',
    children: [
      { text: 'Agent produces a complete draft; human reviews before execution' },
      { text: 'First step toward autonomy with safety net intact' },
      { text: 'Suitable for regulated workflows requiring audit trail' },
    ],
  },
  {
    text: 'Guided — Agent acts, human monitors exceptions',
    children: [
      { text: 'Agent executes autonomously; human intervenes when flagged' },
      { text: 'Default for mature, low-blast-radius workflows' },
      { text: 'Common in customer support routing and lead qualification' },
    ],
  },
  {
    text: 'Autonomous — Agent acts and self-corrects within bounds',
    children: [
      { text: 'Agent executes and corrects errors within defined boundaries' },
      { text: 'Human reviews aggregated outcomes, not individual decisions' },
      { text: 'Requires runtime controls and accountability to be in place' },
    ],
  },
]

// Memory type bullets
export const memoryTypeBullets: BulletItem[] = [
  {
    text: 'Working Memory — Current task context',
    children: [{ text: 'Holds intermediate reasoning, tool outputs, and session state' }, { text: 'Enables multi-step reasoning within a single session' }],
  },
  {
    text: 'Episodic Memory — Past interactions',
    children: [{ text: 'Stores decisions made, outcomes observed, and prior runs' }, { text: 'Enables continuity across sessions and learning from history' }],
  },
  {
    text: 'Semantic Memory — Facts and rules',
    children: [{ text: 'Contains business rules, definitions, and organizational facts' }, { text: 'Grounds decisions in shared knowledge' }],
  },
  {
    text: 'Procedural Memory — Learned sequences',
    children: [{ text: 'Captures action sequences that have proven effective' }, { text: 'Enables improvement on repeated tasks without re-derivation' }],
  },
]

// Runtime control bullets
export const runtimeControlBullets: BulletItem[] = [
  {
    text: 'API Contracts — Define permissible calls',
    children: [{ text: 'Restricts which APIs the agent can invoke at every tool call' }, { text: 'Fires at every tool invocation' }],
  },
  {
    text: 'Permission Scoping — Read vs. write separation',
    children: [{ text: 'Scopes access per workflow; read access does not imply write' }, { text: 'Fires at authorization, before any action' }],
  },
  {
    text: 'Kill Switches — Emergency stop mechanisms',
    children: [{ text: 'Halts agent or workflow when drift or failure is detected' }, { text: 'Fires on runtime alarm or anomaly threshold' }],
  },
  {
    text: 'Reasoning Sandboxes — Pre-execution validation',
    children: [{ text: 'Dry-runs proposed tool calls against policy before execution' }, { text: 'Fires before any high-stakes write operation' }],
  },
]

// Accountability role bullets
export const accountabilityBullets: BulletItem[] = [
  {
    text: 'Business Owner — Workflow purpose and risk appetite',
    children: [{ text: 'Answers for business outcomes: revenue, customer impact, regulatory exposure' }, { text: 'Dual-key: cannot act without Technical Owner' }],
  },
  {
    text: 'Technical Owner — Architecture, deployment, uptime',
    children: [{ text: 'Answers for system failures: root cause, remediation, prevention' }, { text: 'Dual-key: cannot act without Business Owner' }],
  },
  {
    text: 'Data Owner — Source-of-truth governance',
    children: [{ text: 'Answers for upstream data issues causing downstream agent failures' }, { text: 'Specialist function reporting to dual-key owners' }],
  },
  {
    text: 'Model Oversight — Drift, bias, behavioral change',
    children: [{ text: 'Answers for behavioral changes that escaped monitoring' }, { text: 'Specialist function reporting to dual-key owners' }],
  },
]

// Readiness filter checklist
export const readinessChecklist: BulletItem[] = [
  { text: 'Can we describe the workflow so a new hire could execute it without asking how we usually do things?', checkable: true },
  { text: 'Do we know which data sources are authoritative and which are off-limits?', checkable: true },
  { text: 'Do we know what the agent is allowed to do, prohibited from doing, and at what autonomy tier?', checkable: true },
  { text: 'Do we know how the agent gets stopped and who can pull the kill switch?', checkable: true },
  { text: 'Do we know the baseline cycle time, cost, and quality to measure improvement?', checkable: true },
  { text: 'Can we name the four people responsible for business outcomes, technical health, data quality, and behavioral oversight?', checkable: true },
]
