import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const autonomyTierStep: TradeoffStep = {
  id: 'autonomy-tier',
  title: 'Autonomy Tier',
  description: 'Choose the independence level for the agent. Higher autonomy means faster execution but requires stronger runtime controls.',
  recommended: 'guided',
  choices: [
    {
      id: 'shadow',
      label: 'Shadow — Suggests Only',
      description: 'The agent produces recommendations but a human makes every final decision. Best for early deployment, calibration, and high-stakes domains.',
      metrics: { speed: -30, safety: 25, cost: -10, complexity: -15 },
      pros: [
        { title: 'Maximum safety', description: 'Human retains full control over every decision, eliminating autonomous errors.' },
        { title: 'Calibration period', description: 'Builds confidence in the system by comparing agent suggestions against human decisions.' },
        { title: 'Regulatory compliance', description: 'Suitable for financial transactions, legal commitments, and regulated workflows.' },
      ],
      cons: [
        { title: 'Slow throughput', description: 'Every decision requires human attention, limiting scale.' },
        { title: 'Higher labor cost', description: 'Human time spent reviewing every suggestion adds operational expense.' },
      ],
      whenToUse: 'Use during early deployment, in high-stakes domains, or when regulatory requirements mandate human-in-the-loop for every decision.',
    },
    {
      id: 'supervised',
      label: 'Supervised — Drafts, Human Approves',
      description: 'The agent produces a complete draft that a human reviews and approves before execution. First step toward autonomy with a safety net intact.',
      metrics: { speed: -10, safety: 15, cost: 5, complexity: -5 },
      pros: [
        { title: 'Faster than shadow', description: 'Agent does the heavy lifting of producing drafts; human focuses on review.' },
        { title: 'Audit trail', description: 'Every action has a clear human approval record for compliance.' },
        { title: 'Balanced risk', description: 'Good middle ground for regulated workflows requiring oversight.' },
      ],
      cons: [
        { title: 'Still bottlenecked', description: 'Human approval remains a throughput constraint.' },
        { title: 'Override fatigue', description: 'If the agent is unreliable, humans rubber-stamp without reviewing.' },
      ],
      whenToUse: 'Suitable for workflows transitioning from shadow mode, or where regulatory requirements demand human sign-off but agent quality is proven.',
    },
    {
      id: 'guided',
      label: 'Guided — Acts, Human Monitors',
      description: 'The agent executes autonomously while a human monitors exceptions and intervenes when flagged. Default for mature, low-blast-radius workflows.',
      metrics: { speed: 20, safety: 0, cost: 15, complexity: 10 },
      pros: [
        { title: 'High throughput', description: 'Agent handles routine cases without human intervention.' },
        { title: 'Exception-focused oversight', description: 'Human attention concentrates on flagged cases where judgment matters most.' },
        { title: 'Proven pattern', description: 'Common in customer support routing, lead qualification, and content moderation.' },
      ],
      cons: [
        { title: 'Requires reliable flagging', description: 'If the agent cannot identify its own uncertainty, dangerous cases slip through.' },
        { title: 'Blast radius risk', description: 'Autonomous errors before detection can cause downstream damage.' },
      ],
      whyThisFits: 'For most production deployments, Guided offers the best balance: agents handle volume while humans focus on exceptions. It requires runtime controls like anomaly detection and escalation paths.',
    },
    {
      id: 'autonomous',
      label: 'Autonomous — Self-Corrects',
      description: 'The agent executes and self-corrects within defined boundaries. Human reviews aggregated outcomes, not individual decisions.',
      metrics: { speed: 35, safety: -15, cost: 25, complexity: 20 },
      pros: [
        { title: 'Maximum throughput', description: 'No human bottleneck; agent handles all cases within its scope.' },
        { title: 'Continuous improvement', description: 'Agent learns from outcomes and refines its approach over time.' },
        { title: 'Lowest operational cost', description: 'Minimal human oversight reduces labor expense significantly.' },
      ],
      cons: [
        { title: 'Highest risk', description: 'Errors propagate without human gate; requires robust runtime controls.' },
        { title: 'Complex to maintain', description: 'Needs kill switches, sandboxes, drift detection, and clear accountability.' },
        { title: 'Trust requirement', description: 'Organization must trust aggregated monitoring over individual case review.' },
      ],
      whenToUse: 'Only for mature workflows with proven agent reliability, low blast radius, and comprehensive runtime controls including kill switches and reasoning sandboxes.',
    },
  ],
}
