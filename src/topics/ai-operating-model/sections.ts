import type { SectionConfig } from '../../core/registry'
import {
  introParagraphs,
  workflowMapParagraphs,
  dataContextParagraphs,
  runtimeControlsParagraphs,
  accountabilityParagraphs,
  autonomyTierBullets,
  readinessChecklist,
} from './data/text'
import { designDecisionCategories, memoryTypeCategories } from './data/taxonomy'
import { operatingModelScenarios } from './data/tradeoffs'
import { runtimeControlsSchema, accountabilitySchema } from './data/flowchart'

export const aiOperatingModelSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is an AI Operating Model?',
      heading: 'Working Specification for Human-Agent Work',
      paragraphs: introParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Six Design Decisions',
      categories: designDecisionCategories,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Decision 1 — Workflow Map',
      paragraphs: workflowMapParagraphs,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Decision 2 — Data and Context',
      paragraphs: dataContextParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Agent Memory Types',
      categories: memoryTypeCategories,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Autonomy Tiers',
      ordered: true,
      items: autonomyTierBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Scope and Authority Decisions',
      scenarios: operatingModelScenarios,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Decision 4 — Runtime Controls',
      paragraphs: runtimeControlsParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Runtime Control Defense Layers',
      schema: runtimeControlsSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Decision 6 — Accountability',
      paragraphs: accountabilityParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Accountability Roles',
      schema: accountabilitySchema,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'CEO/CTO Readiness Filter',
      ordered: false,
      items: readinessChecklist,
    },
  },
]
