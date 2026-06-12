import type { SectionConfig } from '../../core/registry'
import {
  introParagraphs,
  twoLayersParagraphs,
  subdomainParagraphs,
  antiPatternBullets,
  decisionGuideParagraphs,
  entityVsVoParagraphs,
  aggregateRulesParagraphs,
  splitSignalParagraphs,
  dddAndBeyondParagraphs,
} from './data/text'
import {
  tacticalBlockCategories,
  contextMappingCategories,
  subdomainCategories,
  scenariosCategories,
} from './data/taxonomy'
import { dddSchema } from './data/flowchart'
import { dddScenarios } from './data/tradeoffs'

export const dddSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is DDD?',
      heading: 'Domain-Driven Design',
      paragraphs: introParagraphs,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Strategic vs Tactical Design',
      paragraphs: twoLayersParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Tactical Building Blocks',
      categories: tacticalBlockCategories,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Entity vs Value Object',
      paragraphs: entityVsVoParagraphs,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Subdomain Classification',
      paragraphs: subdomainParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Subdomain Types',
      categories: subdomainCategories,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Split Signal — Bounded Contexts',
      paragraphs: splitSignalParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Context Mapping Patterns',
      categories: contextMappingCategories,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'DDD Discovery and Layers',
      schema: dddSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Aggregate Design Rules',
      paragraphs: aggregateRulesParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Practice Scenarios',
      categories: scenariosCategories,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'DDD Anti-Patterns',
      ordered: false,
      items: antiPatternBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Architecture Decisions',
      scenarios: dddScenarios,
    },
  },
  {
    type: 'text',
    props: {
      title: 'DDD Beyond OOP',
      paragraphs: dddAndBeyondParagraphs,
    },
  },
  {
    type: 'text',
    props: {
      title: 'When to Use DDD',
      paragraphs: decisionGuideParagraphs,
    },
  },
]
