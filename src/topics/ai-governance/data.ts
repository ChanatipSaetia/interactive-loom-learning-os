import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'

/* ──────────────────────────────────────────────────────────────
 * All content sourced from Obsidian vault notes. References below.
 *
 * Primary sources:
 *   - glossary/Agent Governance.md
 *   - summaries/agent-governance-field-guide/00-index.md  (source: https://static1.squarespace.com/static/64edf8e7f2b10d716b5ba0e1/t/6801438c58c2692374995db0/1744913293841/Agent+Governance_+A+Field+Guide.pdf)
 *   - summaries/agent-governance-field-guide/01-core.md
 *   - summaries/agent-governance-field-guide/02-risks.md
 *   - summaries/agent-governance-field-guide/03-interventions.md
 *   - summaries/owasp-top10-agentic-2026/00-index.md  (source: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
 *   - summaries/owasp-top10-agentic-2026/01-core.md
 *   - summaries/saif-focus-on-agents/00-index.md  (source: https://saif.google/focus-on-agents)
 *   - summaries/saif-focus-on-agents/04-agent-controls.md
 *   - glossary/Agentic Risk & Capability Framework.md
 *   - glossary/Autonomy Tier.md
 *   - glossary/Runtime Control.md
 *   - glossary/Behavioral Guardrails.md
 *   - glossary/Loss of Control (AI).md
 *   - glossary/Specification Gaming.md
 *   - glossary/Agent Infrastructure.md
 *   - summaries/chan-2025-infrastructure-for-ai-agents/00-index.md  (source: https://openreview.net/forum?id=Ckh17xN2R2)
 * ────────────────────────────────────────────────────────────── */

// ─── Text: What is AI Governance? ──────────────────────────────

export const governanceTextParagraphs: string[] = [
  'AI governance is the field focused on navigating the transition to a world where AI agents can carry out a wide array of tasks with human-level-or-above proficiency. It encompasses measures to shepherd agent development at a pace allowing societal adaptation, while managing risks and ensuring beneficial deployment. _Ref: glossary/Agent Governance.md; summaries/agent-governance-field-guide/00-index.md_',
  'Agent governance is distinct from general AI governance due to agent-specific challenges: opaque autonomous action, external tool integration, multi-agent dynamics, and the potential for agents to participate in governance themselves. It operates at three layers: model (foundation model), system (scaffolding), and ecosystem (broader environment). _Ref: glossary/Agent Governance.md_',
  'Current agents perform comparably to humans on short tasks (~30 min) but degrade sharply on longer horizons. For instance, on SWE-bench Verified, agents reach 20.8% under 1 hour but collapse to 0% beyond 4 hours. Task completion length is doubling every 7 months (Kwa et al. 2025), making governance increasingly urgent. _Ref: summaries/agent-governance-field-guide/01-core.md_',
]

// ─── Text: Governance Frameworks ───────────────────────────────

export const governanceFrameworksParagraphs: string[] = [
  '**OWASP Top 10 for Agentic Applications (2026)** identifies the most critical security risks specific to AI agents through global peer review with 100+ contributors. Risks range from Agent Behaviour Hijack (ASI01) to Rogue Agents (ASI10). _Ref: summaries/owasp-top10-agentic-2026/00-index.md (source: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)_',
  '**ARC Framework** by GovTech Singapore and SUTD maps agent capabilities to risks to controls through three analytical lenses: Components, Design, and Capabilities. It catalogs 54+ risks with tiered controls: Cardinal (must adopt), Standard (should adapt), Best Practice (recommended for high-risk). _Ref: glossary/Agentic Risk & Capability Framework.md; summaries/2512.22211-arc-framework/00-index.md_',
  '**Google SAIF** extends its Secure AI Framework for agentic systems with three controls: Agent User Control (confirmation gates), Agent Permissions (least-privilege, contextual and dynamic), and Agent Observability (action logging, tool call tracing, reasoning chain visibility). _Ref: summaries/saif-focus-on-agents/00-index.md (source: https://saif.google/focus-on-agents); summaries/saif-focus-on-agents/04-agent-controls.md_',
  '**Agent Infrastructure** (Chan et al. 2025, TMLR) catalogs nine infrastructure types across three functions that mediate agent interactions with their environment, analogous to how traffic lights regulate drivers rather than training programs improving drivers. _Ref: glossary/Agent Infrastructure.md; summaries/chan-2025-infrastructure-for-ai-agents/00-index.md (source: https://openreview.net/forum?id=Ckh17xN2R2)_',
]

// ─── Bullets: Five-Category Intervention Taxonomy ──────────────

export const governanceInterventionBullets: { text: string }[] = [
  { text: "**Alignment** — Ensure agents behave consistent with principal's values. Includes multi-agent RL, risk-attitude alignment, paraphrasing CoT, and alignment evaluations. _Ref: summaries/agent-governance-field-guide/03-interventions.md_" },
  { text: '**Control** — Constrain agent behavior within predefined boundaries. Includes rollback infrastructure, shutdown/interruption, tool restrictions, and control protocols. _Ref: summaries/agent-governance-field-guide/03-interventions.md_' },
  { text: '**Visibility** — Make agent behavior observable to humans. Includes agent IDs, activity logging, cooperation evaluations, and reward reports. _Ref: summaries/agent-governance-field-guide/03-interventions.md_' },
  { text: '**Security & Robustness** — Protect from external threats and ensure reliability. Includes access controls, adversarial testing, sandboxing, and rapid response defense. _Ref: summaries/agent-governance-field-guide/03-interventions.md_' },
  { text: '**Societal Integration** — Support long-term integration into social/political systems. Includes liability regimes, commitment devices, equitable access, and law-following agents. _Ref: summaries/agent-governance-field-guide/03-interventions.md_' },
]

// ─── Bullets: OWASP Top 10 Risks ──────────────────────────────

export const owaspRiskBullets: { text: string }[] = [
  { text: '**ASI01: Agent Behaviour Hijack** — Attacker manipulates agent goals through prompt injection, data poisoning, or environment manipulation. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI02: Tool Misuse and Exploitation** — Agent granted excessive tool access enables unauthorized actions. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI03: Identity & Privilege Abuse** — Agent impersonates users or escalates privileges through integrated systems. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI04: Agentic Supply Chain Vulnerabilities** — Compromised models, tools, prompts, or configurations in the agent supply chain. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI05: Unexpected Code Execution (RCE)** — Agent executes untrusted or malicious code through tool calls or generated scripts. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI06: Memory & Context Poisoning** — Agent memory or context window corrupted with malicious data affecting reasoning. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI07: Insecure Inter-Agent Communication** — Unencrypted or unauthenticated communication between agents enables interception and manipulation. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI08: Cascading Failures** — Failure in one agent propagates through interconnected agent systems. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI09: Human-Agent Trust Exploitation** — Agents exploit human over-trust, alert fatigue, or social engineering vulnerabilities. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
  { text: '**ASI10: Rogue Agents** — Agents autonomously pursue objectives beyond intended scope, evading behavioral guardrails. _Ref: summaries/owasp-top10-agentic-2026/01-core.md_' },
]

// ─── Bullets: Risk Landscape ──────────────────────────────────

export const riskLandscapeBullets: { text: string }[] = [
  { text: '**Malicious Use** — Agents amplify malicious activities by lowering barriers to entry: disinformation at scale, automated cyberattacks, dual-use bioweapon research. LLM safety training fails to generalize when models are deployed as agents. _Ref: summaries/agent-governance-field-guide/02-risks.md_' },
  { text: '**Accidents & Loss of Control** — Incremental delegation erodes human expertise; rogue replication enables self-proliferation. Capability warning signs include scheming (Meinke et al. 2025), alignment faking (Greenblatt et al. 2024), specification gaming, and AI R&D acceleration. _Ref: summaries/agent-governance-field-guide/02-risks.md; glossary/Loss of Control (AI).md; glossary/Specification Gaming.md_' },
  { text: '**Security Risks** — Larger attack surface from tool integration: API exploitation, memory attacks, multi-agent sabotage, and infectious jailbreaks. _Ref: summaries/agent-governance-field-guide/02-risks.md_' },
  { text: '**Systemic Risks** — Labor displacement at scale, power concentration (coding elite, authoritarian entrenchment), democratic erosion, and hyperswitching market instability. _Ref: summaries/agent-governance-field-guide/02-risks.md_' },
]

// ─── Flowchart: Intervention Taxonomy Architecture ─────────────

export const governanceNodes: FlowchartNode[] = [
  { id: 'agent', label: 'AI Agent', stereotype: 'agent', icon: 'Bot', layer: 0 },
  { id: 'alignment', label: 'Alignment', stereotype: 'control', icon: 'Shield', layer: 1 },
  { id: 'control', label: 'Control', stereotype: 'control', icon: 'Lock', layer: 1 },
  { id: 'visibility', label: 'Visibility', stereotype: 'control', icon: 'Eye', layer: 1 },
  { id: 'security', label: 'Security', stereotype: 'control', icon: 'Shield', layer: 1 },
  { id: 'society', label: 'Societal\nIntegration', stereotype: 'control', icon: 'Users', layer: 1 },
  { id: 'model-layer', label: 'Model Layer', stereotype: 'layer', icon: 'Brain', layer: 2 },
  { id: 'system-layer', label: 'System Layer', stereotype: 'layer', icon: 'Server', layer: 2 },
  { id: 'eco-layer', label: 'Ecosystem Layer', stereotype: 'layer', icon: 'Globe', layer: 2 },
]

export const governanceEdges: FlowchartEdge[] = [
  { from: 'alignment', to: 'model-layer' },
  { from: 'control', to: 'system-layer' },
  { from: 'visibility', to: 'system-layer' },
  { from: 'security', to: 'system-layer' },
  { from: 'society', to: 'eco-layer' },
  { from: 'agent', to: 'alignment' },
  { from: 'agent', to: 'control' },
  { from: 'agent', to: 'visibility' },
  { from: 'agent', to: 'security' },
  { from: 'agent', to: 'society' },
]

export const governanceJourneys: Journey[] = [
  {
    id: 'governance-flow',
    label: 'Governance Flow',
    description: 'Shows how five governance categories map to three operational layers to govern an AI Agent. Alignment operates at the model layer, Control and Visibility at the system layer, and Societal Integration at the ecosystem layer.',
    steps: [
      { nodeId: 'agent', description: 'AI Agent operates autonomously' },
      { nodeId: 'alignment', description: 'Alignment ensures value consistency' },
      { nodeId: 'model-layer', description: 'Implemented at the foundation model level' },
      { nodeId: 'control', description: 'Control constrains behavior within boundaries' },
      { nodeId: 'system-layer', description: 'Implemented through scaffolding and tool restrictions' },
      { nodeId: 'visibility', description: 'Visibility makes behavior observable' },
      { nodeId: 'security', description: 'Security protects from external threats' },
      { nodeId: 'society', description: 'Societal integration ensures long-term fit' },
      { nodeId: 'eco-layer', description: 'Implemented through policy and legal mechanisms' },
    ],
  },
]

// ─── Tradeoff Sandbox: Governance design decisions ────────────────────────────

export const governanceScenarios: TradeoffScenario[] = [
  {
    id: 'ai-governance-sandbox',
    title: 'AI Governance Sandbox',
    description: 'Evaluate choices across the AI Governance lifecycle: autonomy level, runtime control, and governance framework.',
    metrics: [
      { id: 'mitigation', label: 'Risk Mitigation', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'speed', label: 'Development Speed', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'compliance', label: 'Compliance Alignment', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'System Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'autonomy-level',
        title: 'Autonomy Level for Production Agent',
        description: 'You are deploying an AI agent to handle customer support tickets. The agent can route queries, look up knowledge bases, and draft responses. The consequences of wrong actions include customer dissatisfaction and potential data exposure.',
        recommended: 'guided',
        choices: [
          {
            id: 'shadow',
            label: 'Shadow Mode',
            description: 'Agent suggests actions; human always takes the final action. Best for early deployment and calibration.',
            metrics: { mitigation: 30, speed: -20, compliance: 20, complexity: 5 },
            pros: [
              { title: 'Zero autonomous risk', description: 'Human always in control of final action' },
              { title: 'Calibration data', description: 'Builds trust data before going live' },
            ],
            cons: [
              { title: 'No efficiency gain', description: 'Human still does all the work' },
              { title: 'Bottleneck', description: 'Cannot scale without human bandwidth' },
            ],
            whenToUse: 'Use during initial deployment or in high-stakes domains (finance, legal) where autonomous errors are unacceptable.',
          },
          {
            id: 'supervised',
            label: 'Supervised Mode',
            description: 'Agent drafts the action; human approves before execution. Adds a confirmation gate.',
            metrics: { mitigation: 20, speed: -10, compliance: 15, complexity: 10 },
            pros: [
              { title: 'Efficiency with safety', description: 'Agent does the work, human validates' },
              { title: 'Audit trail', description: 'Every action has human approval record' },
            ],
            cons: [
              { title: 'Approval bottleneck', description: 'Still requires human per action' },
              { title: 'Alert fatigue', description: 'Humans may rubber-stamp over time' },
            ],
            whenToUse: 'Use for financial transactions, legal commitments, or regulated workflows where every action needs approval.',
          },
          {
            id: 'guided',
            label: 'Guided Mode (Recommended)',
            description: 'Agent acts independently; human monitors exceptions and intervenes when flagged. Balances autonomy with oversight.',
            metrics: { mitigation: 15, speed: 15, compliance: 15, complexity: 15 },
            pros: [
              { title: 'Scalable autonomy', description: 'Agent handles routine cases without human per action' },
              { title: 'Exception focus', description: 'Human attention directed to flagged cases only' },
              { title: 'Behavioral guardrails', description: 'Agent operates within defined bounds (glossary/Behavioral Guardrails.md)' },
            ],
            cons: [
              { title: 'Flag accuracy', description: 'Depends on quality of exception detection' },
              { title: 'Drift risk', description: 'Agent behavior may drift without per-action review' },
            ],
            whyThisFits: 'Guided autonomy lets the agent act independently while humans monitor exceptions and intervene when flagged. This balances efficiency with oversight for a medium-stakes domain. Ref: glossary/Autonomy Tier.md',
          },
          {
            id: 'autonomous',
            label: 'Autonomous Mode',
            description: 'Agent acts and self-corrects within bounds; human reviews only aggregated outcomes.',
            metrics: { mitigation: -10, speed: 30, compliance: 5, complexity: 20 },
            pros: [
              { title: 'Maximum efficiency', description: 'No human bottleneck at any level' },
              { title: 'Self-correction', description: 'Agent learns from outcomes to improve' },
            ],
            cons: [
              { title: 'Highest risk', description: 'Errors compound before human review' },
              { title: 'Requires maturity', description: 'Only for mature workflows with low blast radius' },
            ],
            whenToUse: 'Use only for mature workflows with proven reliability and low blast radius, backed by runtime controls (glossary/Runtime Control.md).',
          },
        ],
      },
      {
        id: 'runtime-control',
        title: 'Runtime Control Strategy',
        description: 'Your AI agent will interact with internal APIs: reading customer data, writing to a CRM, and sending emails. A malfunctioning agent could expose data, corrupt records, or send misleading communications.',
        recommended: 'layered-controls',
        choices: [
          {
            id: 'permission-scoping',
            label: 'Permission Scoping Only',
            description: 'Separate read from write access, scoped per workflow. Simplest control to implement.',
            metrics: { mitigation: 5, speed: 15, compliance: 5, complexity: -5 },
            pros: [
              { title: 'Simple', description: 'Straightforward to implement' },
              { title: 'Clear boundaries', description: 'Read vs write separation' },
            ],
            cons: [
              { title: 'Static', description: 'Does not adapt to runtime behavior' },
              { title: 'Single layer', description: 'No defense if permissions are exploited' },
            ],
          },
          {
            id: 'kill-switch',
            label: 'Kill Switch + Monitoring',
            description: 'Stop the agent when anomalies or drift are detected. Provides an emergency brake.',
            metrics: { mitigation: 15, speed: 10, compliance: 10, complexity: 10 },
            pros: [
              { title: 'Emergency stop', description: 'Halts agent when things go wrong' },
              { title: 'Observable', description: 'Requires monitoring infrastructure' },
            ],
            cons: [
              { title: 'Reactive', description: 'Damage may already be done before trigger' },
              { title: 'Threshold tuning', description: 'Hard to calibrate alarm thresholds' },
            ],
          },
          {
            id: 'layered-controls',
            label: 'Layered Controls (Recommended)',
            description: 'Combine API contracts (per-call validation), permission scoping (least-privilege), kill switches (emergency stop), and reasoning sandboxes (dry-run before execution).',
            metrics: { mitigation: 30, speed: -10, compliance: 20, complexity: 25 },
            pros: [
              { title: 'Defense-in-depth', description: 'Multiple layers catch different failure modes' },
              { title: 'Pre-execution safety', description: 'Reasoning sandboxes validate before action' },
              { title: 'Comprehensive', description: 'Covers prevention, detection, and response' },
            ],
            cons: [
              { title: 'Complexity', description: 'More infrastructure to build and maintain' },
              { title: 'Latency', description: 'Validation layers add execution time' },
            ],
            whyThisFits: 'A layered approach combining API contracts, permission scoping, kill switches, and reasoning sandboxes provides defense-in-depth. Each control catches failures the others might miss. Ref: glossary/Runtime Control.md',
          },
        ],
      },
      {
        id: 'governance-framework',
        title: 'Governance Framework Selection',
        description: 'Your organization needs to establish an AI governance framework for deployed agents. You need a structured approach to assess risks and implement controls.',
        recommended: 'arc-owasp-hybrid',
        choices: [
          {
            id: 'arc-only',
            label: 'ARC Framework',
            description: 'GovTech Singapore capability-centric framework. Maps capabilities to risks to controls with 54+ risks and three-tier controls (Cardinal, Standard, Best Practice).',
            metrics: { mitigation: 20, speed: 5, compliance: 25, complexity: 15 },
            pros: [
              { title: 'Capability-centric', description: 'Maps what agents can do to how they can fail' },
              { title: 'Systematic', description: 'Consistent risk phrasing and control tiers' },
              { title: 'Comprehensive', description: '54+ risks across three analytical lenses' },
            ],
            cons: [
              { title: 'Academic origin', description: 'Less industry-tested than OWASP' },
              { title: 'Singapore-focused', description: 'May not align with all regulatory contexts' },
            ],
          },
          {
            id: 'owasp-only',
            label: 'OWASP Top 10 Agentic',
            description: 'Industry peer-reviewed with 100+ contributors. Focuses on the most critical security risks with actionable mitigations.',
            metrics: { mitigation: 15, speed: 10, compliance: 15, complexity: 10 },
            pros: [
              { title: 'Industry consensus', description: '100+ expert peer review' },
              { title: 'Actionable', description: 'Clear risk descriptions and mitigations' },
              { title: 'Familiar format', description: 'Builds on established OWASP Top 10 pattern' },
            ],
            cons: [
              { title: 'Security-focused', description: 'Less coverage of alignment and societal integration' },
              { title: 'Top 10 limit', description: 'May miss less common but critical risks' },
            ],
          },
          {
            id: 'arc-owasp-hybrid',
            label: 'ARC + OWASP Hybrid (Recommended)',
            description: 'Use ARC for systematic capability-risk-control mapping, supplemented by OWASP for security depth and industry validation.',
            metrics: { mitigation: 30, speed: -5, compliance: 30, complexity: 20 },
            pros: [
              { title: 'Comprehensive coverage', description: 'Governance breadth + security depth' },
              { title: 'Industry validated', description: 'Combines academic rigor with practitioner review' },
              { title: 'Tiered controls', description: 'Cardinal/Standard/Best Practice from ARC' },
            ],
            cons: [
              { title: 'Integration effort', description: 'Need to reconcile two frameworks' },
              { title: 'Maintenance', description: 'Two frameworks to keep current' },
            ],
            whyThisFits: 'Combining ARC Framework\'s capability-centric risk mapping with OWASP Top 10\'s security focus provides comprehensive coverage. ARC maps capabilities to risks to controls systematically, while OWASP ensures known security vulnerabilities are addressed. Ref: glossary/Agentic Risk & Capability Framework.md; summaries/owasp-top10-agentic-2026/01-core.md',
          },
        ],
      },
    ],
  },
]
