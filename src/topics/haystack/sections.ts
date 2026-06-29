import type { SectionConfig } from '../../core/registry'
import {
  HAYSTACK_VOCABULARY,
  haystackIntroParagraphs,
  haystackCoreParagraphs,
  haystackCapabilityBullets,
  indexingSchema,
  querySchema,
  HAYSTACK_TAXONOMY,
  haystackTradeoffScenario,
} from './data'

export const haystackSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is Haystack?',
      heading: 'Open-Source AI Search Framework',
      paragraphs: haystackIntroParagraphs,
    },
  },
  {
    type: 'flashcards',
    props: {
      terms: HAYSTACK_VOCABULARY,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Core Concepts',
      paragraphs: haystackCoreParagraphs,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Key Capabilities',
      ordered: false,
      items: haystackCapabilityBullets,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Indexing Pipeline',
      schema: indexingSchema,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Query Pipeline (RAG)',
      schema: querySchema,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Haystack Architecture Taxonomy',
      categories: HAYSTACK_TAXONOMY,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Architecture Trade-off Sandbox',
      scenarios: [haystackTradeoffScenario],
    },
  },
]
