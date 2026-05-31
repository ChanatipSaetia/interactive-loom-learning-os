import type { SectionConfig } from '../../core/registry'
import { aiAgentNodes, aiAgentEdges } from './data'

export const aiAgentSections: SectionConfig[] = [
  {
    type: 'flowchart',
    props: {
      title: 'AI Agent Architecture',
      nodes: aiAgentNodes,
      edges: aiAgentEdges,
    },
  },
]
