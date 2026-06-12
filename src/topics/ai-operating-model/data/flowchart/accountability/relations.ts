import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  { id: 'r1', from: 'business_owner', to: 'dual_key', views: ['SYS_ARCH'] },
  { id: 'r2', from: 'technical_owner', to: 'dual_key', views: ['SYS_ARCH'] },
  { id: 'r3', from: 'dual_key', to: 'agent_system', views: ['SYS_ARCH'] },
  { id: 'r4', from: 'data_owner', to: 'dual_key', views: ['SYS_ARCH'], dashed: true },
  { id: 'r5', from: 'model_oversight', to: 'dual_key', views: ['SYS_ARCH'], dashed: true },
  { id: 'r6', from: 'data_owner', to: 'agent_system', views: ['SYS_ARCH'], dashed: true },
  { id: 'r7', from: 'model_oversight', to: 'agent_system', views: ['SYS_ARCH'], dashed: true },
]
