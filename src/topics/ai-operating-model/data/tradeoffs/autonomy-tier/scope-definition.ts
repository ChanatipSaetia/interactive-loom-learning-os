import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const scopeDefinitionStep: TradeoffStep = {
  id: 'scope-definition',
  title: 'Scope Definition',
  description: 'How narrowly should you define what the agent is responsible for?',
  recommended: 'workflow-scoped',
  choices: [
    {
      id: 'department-scoped',
      label: 'Department-Level Agent',
      description: 'A broad "finance agent" or "HR agent" with wide-ranging capabilities across the department.',
      metrics: { speed: 5, safety: -15, cost: 5, complexity: -10 },
      pros: [
        { title: 'Broad coverage', description: 'One agent handles multiple tasks within the department.' },
        { title: 'Simpler initial setup', description: 'Fewer agents to configure and deploy.' },
      ],
      cons: [
        { title: 'Fails in production', description: 'Broad scope makes it impossible to define clear boundaries, test thoroughly, or measure performance.' },
        { title: 'Mixed failure modes', description: 'When something breaks, it is unclear which responsibility the agent failed at.' },
        { title: 'Accountability diffusion', description: 'No one can name what the agent should and should not do.' },
      ],
      whenToUse: 'Avoid in production. May be acceptable for early exploration or shadow-mode experiments.',
    },
    {
      id: 'workflow-scoped',
      label: 'Workflow-Specific Agent',
      description: 'An agent tied to a specific responsibility with its own inputs, outputs, decision points, and failure modes.',
      metrics: { speed: -5, safety: 20, cost: -5, complexity: 15 },
      pros: [
        { title: 'Clear boundaries', description: 'Every input, output, and decision point is documented in the workflow map.' },
        { title: 'Testable', description: 'Narrow scope enables comprehensive testing of each decision path.' },
        { title: 'Measurable', description: 'Performance metrics are specific to the workflow, not diluted across tasks.' },
      ],
      cons: [
        { title: 'More agents to manage', description: 'Each workflow needs its own agent configuration and monitoring.' },
        { title: 'Handoff complexity', description: 'When work spans multiple workflows, handoffs between agents add coordination overhead.' },
      ],
      whyThisFits: 'Production-grade scoping ties each agent to a specific responsibility. This makes the agent\'s behavior reviewable, testable, and measurable — the foundation for everything else in the operating model.',
    },
  ],
}
