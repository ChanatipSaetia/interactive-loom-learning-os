import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  business_owner: {
    title: 'Business Owner',
    desc: 'Owns the workflow\'s business purpose and risk appetite.',
    viewTypes: { SYS_ARCH: TYPES.USER },
  },
  technical_owner: {
    title: 'Technical Owner',
    desc: 'Owns architecture, integrations, deployment, and uptime.',
    viewTypes: { SYS_ARCH: TYPES.USER },
  },
  dual_key: {
    title: 'Dual-Key Gate',
    desc: 'Neither owner can act alone. Both must authorize changes.',
    viewTypes: { SYS_ARCH: TYPES.DECISION },
  },
  data_owner: {
    title: 'Data Owner',
    desc: 'Source-of-truth governance for data sources.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  model_oversight: {
    title: 'Model Oversight',
    desc: 'Tracks drift, bias, and behavioral change over time.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  agent_system: {
    title: 'Agent System',
    desc: 'The deployed agent under accountability governance.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
}
