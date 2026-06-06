import type { SectionConfig } from '../../core/registry'
import {
  introTextParagraphs,
  sixDecisionsBullets,
  operatingModelScenarios,
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
    type: 'tradeoff-sandbox',
    props: {
      title: 'AI Operating Model Design Decisions',
      scenarios: operatingModelScenarios,
    },
  },
]
