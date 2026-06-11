import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const deploymentStep: TradeoffStep = {
  id: 'deployment',
  title: 'Deployment Strategy',
  description: 'Choose where and how to deploy the platform.',
  recommended: 'on-premise',
  choices: [
    {
      id: 'on-premise',
      label: 'On-Premise',
      description: 'Deploy within the organization data center for full data control.',
      metrics: { security: 25, compliance: 25, maintainability: -10, 'time-market': -15 },
      pros: [
        { title: 'Data sovereignty', description: 'All data stays within organizational control' },
        { title: 'Regulatory compliance', description: 'Meets strictest on-prem requirements' },
        { title: 'No vendor lock-in', description: 'Own infrastructure, no external dependency' },
      ],
      cons: [
        { title: 'Infrastructure cost', description: 'Hardware, power, cooling, and staff' },
        { title: 'Manual patching', description: 'Security updates require planned windows' },
        { title: 'Longer deployment', description: 'Physical setup and configuration time' },
      ],
      whyThisFits: 'Financial auditing platforms often face strictest regulatory requirements. On-premise deployment ensures data sovereignty and meets the most stringent compliance standards without third-party cloud dependencies.',
    },
    {
      id: 'private-cloud',
      label: 'Private Cloud (AWS Outposts)',
      description: 'Cloud-managed hardware within organizational data center.',
      metrics: { security: 15, compliance: 15, maintainability: 10, 'time-market': 10 },
      pros: [
        { title: 'Cloud tools on-prem', description: 'Same AWS APIs with local data' },
        { title: 'Automated patching', description: 'Managed hardware updates' },
        { title: 'Faster provisioning', description: 'Software-defined infrastructure' },
      ],
      cons: [
        { title: 'AWS dependency', description: 'Still tied to AWS ecosystem and pricing' },
        { title: 'Minimum hardware', description: 'Outposts require minimum rack commitment' },
      ],
      whenToUse: 'A good compromise when the organization wants cloud tooling and automation while maintaining physical data control.',
    },
  ],
}
