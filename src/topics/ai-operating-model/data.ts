import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'

// ─── Flowchart: AI Operating Model Stack ─────────────────────────────────────

export const operatingModelSchema: UnifiedFlowchartSchema = {
  entities: {
    trigger: {
      title: 'Trigger Event',
      desc: 'A business event, user request, or scheduled job that kicks off the agent workflow.',
      viewTypes: {
        SYS_ARCH: TYPES.EVENT,
      },
    },
    'workflow-map': {
      title: 'Workflow Map',
      desc: 'Checks whether the trigger falls within the documented scope: trigger, inputs, decision points, and output systems.',
      viewTypes: {
        SYS_ARCH: TYPES.PROCESS,
      },
    },
    'data-layer': {
      title: 'Data & Context',
      desc: 'Retrieves working context, episodic history, semantic facts, and procedural patterns from the four memory types.',
      viewTypes: {
        SYS_ARCH: TYPES.DATABASE,
      },
    },
    'scope-check': {
      title: 'Scope & Authority',
      desc: 'Determines the autonomy tier: Shadow, Supervised, Guided, or Autonomous — and what the agent is allowed to do.',
      viewTypes: {
        SYS_ARCH: TYPES.DECISION,
      },
    },
    'runtime-controls': {
      title: 'Runtime Controls',
      desc: 'Pre-dispatch policy enforcement: every tool call is evaluated as ALLOW, DENY, REQUIRE_APPROVAL, or ALLOW_WITH_CONSTRAINTS.',
      viewTypes: {
        SYS_ARCH: TYPES.POLICY,
      },
    },
    'human-approval': {
      title: 'Human Approval',
      desc: 'Synchronous review gate for Supervised tier or REQUIRE_APPROVAL policy decisions. Session pauses until a named approver acts.',
      viewTypes: {
        SYS_ARCH: TYPES.USER,
      },
    },
    'agent-execution': {
      title: 'Agent Execution',
      desc: 'The agent executes the approved action — calling tools, writing to systems, or generating output.',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
      },
    },
    'output-safety': {
      title: 'Output Safety',
      desc: 'Post-execution pipeline: ALLOW, REDACT (remove PII/secrets), or QUARANTINE the output before delivery.',
      viewTypes: {
        SYS_ARCH: TYPES.POLICY,
      },
    },
    'audit-trail': {
      title: 'Audit Trail',
      desc: 'Immutable write-once log of every action, policy decision, approver, and outcome — the post-incident narrative.',
      viewTypes: {
        SYS_ARCH: TYPES.DATABASE,
      },
    },
    measurement: {
      title: 'Measurement',
      desc: 'Cycle time, containment rate, handoff rate, override rate, and drift detection lag — the operational scorecard.',
      viewTypes: {
        SYS_ARCH: TYPES.READ_MODEL,
      },
    },
    output: {
      title: 'Output / Action',
      desc: 'The final result delivered to the user or written to business systems. Marked in the audit trail with approver and policy snapshot.',
      viewTypes: {
        SYS_ARCH: TYPES.DATA_OBJECT,
      },
    },
  },
  relations: [
    { id: 'ro_e1', from: 'trigger', to: 'workflow-map', views: ['SYS_ARCH'] },
    { id: 'ro_e2', from: 'workflow-map', to: 'data-layer', views: ['SYS_ARCH'] },
    { id: 'ro_e3', from: 'data-layer', to: 'scope-check', views: ['SYS_ARCH'] },
    { id: 'ro_e4', from: 'scope-check', to: 'runtime-controls', views: ['SYS_ARCH'] },
    { id: 'ro_e5', from: 'runtime-controls', to: 'human-approval', views: ['SYS_ARCH'] },
    { id: 'ro_e6', from: 'runtime-controls', to: 'agent-execution', views: ['SYS_ARCH'] },
    { id: 'ro_e7', from: 'human-approval', to: 'agent-execution', views: ['SYS_ARCH'] },
    { id: 'ro_e8', from: 'agent-execution', to: 'output-safety', views: ['SYS_ARCH'] },
    { id: 'ro_e9', from: 'output-safety', to: 'audit-trail', views: ['SYS_ARCH'] },
    { id: 'ro_e10', from: 'audit-trail', to: 'measurement', views: ['SYS_ARCH'] },
    { id: 'ro_e11', from: 'measurement', to: 'output', views: ['SYS_ARCH'] },
  ],
  views: {
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'trigger', x: 80, y: 250 },
        { id: 'workflow-map', x: 220, y: 250 },
        { id: 'data-layer', x: 360, y: 250 },
        { id: 'scope-check', x: 500, y: 250 },
        { id: 'runtime-controls', x: 640, y: 250 },
        { id: 'human-approval', x: 780, y: 150 },
        { id: 'agent-execution', x: 920, y: 350 },
        { id: 'output-safety', x: 1060, y: 250 },
        { id: 'audit-trail', x: 1200, y: 250 },
        { id: 'measurement', x: 1340, y: 250 },
        { id: 'output', x: 1480, y: 250 },
      ],
      groups: [],
    },
  },
  journeys: [
    {
      id: 'supervised-journey',
      label: 'Supervised Tier — Financial Transaction',
      description: 'A $4,500 refund request: agent drafts the action, runtime policy routes it to a human approver, then executes after sign-off.',
      steps: [
        { nodeId: 'trigger', description: 'Customer submits a refund request for $4,500.' },
        { nodeId: 'workflow-map', description: 'Event matches the "Refund Processing" workflow map — within scope.' },
        { nodeId: 'data-layer', description: 'Agent retrieves customer order history, policy rules, and prior refund decisions.' },
        { nodeId: 'scope-check', description: 'Amount exceeds the $2,000 Guided threshold — Supervised tier applies.' },
        { nodeId: 'runtime-controls', description: 'Policy Decision Point: financial action over threshold → REQUIRE_APPROVAL.' },
        { nodeId: 'human-approval', description: 'Support manager reviews the refund draft, confirms eligibility, approves.' },
        { nodeId: 'agent-execution', description: 'Agent executes the refund with the approver\'s identity on record.' },
        { nodeId: 'output-safety', description: 'Output checked — no PII leakage, payment amount within expected bounds.' },
        { nodeId: 'audit-trail', description: 'Action, approver name, policy snapshot, and timestamp written immutably.' },
        { nodeId: 'measurement', description: 'Cycle time and override rate updated. Containment rate unchanged.' },
        { nodeId: 'output', description: 'Refund confirmation delivered to the customer.' },
      ],
    },
    {
      id: 'guided-journey',
      label: 'Guided Tier — Support Ticket Routing',
      description: 'A support ticket routed autonomously by the agent. Human monitors exceptions but is not on the critical path.',
      steps: [
        { nodeId: 'trigger', description: 'New support ticket arrives: "Billing discrepancy on invoice #8841".' },
        { nodeId: 'workflow-map', description: 'Event matches "Ticket Routing" workflow — in scope.' },
        { nodeId: 'data-layer', description: 'Agent retrieves ticket history, product context, and routing rules.' },
        { nodeId: 'scope-check', description: 'Classification task, recoverable errors — Guided tier confirmed.' },
        { nodeId: 'runtime-controls', description: 'Policy Decision Point: read + classify action → ALLOW.' },
        { nodeId: 'agent-execution', description: 'Agent classifies ticket as "Billing" and routes to billing queue.' },
        { nodeId: 'output-safety', description: 'Output scanned — no sensitive data in the routing decision.' },
        { nodeId: 'audit-trail', description: 'Routing decision and confidence score logged.' },
        { nodeId: 'measurement', description: 'Containment rate incremented. Human monitoring dashboard updated.' },
        { nodeId: 'output', description: 'Ticket assigned to billing team. Human monitor notified of no exceptions.' },
      ],
    },
    {
      id: 'shadow-journey',
      label: 'Shadow Tier — New Deployment Calibration',
      description: 'First week of deployment in a regulated workflow. Agent generates suggestions; a human makes every decision while divergences are logged.',
      steps: [
        { nodeId: 'trigger', description: 'Loan application submitted for underwriting review.' },
        { nodeId: 'workflow-map', description: 'Event matches "Underwriting" workflow — in scope.' },
        { nodeId: 'data-layer', description: 'Agent reads applicant data, credit history, and underwriting policy.' },
        { nodeId: 'scope-check', description: 'New deployment in regulated domain — Shadow tier enforced.' },
        { nodeId: 'runtime-controls', description: 'Policy Decision Point: shadow mode → DENY all writes, ALLOW read + suggest.' },
        { nodeId: 'human-approval', description: 'Underwriter receives the agent\'s recommendation alongside the full file. Human makes the final decision.' },
        { nodeId: 'agent-execution', description: 'Agent records its suggestion and the human\'s decision for divergence analysis.' },
        { nodeId: 'output-safety', description: 'Suggestion output checked — no PII in the recommendation text.' },
        { nodeId: 'audit-trail', description: 'Agent suggestion, human decision, and divergence flag logged for calibration.' },
        { nodeId: 'measurement', description: 'Override rate and divergence rate updated — key signals for tier promotion readiness.' },
        { nodeId: 'output', description: 'Human underwriter\'s decision submitted. Agent calibration data accumulated.' },
      ],
    },
  ],
}

// ─── Text: Introduction ───────────────────────────────────────────────────────

export const introTextParagraphs: string[] = [
  'An **AI Operating Model** is a working specification for how AI agents enter a business. It defines six design decisions that must be made before deploying agents into production: what work the agent performs, what data it reads, what scope and authority it has, how it\'s controlled at runtime, how its performance is measured, and who is accountable when things go wrong.',
  'Most production workflows survive only because experienced people fill in undocumented judgment gaps. When an agent replaces a human in that workflow, it doesn\'t resolve the ambiguity — it executes it faster. The operating model captures those hidden rules so the system can run without them.',
  '**Sources:** Codebridge (2026), Cordum (2026), Galileo AI (2026), Decagon (2026), SuperAnnotate (2025), Maxim AI (2026)',
]

// ─── Bullets: Six Design Decisions ───────────────────────────────────────────

export interface BulletItem {
  text: string
  children?: BulletItem[]
}

export const sixDecisionsBullets: BulletItem[] = [
  {
    text: '**Workflow Map** — Define the work before choosing the agent',
    children: [
      { text: 'Trigger event, input data, decision points, output systems, human approval gates' },
      { text: 'The workflow map is the scope contract — anything outside it is outside authority' },
    ],
  },
  {
    text: '**Data and Context Layer** — What the agent can read at runtime',
    children: [
      { text: 'Four memory types: Working, Episodic, Semantic, Procedural' },
      { text: 'Graph-based memory for multi-hop entity relationships (customer → contract → payment)' },
    ],
  },
  {
    text: '**Scope and Authority** — How independently the agent can act',
    children: [
      { text: 'Four tiers: Shadow, Supervised, Guided, Autonomous' },
      { text: 'Tier is per-workflow, not per-agent — the same agent may operate at different tiers' },
    ],
  },
  {
    text: '**Runtime Controls** — How the agent is stopped when it drifts',
    children: [
      { text: 'API contracts, permission scoping, kill switches, reasoning sandboxes' },
      { text: 'Pre-dispatch policy enforcement: evaluate risk before any side effect executes' },
    ],
  },
  {
    text: '**Measurement Model** — Track workflow improvement, not AI usage',
    children: [
      { text: 'Cycle time, containment rate, handoff rate, override rate, drift detection lag' },
      { text: 'Adoption metrics tell you AI is being touched, not that it produces better work' },
    ],
  },
  {
    text: '**Accountability Model** — Four named roles to prevent accountability diffusion',
    children: [
      { text: 'Business Owner: business outcomes and risk appetite' },
      { text: 'Technical Owner: architecture, integrations, uptime' },
      { text: 'Data Owner: source-of-truth governance for data sources' },
      { text: 'Model Oversight: drift, bias, behavioral change over time' },
    ],
  },
]

// ─── Tradeoff Sandbox: Operating Model Scenarios ──────────────────────────────

export const operatingModelScenarios: TradeoffScenario[] = [
  {
    id: 'autonomy-tier',
    title: 'Autonomy Tier Decision',
    description: 'Determine the appropriate tier of autonomy for agents, balancing throughput and risk.',
    metrics: [
      { id: 'agility', label: 'Business Agility', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Skill Gap/Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'velocity', label: 'Delivery Velocity', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'Resource Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'early-stage',
        title: 'Early-Stage Deployment in a High-Stakes Domain',
        description: 'Your team is deploying an AI agent into a regulated financial workflow for the first time. The team lacks production data on how the model behaves at scale, and errors carry regulatory penalties.',
        recommended: 'shadow',
        choices: [
          {
            id: 'shadow',
            label: 'Shadow Tier',
            description: 'Agent suggests; human acts. The agent runs in parallel and generates recommendations that a human executes.',
            metrics: { agility: -10, complexity: -10, velocity: -20, cost: -15 },
            pros: [
              { title: 'Zero blast radius', description: 'Agent output never reaches production systems directly' },
              { title: 'Calibration data', description: 'Every divergence between AI suggestion and human decision is a training signal' },
              { title: 'Regulatory safe', description: 'Full human accountability on every decision' },
            ],
            cons: [
              { title: 'No throughput gain', description: 'Human still executes every action — no efficiency improvement yet' },
              { title: 'Observer effect', description: 'Agents may not encounter all real-world edge cases in shadow mode' },
            ],
            whyThisFits: 'Shadow tier lets you calibrate the agent against real decisions without letting it act. You observe divergence between agent suggestions and human decisions — the only way to know if the agent is ready for more authority.',
          },
          {
            id: 'supervised',
            label: 'Supervised Tier',
            description: 'Agent drafts and acts on a prepared output; human approves before execution completes.',
            metrics: { agility: 5, complexity: 10, velocity: 5, cost: 5 },
            pros: [
              { title: 'Real throughput gain', description: 'Human effort shifts from doing to reviewing' },
              { title: 'Approval gate on record', description: 'Human sign-off is captured for audit' },
            ],
            cons: [
              { title: 'Review bottleneck', description: 'High volume creates a review backlog if approval workflow is poorly designed' },
              { title: 'Rubber-stamping risk', description: 'Reviewers under time pressure may approve without checking' },
            ],
          },
          {
            id: 'autonomous',
            label: 'Autonomous Tier',
            description: 'Agent acts and self-corrects within defined bounds. Human reviews aggregated outcomes.',
            metrics: { agility: 20, complexity: 25, velocity: 25, cost: 20 },
            pros: [
              { title: 'Maximum throughput', description: 'No human on the critical path of each decision' },
            ],
            cons: [
              { title: 'High blast radius', description: 'Errors propagate at machine speed before detection' },
              { title: 'Regulatory exposure', description: 'Not appropriate in regulated high-stakes domains without mature runtime controls' },
            ],
          },
        ],
      },
      {
        id: 'customer-support',
        title: 'Customer Support Routing at Medium Volume',
        description: 'You\'re deploying an AI agent to handle customer support ticket routing. The consequences of misrouting are recoverable (a ticket is re-assigned), but you want humans monitoring for exceptions.',
        recommended: 'guided',
        choices: [
          {
            id: 'shadow',
            label: 'Shadow Tier',
            description: 'Agent suggests routing; human manually routes every ticket.',
            metrics: { agility: -10, complexity: -10, velocity: -20, cost: -10 },
            pros: [{ title: 'Full human control', description: 'No risk of misrouting' }],
            cons: [
              { title: 'No efficiency gain', description: 'Humans still process every ticket — the agent adds no throughput value' },
            ],
            whenToUse: 'Only during initial calibration period.',
          },
          {
            id: 'guided',
            label: 'Guided Tier',
            description: 'Agent routes tickets autonomously. Human monitors a live dashboard and intervenes when the agent flags uncertainty or when exception patterns appear.',
            metrics: { agility: 15, complexity: 10, velocity: 15, cost: 10 },
            pros: [
              { title: 'Full throughput', description: 'Agent handles volume at machine speed' },
              { title: 'Human retains control', description: 'Exceptions surface immediately for review' },
              { title: 'Feedback loop', description: 'Interventions improve the agent over time' },
            ],
            cons: [
              { title: 'Monitoring discipline required', description: 'The model only works if the human actually monitors — not if they watch passively' },
            ],
            whyThisFits: 'Guided tier is the correct choice when errors are recoverable and you want throughput without a human on every decision. Agents act; humans monitor exceptions. If the agent flags a ticket as uncertain, it escalates.',
          },
          {
            id: 'autonomous',
            label: 'Autonomous Tier',
            description: 'Agent routes tickets with no real-time human monitoring. Outcomes reviewed in aggregate.',
            metrics: { agility: 20, complexity: 20, velocity: 25, cost: 15 },
            pros: [
              { title: 'Least overhead', description: 'No monitoring staffing required' },
            ],
            cons: [
              { title: 'Errors batch up', description: 'Systematic misrouting may go undetected until outcome review cycle' },
            ],
          },
        ],
      },
      {
        id: 'mature-workflow',
        title: 'Mature Workflow with Low Error Cost',
        description: 'Your AI agent has been in Guided tier for six months. Override rate has fallen below 3%. Errors are low-stakes and self-correcting. The team wants to reduce monitoring overhead.',
        recommended: 'autonomous',
        choices: [
          {
            id: 'guided',
            label: 'Guided Tier',
            description: 'Continue with human monitoring and exception intervention.',
            metrics: { agility: 5, complexity: 10, velocity: 5, cost: 10 },
            pros: [{ title: 'Continued oversight', description: 'Humans stay informed on agent behavior' }],
            cons: [
              { title: 'Unnecessary overhead', description: 'Monitoring cost with declining incremental value after agent is well-calibrated' },
            ],
            whenToUse: 'Appropriate when drift risk is still elevated or a new model version has just been deployed.',
          },
          {
            id: 'autonomous',
            label: 'Autonomous Tier',
            description: 'Agent acts and self-corrects within defined bounds. Human reviews aggregated outcomes on a regular cadence.',
            metrics: { agility: 25, complexity: 15, velocity: 25, cost: -5 },
            pros: [
              { title: 'Monitoring overhead eliminated', description: 'Human attention shifts to outcome review rather than real-time watching' },
              { title: 'Scales with volume', description: 'No throughput ceiling imposed by human monitoring bandwidth' },
              { title: 'Lower operational cost', description: 'Fewer FTEs required for oversight at steady state' },
            ],
            cons: [
              { title: 'Drift lag increases', description: 'Problems surface at the next review cycle, not in real-time' },
              { title: 'Requires runtime controls', description: 'Kill switches and anomaly thresholds must be in place before removing human monitoring' },
            ],
            whyThisFits: 'Autonomous tier is appropriate when runtime controls are mature, the agent has demonstrated calibrated performance, and errors are within an acceptable blast radius. Override rate below 5% and falling drift detection lag are the evidence gates.',
          },
        ],
      },
    ],
  },
  {
    id: 'hitl-oversight',
    title: 'Human-in-the-Loop Oversight Pattern',
    description: 'Establish the right human-in-the-loop validation patterns based on transaction stakes and volume.',
    metrics: [
      { id: 'agility', label: 'Business Agility', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Skill Gap/Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'velocity', label: 'Delivery Velocity', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'Resource Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'irreversible-fin',
        title: 'Irreversible Financial Transaction',
        description: 'An AI agent is processing a refund recommendation for $4,500. Once the refund is issued, it cannot be automatically reversed. Regulatory audit requires a named human approver on record.',
        recommended: 'sync-approval',
        choices: [
          {
            id: 'sync-approval',
            label: 'Synchronous Approval',
            description: 'Orchestrator pauses before execution. Human reviews the proposed action and approves or rejects. Session resumes with the decision on the audit trail.',
            metrics: { agility: 10, complexity: 15, velocity: -10, cost: 15 },
            pros: [
              { title: 'Irreversibility safe', description: 'Human approves before any side effect occurs' },
              { title: 'Audit trail complete', description: 'Named approver, timestamp, and context captured at decision time' },
              { title: 'EU AI Act compliant', description: 'Satisfies Article 14 human oversight mandate for high-risk AI systems' },
            ],
            cons: [
              { title: 'Per-decision latency', description: 'Each high-stakes action adds human review time to the critical path' },
              { title: 'Review bottleneck', description: 'At high volume, approval queues must be staffed to avoid throughput collapse' },
            ],
            whyThisFits: 'Synchronous approval is the only correct pattern for irreversible actions. The orchestrator pauses, serializes state, returns an invocation ID, the human reviews via a UI, and the session resumes with the approval status on record. Asynchronous audit is incompatible with irreversibility.',
          },
          {
            id: 'async-audit',
            label: 'Asynchronous Audit',
            description: 'Agent executes immediately. Decisions are logged with full context. Humans review in periodic queues and apply corrective actions retroactively.',
            metrics: { agility: 20, complexity: 10, velocity: 20, cost: 5 },
            pros: [
              { title: 'Near-zero latency', description: 'No human on the critical path' },
              { title: 'High throughput', description: 'Scales with agent volume' },
            ],
            cons: [
              { title: 'Cannot undo', description: 'Corrections are retroactive — unusable for irreversible actions' },
              { title: 'Delayed error detection', description: 'Problems surface at review cycle, not at execution time' },
            ],
            whenToUse: 'Content classification, recommendation systems, reversible internal processes with low blast radius.',
          },
          {
            id: 'fully-autonomous',
            label: 'Fully Autonomous',
            description: 'Agent executes without human review. Outcomes monitored at the aggregate level.',
            metrics: { agility: 25, complexity: 5, velocity: 30, cost: -5 },
            pros: [
              { title: 'Maximum throughput', description: 'No human latency on any decision' },
            ],
            cons: [
              { title: 'Regulatory non-compliant', description: 'Fails EU AI Act Article 14 for high-risk financial decisions' },
              { title: 'No approver of record', description: 'Audit cannot identify who authorized the action' },
            ],
          },
        ],
      },
      {
        id: 'content-class',
        title: 'Content Classification at Scale',
        description: 'Your AI agent classifies 50,000 support messages per day as "billing", "technical", or "feedback". Misclassification results in a ticket going to the wrong queue — recoverable with a re-assign. Reviewing all classifications manually is not feasible.',
        recommended: 'async-audit',
        choices: [
          {
            id: 'sync-approval',
            label: 'Synchronous Approval',
            description: 'Every classification pauses for human approval.',
            metrics: { agility: -10, complexity: 20, velocity: -25, cost: 30 },
            pros: [{ title: 'Maximum oversight', description: 'Human reviews every decision' }],
            cons: [
              { title: 'Not feasible at volume', description: '50,000 approvals per day requires 6+ FTE reviewers working full-time on approvals alone' },
              { title: 'Throughput collapse', description: 'Approval queue depth causes SLA breaches' },
            ],
          },
          {
            id: 'async-audit',
            label: 'Asynchronous Audit',
            description: 'Agent classifies immediately. A strategic sample (e.g., 2–5% or confidence-stratified) is queued for periodic human review. Corrections feed back into the model.',
            metrics: { agility: 15, complexity: 10, velocity: 15, cost: 10 },
            pros: [
              { title: 'Scales to any volume', description: 'No human on the critical path of each classification' },
              { title: 'Continuous improvement', description: 'Human corrections become training signals that improve the agent over time' },
              { title: 'Risk-proportionate review', description: 'Low-confidence classifications are sampled at higher rates' },
            ],
            cons: [
              { title: 'Delayed error detection', description: 'Systematic errors may run for days before the review cycle catches them' },
              { title: 'Requires sampling discipline', description: 'Random sampling misses low-frequency but high-impact failure modes' },
            ],
            whyThisFits: 'Asynchronous audit is correct for high-volume, reversible, low-stakes actions. The agent executes immediately; a sample is reviewed periodically. Corrections retroactively improve routing quality. Synchronous approval would create an approval bottleneck that no team can staff for 50,000 daily actions.',
          },
          {
            id: 'fully-autonomous',
            label: 'Fully Autonomous',
            description: 'Agent classifies without any human review loop. Outcome quality measured in aggregate.',
            metrics: { agility: 20, complexity: 5, velocity: 25, cost: -5 },
            pros: [
              { title: 'Zero overhead', description: 'No review staffing required' },
            ],
            cons: [
              { title: 'No feedback loop', description: 'Agent cannot improve from production errors without human corrections' },
              { title: 'Drift undetected', description: 'Model degradation not caught until customer-facing symptoms appear' },
            ],
            whenToUse: 'Only appropriate when the classification domain is stable, error cost is trivially low, and no regulatory requirement exists for oversight.',
          },
        ],
      },
      {
        id: 'multi-tier-plan',
        title: 'Multi-Agent Planning for a Cross-Department Initiative',
        description: 'A planning agent generates a high-level project plan spanning engineering, legal, and finance — involving significant budget commitments. Lower-level agents then execute approved plan steps.',
        recommended: 'multi-tier',
        choices: [
          {
            id: 'sync-approval',
            label: 'Synchronous Approval on Every Step',
            description: 'Every sub-task requires human approval before proceeding.',
            metrics: { agility: -5, complexity: 15, velocity: -15, cost: 20 },
            pros: [
              { title: 'Maximum control', description: 'Human reviews every action' },
            ],
            cons: [
              { title: 'Approval fatigue', description: 'Reviewers approve hundreds of micro-decisions — quality degrades quickly' },
              { title: 'Kills efficiency', description: 'Multi-agent delegation delivers no throughput gain if every step is synchronously gated' },
            ],
          },
          {
            id: 'multi-tier',
            label: 'Multi-Tier Planning Oversight',
            description: 'LLM generates a high-level plan; human operator reviews feasibility and approves. Lower-level agents execute approved plan steps with bounded autonomy and escalation triggers for out-of-bounds scenarios.',
            metrics: { agility: 20, complexity: 15, velocity: 15, cost: 10 },
            pros: [
              { title: 'Strategic control', description: 'Human validates the plan before committing resources' },
              { title: 'Tactical efficiency', description: 'Autonomous execution of approved steps at machine speed' },
              { title: 'Proportionate oversight', description: 'Human effort focused on high-value decision points, not micro-tasks' },
            ],
            cons: [
              { title: 'Plan quality is critical', description: 'A flawed high-level plan propagates errors through all subsequent sub-tasks' },
              { title: 'Escalation triggers must be defined', description: 'Lower-level agents need explicit bounds to know when to stop and ask' },
            ],
            whyThisFits: 'Multi-tier planning oversight separates strategic planning (human-reviewed) from tactical execution (bounded autonomy). Human operators validate feasibility at the plan level; lower-level agents execute with bounded autonomy and escalation triggers for out-of-bounds scenarios.',
          },
          {
            id: 'async-audit',
            label: 'Asynchronous Audit',
            description: 'Entire plan executes autonomously. Human reviews outcomes.',
            metrics: { agility: 25, complexity: 5, velocity: 25, cost: -5 },
            pros: [
              { title: 'Maximum throughput', description: 'No human on any critical path' },
            ],
            cons: [
              { title: 'Budget commitments may be made before review', description: 'Cross-department budget allocations cannot be retroactively uncancelled' },
              { title: 'Accountability gap', description: 'No named human approved the plan before significant commitments were made' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'governance-architecture',
    title: 'Governance Architecture',
    description: 'Architect policy enforcement to be tamper-proof and scalable across teams.',
    metrics: [
      { id: 'agility', label: 'Business Agility', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Skill Gap/Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'velocity', label: 'Delivery Velocity', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'Resource Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'regulated-env',
        title: 'Regulated Production Environment (Financial Services / Healthcare)',
        description: 'Your organization operates in a regulated sector. External auditors require evidence that policy enforcement cannot be bypassed by the agent itself — even if the agent is compromised or adversarially prompted.',
        recommended: 'out-of-process',
        choices: [
          {
            id: 'in-process',
            label: 'In-Process Governance',
            description: 'Policy engine embedded inside the agent\'s trust boundary. Examples: Microsoft AGT, Galileo, NeMo Guardrails.',
            metrics: { agility: 15, complexity: -10, velocity: 15, cost: -5 },
            pros: [
              { title: 'Simpler integration', description: 'Policy logic co-located with agent code — easier to develop and test' },
              { title: 'Lower latency', description: 'No network round-trip to external policy service' },
              { title: 'Good for development', description: 'Appropriate for non-regulated, fast-iteration environments' },
            ],
            cons: [
              { title: 'Trust boundary shared', description: 'A compromised agent can potentially modify or bypass its own guardrails' },
              { title: 'Audit gap', description: 'Harder to prove policy enforcement was independent when the enforcer and the agent share a process' },
            ],
            whenToUse: 'Development environments, non-regulated production, rapid prototyping.',
          },
          {
            id: 'out-of-process',
            label: 'Out-of-Process Governance (Safety Kernel)',
            description: 'Policy engine runs as a separate service outside the agent\'s trust boundary. Examples: Cordum Safety Kernel, Microsoft Authorization Fabric, CyberArk Secure AI Agents.',
            metrics: { agility: 25, complexity: 20, velocity: 10, cost: 20 },
            pros: [
              { title: 'Trust boundary separation', description: 'Agent cannot circumvent policy enforcement — even if compromised' },
              { title: 'Audit-defensible', description: 'Policy enforcement is independently verifiable; satisfies regulated sector audit expectations' },
              { title: 'Fleet-wide governance', description: 'One policy change propagates across every agent without redeployment' },
              { title: 'Ownership separation', description: 'Compliance team owns policies; developers own agent code — no entanglement' },
            ],
            cons: [
              { title: 'Network latency per call', description: 'Every policy check requires a round-trip to the policy service' },
              { title: 'Operational complexity', description: 'Policy service is a new component to deploy, monitor, and maintain' },
            ],
            whyThisFits: 'Out-of-process governance (Safety Kernel) runs the policy engine outside the agent\'s trust boundary. A compromised agent cannot modify its own guardrails. Audit expectations in financial services and healthcare increasingly require this architecture.',
          },
        ],
      },
      {
        id: 'fleet-scaling',
        title: 'Scaling to a Fleet of Agents Across Multiple Teams',
        description: 'Your organization now runs 15 different AI agents owned by 5 different teams. Each team has been maintaining its own guardrails in code. When compliance updates a policy (e.g., new PII detection rules), each team must independently redeploy.',
        recommended: 'centralized-policy',
        choices: [
          {
            id: 'hardcoded',
            label: 'Hardcoded Guardrails per Agent',
            description: 'Each team embeds policy logic directly in their agent\'s code. Policy updates require code changes and redeployment.',
            metrics: { agility: -10, complexity: 5, velocity: -15, cost: 10 },
            pros: [
              { title: 'Full team autonomy', description: 'Each team controls its own guardrails' },
              { title: 'No shared dependency', description: 'No policy service to go down' },
            ],
            cons: [
              { title: 'Inconsistent policies', description: '15 agents may enforce the same rule 15 different ways' },
              { title: 'Slow propagation', description: 'A compliance update requires 15 separate PRs, reviews, and deploys' },
              { title: 'Brittle at scale', description: 'Policy drift accumulates as teams evolve independently' },
            ],
            whenToUse: 'Single-agent deployments or very early stage where consistency is not yet a constraint.',
          },
          {
            id: 'centralized-policy',
            label: 'Centralized Policy Management',
            description: 'A policy server holds all guardrails. Agent code contains hooks (`@control()` decorator pattern). Policy definitions stored server-side — updated by compliance team without touching agent code.',
            metrics: { agility: 25, complexity: 15, velocity: 20, cost: 15 },
            pros: [
              { title: 'Instant fleet-wide updates', description: 'One policy change propagates to all 15 agents without redeployment' },
              { title: 'Ownership separation', description: 'Compliance defines policies; developers place hooks — responsibilities are clear' },
              { title: 'Hot-reloadable', description: 'Policies update at runtime — no agent restarts required' },
              { title: 'Consistent enforcement', description: 'Every agent enforces the exact same policy at the exact same version' },
            ],
            cons: [
              { title: 'Policy service dependency', description: 'All agents depend on the policy service availability — must be highly available' },
              { title: 'Organizational change', description: 'Requires compliance team to own and maintain policy definitions' },
            ],
            whyThisFits: 'Hardcoded guardrails break at fleet scale. Centralized policy management externalizes policy definitions from agent code — a single server-side change propagates to all agents instantly without redeployment. Compliance owns policies; developers own hooks.',
          },
        ],
      },
    ],
  },
  {
    id: 'production-readiness',
    title: 'Production Deployment Readiness',
    description: 'Ensure necessary deterministic runtime gates and staged deployment strategies are in place.',
    metrics: [
      { id: 'agility', label: 'Business Agility', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Skill Gap/Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'velocity', label: 'Delivery Velocity', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'Resource Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'no-policy',
        title: 'No Policy Enforcement in Place',
        description: 'Your agent is executing tool calls in production with no pre-execution check. A user submits a support ticket that contains a SQL injection payload. The agent\'s tool call dispatches it to the database.',
        recommended: 'pre-dispatch',
        choices: [
          {
            id: 'output-safety',
            label: 'Output Safety Filter',
            description: 'Scan agent outputs for PII and sensitive data before delivery to the user.',
            metrics: { agility: 5, complexity: 10, velocity: 5, cost: 10 },
            pros: [
              { title: 'Prevents information leakage', description: 'Catches PII and secrets in agent responses' },
            ],
            cons: [
              { title: 'Too late for side effects', description: 'Output safety runs after execution — the SQL injection already ran' },
              { title: 'Wrong layer for this threat', description: 'Input threats require pre-execution enforcement, not post-execution scanning' },
            ],
            whenToUse: 'Deploy alongside pre-dispatch enforcement — they address different failure modes.',
          },
          {
            id: 'pre-dispatch',
            label: 'Pre-Dispatch Policy Enforcement',
            description: 'A deterministic decision point runs before every tool call. Each action is classified as ALLOW, DENY, REQUIRE_APPROVAL, or ALLOW_WITH_CONSTRAINTS before execution.',
            metrics: { agility: 25, complexity: 15, velocity: 15, cost: 15 },
            pros: [
              { title: 'Stops threats before execution', description: 'Destructive inputs never reach the execution layer' },
              { title: 'Deterministic', description: 'Not a heuristic — policy rules produce deterministic decisions' },
              { title: 'Covers all attack surfaces', description: 'Evaluates tool calls, permission scope, and action type before dispatch' },
              { title: 'Foundation for approval workflows', description: 'REQUIRE_APPROVAL routes to human queue — enabling synchronous oversight at the right points' },
            ],
            cons: [
              { title: 'Latency per call', description: 'Adds evaluation overhead to every tool dispatch' },
              { title: 'Policy design required', description: 'Rules must be defined — a blank policy is not secure by default' },
            ],
            whyThisFits: 'Pre-dispatch policy enforcement is the single highest-leverage control in a production AI agent stack. It runs before every tool call, evaluating risk before any side effect occurs. All other controls address what happened — this one prevents it.',
          },
          {
            id: 'audit-trail',
            label: 'Immutable Audit Trail',
            description: 'Write-once log of every action, policy decision, and approver.',
            metrics: { agility: 10, complexity: 5, velocity: 10, cost: 5 },
            pros: [
              { title: 'Post-incident narrative', description: 'Defensible account of what happened and who approved it' },
            ],
            cons: [
              { title: 'Retrospective only', description: 'Audit trails record what happened — they do not prevent harmful actions' },
              { title: 'Insufficient alone', description: 'Knowing the SQL injection ran is not the same as stopping it' },
            ],
            whenToUse: 'Essential for compliance, but deploy pre-dispatch enforcement first.',
          },
        ],
      },
      {
        id: 'prep-deployment',
        title: 'Preparing for First Production Deployment',
        description: 'Your team has a working AI agent demo. You are preparing to go live with real users and real data for the first time. The team is debating which controls to implement before go-live.',
        recommended: 'staged-rollout',
        choices: [
          {
            id: 'full-cutover',
            label: 'Full 0% → 100% Cutover',
            description: 'Deploy the agent to all users simultaneously after passing QA.',
            metrics: { agility: 10, complexity: -5, velocity: 20, cost: -10 },
            pros: [
              { title: 'Fastest go-live', description: 'No phased ramp — all users get access immediately' },
            ],
            cons: [
              { title: 'Maximum blast radius', description: 'A systematic error affects 100% of users from the first moment' },
              { title: 'No rollback signal', description: 'Promotion gates with objective metrics are the only way to know if errors are within bounds' },
              { title: 'Retry storm risk', description: 'Agent failures at 100% scale produce retry storms that compound the incident' },
            ],
            whenToUse: 'Internal tooling with no customer impact and full rollback capability within minutes.',
          },
          {
            id: 'staged-rollout',
            label: 'Staged Rollout (5% → 25% → 50% → 100%)',
            description: 'Traffic increases through explicit gates with objective metrics at each phase. Promotion requires meeting error rate, latency, and quality thresholds. A tested rollback drill is required before Stage 1.',
            metrics: { agility: 25, complexity: 15, velocity: 10, cost: 15 },
            pros: [
              { title: 'Blast radius bounded', description: 'Systematic failures surface at 5% before they affect all users' },
              { title: 'Objective promotion gates', description: 'Promotion decisions are data-driven, not confidence-driven' },
              { title: 'Rollback tested', description: 'You know the undo path works before you need it' },
              { title: 'Industry standard', description: 'Cordum 2026: staged rollout is non-negotiable for production AI agents' },
            ],
            cons: [
              { title: 'Slower go-live', description: 'Each phase requires a minimum observation period before promotion' },
              { title: 'Requires monitoring infrastructure', description: 'Promotion gates require metrics collection from day one' },
            ],
            whyThisFits: 'The most common pre-production failure mode is a single 0% → 100% cutover. Staged rollout (5% → 25% → 50% → 100%) with objective promotion gates catches systematic failures before full exposure. Pre-dispatch policy enforcement and a rollback drill must be in place before Stage 1.',
          },
        ],
      },
    ],
  },
]
