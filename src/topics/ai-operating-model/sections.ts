import type { SectionConfig } from '../../core/registry'
import {
  introTextParagraphs,
  sixDecisionsBullets,
  operatingModelScenarios,
  operatingModelSchema,
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
      schema: operatingModelSchema,
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
