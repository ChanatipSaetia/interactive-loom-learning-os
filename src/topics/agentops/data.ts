import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'
import type { SituationChoice } from '../../sections/situation-choice'
import type { BulletItem } from '../../sections/bullets'

// ─── Flowchart: AgentOps Four-Phase Lifecycle ────────────────────────────────

export const agentopsNodes: FlowchartNode[] = [
  {
    id: 'agent-system',
    label: 'Agent System',
    stereotype: 'System',
    icon: 'Bot',
    layer: 0,
    description: 'LLM-powered agent running in production — single or multi-agent.',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    stereotype: 'Phase 1',
    icon: 'Activity',
    layer: 1,
    description:
      'Collect traditional data (metrics, logs, traces) plus model data (hidden states, attention maps) and checkpoint data (memory/environment snapshots).',
  },
  {
    id: 'anomaly-detection',
    label: 'Anomaly Detection',
    stereotype: 'Phase 2',
    icon: 'AlertTriangle',
    layer: 2,
    description:
      'Detect anomalies using white-box, grey-box, or black-box methods depending on type: reasoning hallucinations, planning inconsistencies, action failures, memory issues, security attacks, or emergent behavior.',
  },
  {
    id: 'rca',
    label: 'Root Cause Analysis',
    stereotype: 'Phase 3',
    icon: 'Search',
    layer: 3,
    description:
      'Diagnose root cause across three dimensions: system-centric (DevOps/SRE), model-centric (ML Engineering), or orchestration-centric (Agent Developers).',
  },
  {
    id: 'resolution',
    label: 'Resolution',
    stereotype: 'Phase 4',
    icon: 'Wrench',
    layer: 4,
    description:
      'Apply iterative fixes: redundancy/voting, guardrails/assertions, recovery/rollback, self-correction, or re-prompting. Requires multi-turn validation due to non-determinism.',
  },
  {
    id: 'validate',
    label: 'Validate',
    stereotype: 'Feedback',
    icon: 'CheckCircle',
    layer: 5,
    description:
      'Verify fix via manual annotation or LLM-as-a-Judge. If unresolved, loop back to Monitoring.',
  },
]

export const agentopsEdges: FlowchartEdge[] = [
  { from: 'agent-system', to: 'monitoring', description: 'Agent emits operational data continuously' },
  { from: 'monitoring', to: 'anomaly-detection', description: 'Collected data fed into detection methods' },
  { from: 'anomaly-detection', to: 'rca', description: 'Detected anomaly triggers root cause investigation' },
  { from: 'rca', to: 'resolution', description: 'Identified root cause guides resolution strategy' },
  { from: 'resolution', to: 'validate', description: 'Fix applied and validated' },
  { from: 'validate', to: 'monitoring', description: 'Unresolved — loop back with new context' },
  { from: 'validate', to: 'agent-system', description: 'Resolved — agent continues operation' },
]

export const agentopsJourneys: Journey[] = [
  {
    id: 'reasoning-anomaly',
    label: 'Reasoning Anomaly Journey',
    description:
      'An agent produces a hallucinated fact during reasoning. The anomaly is detected via LLM-as-judge, traced to model stochasticity, and resolved by adding a redundancy-and-voting guardrail.',
    steps: [
      { nodeId: 'agent-system', description: 'Agent reasons over a query and generates a response containing a hallucinated fact.' },
      { nodeId: 'monitoring', description: 'Monitoring captures the LLM output, token logits, and checkpoint of the agent\'s memory state.' },
      { nodeId: 'anomaly-detection', description: 'Black-box LLM-as-judge detects a factual inconsistency between the response and known sources.' },
      { nodeId: 'rca', description: 'Root cause analysis determines the anomaly is model-centric (stochastic hallucination), not a system or orchestration issue.' },
      { nodeId: 'resolution', description: 'Resolution applies redundancy-and-voting: runs the query through two LLM instances and cross-validates facts.' },
      { nodeId: 'validate', description: 'Validation confirms the hallucinated fact is no longer present in the aggregated response.' },
      { nodeId: 'agent-system', description: 'Agent continues with improved factual reliability.' },
    ],
  },
  {
    id: 'termination-anomaly',
    label: 'Termination Anomaly Journey',
    description:
      'A multi-agent system falls into infinite recursion (neural howlround). Monitoring detects the loop via trace analysis, RCA identifies orchestration design flaw, and resolution applies a termination guardrail.',
    steps: [
      { nodeId: 'agent-system', description: 'Two agents keep delegating a task to each other in an infinite loop.' },
      { nodeId: 'monitoring', description: 'Monitoring captures distributed traces showing the same task being passed back and forth.' },
      { nodeId: 'anomaly-detection', description: 'Loop detection algorithm identifies a termination anomaly — the neural howlround pattern.' },
      { nodeId: 'rca', description: 'Semantic comparative analysis contrasts the failing trace with a successful trace, finding divergence at the delegation logic.' },
      { nodeId: 'resolution', description: 'Resolution re-specifies the prompt with a maximum delegation depth and adds a termination guardrail.' },
      { nodeId: 'validate', description: 'Counterfactual simulation replays the scenario with the fix — the loop terminates at the configured depth.' },
      { nodeId: 'agent-system', description: 'Multi-agent system now terminates gracefully within bounds.' },
    ],
  },
  {
    id: 'security-anomaly',
    label: 'Security Anomaly Journey',
    description:
      'An external actor injects a malicious prompt into the agent\'s tool input. Graph-based detection catches the attack, RCA traces to an unprotected API, and resolution applies behavioral guardrails.',
    steps: [
      { nodeId: 'agent-system', description: 'Agent calls an external API whose response contains a hidden prompt injection.' },
      { nodeId: 'monitoring', description: 'Monitoring captures the API call, response payload, and subsequent agent behavior shift.' },
      { nodeId: 'anomaly-detection', description: 'Graph-based detection (SentinelAgent pattern) flags an unusual action sequence inconsistent with the agent\'s role.' },
      { nodeId: 'rca', description: 'Full-stack traceability captures the cognitive state before and after the injection, pinpointing the injected prompt as root cause.' },
      { nodeId: 'resolution', description: 'Resolution applies behavioral guardrails: input sanitization, output filtering, and tool-call validation.' },
      { nodeId: 'validate', description: 'Adversarial test cases confirm the agent now rejects the injected prompt.' },
      { nodeId: 'agent-system', description: 'Agent continues with hardened input/output pipeline.' },
    ],
  },
]

// ─── Text: Background and Problem ────────────────────────────────────────────

export const agentopsIntroParagraphs: string[] = [
  'LLM-powered agent systems are being deployed in production, but they lack a dedicated operational framework. Success rates on benchmarks range from **33% to 95%**, meaning anomalies are widespread and systemic.',
  'Existing operational practices — DevOps for microservices, MLOps for model maintenance, AIOps for ML-driven IT — are not designed for the stochastic, emergent behavior of agent systems. Agents introduce entirely new anomaly types: reasoning hallucinations, planning inconsistencies, infinite delegation loops, and prompt injection attacks.',
  '**AgentOps** (Agent System Operations) is the first comprehensive framework to address this gap. It defines a four-phase lifecycle — **Monitoring → Anomaly Detection → Root Cause Analysis → Resolution** — tailored to the unique challenges of operating LLM agents.',
]

export const agentopsEvolutionParagraphs: string[] = [
  'Operations has evolved along two axes: the **technology** driving automation (Manual → Rule-Based → ML → Agents) and the **target** being operated (Microservices → ML Models → Agent Systems).',
  'Traditional Ops monitors metrics, logs, and traces. MLOps adds model performance metrics. **AgentOps** goes further: it monitors LLM internal states (hidden layers, attention maps, token logits), captures agent checkpoints at each step, and reasons about semantic interactions between agents — not just infrastructure health.',
  'The key distinction: **AgentOps** is operations *of* agent systems, while **AgenticOps** uses agents *for* the operations of traditional systems. They address opposite directions of the same technology.',
]

// ─── Bullets: Anomaly Taxonomy ───────────────────────────────────────────────

export const anomalyTaxonomyBullets: BulletItem[] = [
  {
    text: 'Intra-Agent Anomalies (within a single agent)',
    children: [
      { text: 'Reasoning — factual hallucinations, dishonesty, contradictory logic' },
      { text: 'Planning — actions inconsistent with prior reasoning, unreasonable plans' },
      { text: 'Action — incorrect tool selection, system failures, jailbreak risks' },
      {
        text: 'Memory — short-term context loss, long-term RAG hallucination',
      },
      { text: 'Environment — resource exhaustion, excessive CPU from local ops' },
    ],
  },
  {
    text: 'Inter-Agent Anomalies (between agents)',
    children: [
      { text: 'Task Specification — unclear prompts, incorrect role configuration' },
      { text: 'Security — message flooding, prompt injection, tool poisoning' },
      { text: 'Communication — message storms, redundancy causing lost agents' },
      { text: 'Trust — agents treat all messages equally without verification' },
      {
        text: 'Emergent Behavior — unpredictable macro-level behavior from micro interactions',
      },
      {
        text: 'Termination — premature stop, infinite recursion, endless delegation',
      },
    ],
  },
]

// ─── Bullets: RCA Strategies ─────────────────────────────────────────────────

export const rcaStrategiesBullets: BulletItem[] = [
  {
    text: 'Full-Stack Agent Traceability',
    children: [
      {
        text: 'Captures cognitive state snapshots (Beliefs, Memory, Plan/Intent) at each step',
      },
      { text: 'Records reasoning process and action-environment interactions' },
      { text: 'Enables complete replayability of agent execution' },
    ],
  },
  {
    text: 'Hypothesis-Driven Counterfactual Simulation',
    children: [
      { text: '"Time-travel" to a checkpoint, modify one element, resume execution' },
      { text: 'Active experimental diagnosis rather than passive post-mortem' },
      { text: 'Observes outcome to validate or reject hypotheses' },
    ],
  },
  {
    text: 'Semantic Comparative Analysis',
    children: [
      { text: 'Compare failed trace with successful trace on similar input' },
      { text: 'Semantic diff of reasoning paths to find divergence points' },
      { text: 'Identifies where and why the agent deviated from the expected path' },
    ],
  },
]

// ─── Bullets: Differences from Traditional Ops ───────────────────────────────

export const opsComparisonBullets: BulletItem[] = [
  {
    text: 'Monitoring Data — Traditional: metrics, logs, traces vs AgentOps: + model data, checkpoint data',
  },
  {
    text: 'Anomaly Detection — Traditional: reliable data vs AgentOps: must verify data correctness first',
  },
  {
    text: 'RCA Granularity — Traditional: service, pod, code vs AgentOps: agent action, LLM step, reasoning path',
  },
  {
    text: 'Resolution — Traditional: deterministic one-shot vs AgentOps: iterative multi-turn with A/B testing',
  },
]

// ─── Situation Choice: AgentOps Design Decisions ──────────────────────────────

export const agentopsSituations: SituationChoice[] = [
  {
    title: 'Monitoring Depth',
    situation:
      'Your agent system is experiencing intermittent failures in production. You need to set up monitoring to diagnose the root cause. The team is unsure how deep to go with data collection.',
    recommended: 'full-agentops',
    recommendationDetail: {
      why: 'Agent systems have non-deterministic failures that cannot be diagnosed with traditional metrics alone. Model data (internal LLM states) and checkpoint data (step-by-step snapshots) are essential for tracing reasoning anomalies and emergent behavior that traditional monitoring misses.',
    },
    choices: [
      {
        id: 'traditional',
        label: 'Traditional Monitoring (Metrics + Logs + Traces)',
        description:
          'Monitor latency, token usage, cost, and standard distributed traces — similar to microservice observability.',
        pros: [
          { title: 'Familiar tooling', description: 'Teams already know Prometheus, Grafana, Datadog' },
          { title: 'Lower overhead', description: 'Less data to store and process' },
          { title: 'Easy to start', description: 'Quick to implement with existing infrastructure' },
        ],
        cons: [
          {
            title: 'Cannot detect reasoning anomalies',
            description:
              'Hallucinations and logic errors leave no trace in traditional metrics',
          },
          {
            title: 'Blind to model internals',
            description: 'No visibility into why the LLM produced a specific output',
          },
          {
            title: 'No rollback capability',
            description: 'Without checkpoints, cannot replay or rewind agent state',
          },
        ],
        whenToUse:
          'Useful as a baseline, but insufficient for diagnosing the unique failure modes of LLM agents.',
      },
      {
        id: 'full-agentops',
        label: 'Full AgentOps Monitoring',
        description:
          'Traditional data plus model data (hidden states, attention maps, token logits) and checkpoint data (memory/environment snapshots at each step).',
        pros: [
          {
            title: 'Complete observability',
            description:
              'Can trace reasoning paths, detect hallucinations, and replay agent execution',
          },
          {
            title: 'Enables counterfactual simulation',
            description: 'Checkpoints allow time-travel debugging',
          },
          {
            title: 'Supports all RCA strategies',
            description: 'Full-stack traceability and semantic comparison require deep data',
          },
        ],
        cons: [
          {
            title: 'Vast data volume',
            description: 'Model and checkpoint data scales with agent count and step count',
          },
          {
            title: 'Higher complexity',
            description: 'Requires specialized tools like LangFuse, AgentOps.ai, or Arize Phoenix',
          },
          {
            title: 'Security sensitivity',
            description: 'Internal model states and memory may contain confidential data',
          },
        ],
      },
    ],
  },
  {
    title: 'Resolution Strategy',
    situation:
      'Your agent has been producing inconsistent answers for the same query. You need to choose a resolution approach to stabilize the output.',
    recommended: 'system-design',
    recommendationDetail: {
      why: 'For non-deterministic reasoning issues, system-design approaches like redundancy-and-voting or guardrails provide more reliable stabilization than prompt tweaks alone. Prompt optimization helps but cannot guarantee consistency across stochastic LLM calls.',
    },
    choices: [
      {
        id: 'system-design',
        label: 'System Design (Redundancy, Guardrails, Recovery)',
        description:
          'Architectural approaches: run multiple LLM instances with voting, add behavioral guardrails for output filtering, implement checkpoint-based rollback.',
        pros: [
          {
            title: 'Deterministic guarantees',
            description: 'Guardrails enforce hard constraints on agent behavior',
          },
          {
            title: 'Redundancy improves reliability',
            description: 'Voting across LLM instances reduces hallucination risk',
          },
          {
            title: 'Recovery enables safe failure',
            description: 'Rollback to checkpoints prevents cascading errors',
          },
        ],
        cons: [
          {
            title: 'Higher cost',
            description: 'Multiple LLM calls and guardrail checks increase token usage',
          },
          {
            title: 'Added latency',
            description: 'Voting and validation add rounds to the execution pipeline',
          },
        ],
      },
      {
        id: 'prompt-optimization',
        label: 'Prompt Optimization (Self-Correction, Re-Prompting)',
        description:
          'Refine prompts to improve reasoning: add self-correction instructions, re-specify roles, re-prompt with different framing.',
        pros: [
          { title: 'Lower cost', description: 'No additional LLM instances needed' },
          {
            title: 'Improves reasoning quality',
            description: 'Better prompts reduce hallucination and logic errors',
          },
          { title: 'Quick to iterate', description: 'Prompt changes deploy without infrastructure changes' },
        ],
        cons: [
          {
            title: 'Non-deterministic',
            description: 'No guarantee the fix will hold across different inputs or model versions',
          },
          {
            title: 'Requires multi-turn validation',
            description: 'Each prompt change needs A/B testing to verify',
          },
          {
            title: 'Second-order effects',
            description:
              'A fix for one anomaly may create another (e.g., stricter prompt causes premature termination)',
          },
        ],
        whenToUse:
          'Best as a complement to system-design approaches, not as the sole resolution strategy for production agents.',
      },
    ],
  },
  {
    title: 'RCA Approach',
    situation:
      'A multi-agent system failed to complete a complex task. You need to diagnose what went wrong. The failure involved three agents coordinating through message passing.',
    recommended: 'counterfactual',
    recommendationDetail: {
      why: 'For multi-agent coordination failures, counterfactual simulation is the most powerful RCA strategy. It lets you isolate which agent\'s decision caused the failure by replaying the scenario with one element changed at a time — far more precise than trace comparison alone.',
    },
    choices: [
      {
        id: 'traceability',
        label: 'Full-Stack Traceability',
        description:
          'Replay the complete execution trace: cognitive states, reasoning records, and action-environment interactions at every step.',
        pros: [
          {
            title: 'Complete picture',
            description: 'Shows every decision the agents made',
          },
          {
            title: 'Passive analysis',
            description: 'No need to re-run the system',
          },
          { title: 'Good for documentation', description: 'Trace serves as audit record' },
        ],
        cons: [
          {
            title: 'Descriptive, not diagnostic',
            description: 'Shows what happened but not why',
          },
          {
            title: 'Hard to isolate cause',
            description: 'With multiple agents, the trace shows correlations, not causation',
          },
        ],
        whenToUse: 'Best as a first step to understand the failure timeline before deeper analysis.',
      },
      {
        id: 'counterfactual',
        label: 'Counterfactual Simulation',
        description:
          'Time-travel to a checkpoint, modify one element (e.g., one agent\'s prompt), and observe the outcome to test hypotheses about root cause.',
        pros: [
          {
            title: 'Causal diagnosis',
            description: 'Directly tests whether a specific factor caused the failure',
          },
          {
            title: 'Isolates variables',
            description: 'Changes one element at a time for clean experiments',
          },
          {
            title: 'Validates fixes',
            description: 'Same mechanism used to verify resolution works',
          },
        ],
        cons: [
          {
            title: 'Requires checkpoints',
            description: 'Needs checkpoint data from monitoring phase',
          },
          {
            title: 'Computationally expensive',
            description: 'Each simulation re-runs the full agent pipeline',
          },
          {
            title: 'Non-deterministic results',
            description: 'Stochastic LLM may produce different outcomes on replay',
          },
        ],
      },
      {
        id: 'semantic-comparison',
        label: 'Semantic Comparative Analysis',
        description:
          'Compare the failed execution trace with a successful trace on similar input, looking for semantic divergence in reasoning paths.',
        pros: [
          { title: 'No re-execution needed', description: 'Uses existing traces only' },
          {
            title: 'Finds divergence points',
            description: 'Identifies where the failed path deviated from success',
          },
          {
            title: 'Semantic understanding',
            description: 'Compares meaning, not just literal token sequences',
          },
        ],
        cons: [
          {
            title: 'Requires successful baseline',
            description: 'Need a comparable successful trace for comparison',
          },
          {
            title: 'Correlation, not causation',
            description: 'Divergence point may not be the root cause',
          },
        ],
        whenToUse: 'Effective when you have a library of successful traces to compare against.',
      },
    ],
  },
]
