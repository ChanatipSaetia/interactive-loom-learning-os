import type { SectionConfig } from '../../core/registry'
import {
  introParagraphs,
  howA2aWorksParagraphs,
  a2uiIntroParagraphs,
} from './data/text'
import { agenticStackCategories, a2aDataModelCategories } from './data/taxonomy'
import { a2aTaskLifecycleSchema } from './data/flowchart'
import { protocolChoiceScenario } from './data/tradeoffs'

export const a2aA2uiSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'Introduction',
      heading: 'Agent-to-Agent and Agent-to-UI Protocols',
      paragraphs: introParagraphs,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'The Agentic Protocols Stack',
      categories: agenticStackCategories,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'A2A Data Model',
      categories: a2aDataModelCategories,
    },
  },
  {
    type: 'text',
    props: {
      title: 'How A2A Works',
      paragraphs: howA2aWorksParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'A2A Task Lifecycle',
      schema: a2aTaskLifecycleSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'A2UI: Generative UI from Agents',
      paragraphs: a2uiIntroParagraphs,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Protocol Choice',
      scenarios: [protocolChoiceScenario],
    },
  },
]
