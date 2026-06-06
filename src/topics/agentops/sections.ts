import type { SectionConfig } from '../../core/registry'
import {
  agentopsSchema,
  agentopsIntroParagraphs,
  agentopsEvolutionParagraphs,
  anomalyTaxonomyBullets,
  rcaStrategiesBullets,
  opsComparisonBullets,
  agentopsScenarios,
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
      schema: agentopsSchema,
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
    type: 'tradeoff-sandbox',
    props: {
      title: 'AgentOps Design Decisions',
      scenarios: agentopsScenarios,
    },
  },
]
