import type { SectionConfig } from '../../core/registry'
import {
  introTextParagraphs,
  sixDecisionsBullets,
  autonomyTierSituations,
  hitlPatternSituations,
  governanceArchSituations,
  productionReadinessSituations,
  operatingModelNodes,
  operatingModelEdges,
  operatingModelJourneys,
} from './data'

export const aiOperatingModelSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is an AI Operating Model?',
      heading: 'A Working Specification for AI Agents in Production',
      paragraphs: introTextParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'AI Operating Model — Request Flow',
      nodes: operatingModelNodes,
      edges: operatingModelEdges,
      journeys: operatingModelJourneys,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'The Six Design Decisions',
      ordered: true,
      items: sixDecisionsBullets,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'Autonomy Tier Decision',
      situations: autonomyTierSituations,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'Human-in-the-Loop Oversight Pattern',
      situations: hitlPatternSituations,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'Governance Architecture',
      situations: governanceArchSituations,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'Production Deployment Readiness',
      situations: productionReadinessSituations,
    },
  },
]
