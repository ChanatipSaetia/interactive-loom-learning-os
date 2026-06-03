import type { SectionConfig } from '../../core/registry'
import {
  agentopsNodes,
  agentopsEdges,
  agentopsJourneys,
  agentopsIntroParagraphs,
  agentopsEvolutionParagraphs,
  anomalyTaxonomyBullets,
  rcaStrategiesBullets,
  opsComparisonBullets,
  agentopsSituations,
} from './data'

export const agentopsSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'The Problem',
      heading: 'Agents in Production Need an Operational Framework',
      paragraphs: agentopsIntroParagraphs,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Evolution of Operations',
      paragraphs: agentopsEvolutionParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'AgentOps Four-Phase Lifecycle',
      nodes: agentopsNodes,
      edges: agentopsEdges,
      journeys: agentopsJourneys,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Anomaly Taxonomy',
      ordered: false,
      items: anomalyTaxonomyBullets,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Root Cause Analysis Strategies',
      ordered: false,
      items: rcaStrategiesBullets,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'How AgentOps Differs from Traditional Ops',
      ordered: false,
      items: opsComparisonBullets,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'AgentOps Design Decisions',
      situations: agentopsSituations,
    },
  },
]
