import type { FlowchartJourney } from '../../../../../../sections/flowchart'

export const accountabilityJourney: FlowchartJourney = {
  id: 'accountability-chain',
  label: 'Accountability Flow',
  description: 'Follow how accountability is structured through dual-key ownership and specialist oversight.',
  steps: [
    {
      nodeIds: ['business_owner', 'technical_owner'],
      description: 'Dual-Key Owners — The Business Owner defines purpose and risk appetite. The Technical Owner owns architecture and uptime.',
    },
    {
      nodeIds: ['dual_key'],
      description: 'Dual-Key Gate — Neither owner can act alone. Both must authorize changes to the agent\'s scope, authority, or deployment.',
    },
    {
      nodeIds: ['data_owner', 'model_oversight'],
      description: 'Specialist Functions — Data Owner governs source-of-truth quality. Model Oversight tracks drift and behavioral change. Both report to the dual-key owners.',
    },
    {
      nodeIds: ['agent_system'],
      description: 'Agent System — Operates under the governance of all four accountability roles.',
    },
  ],
}
