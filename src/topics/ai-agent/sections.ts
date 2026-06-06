import type { SectionConfig } from '../../core/registry'
import {
  aiAgentSchema,
  aiAgentScenarios,
} from './data'
import {
  agentTextParagraphs,
  agentLifecycleMarkdown,
  agentCapabilityBullets,
} from '../demo/data'

export const aiAgentSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is an AI Agent?',
      heading: 'Autonomous Goal-Directed Systems',
      paragraphs: agentTextParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'AI Agent Architecture',
      schema: aiAgentSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Agent Lifecycle',
      paragraphs: agentLifecycleMarkdown,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Key Agent Capabilities',
      ordered: false,
      items: agentCapabilityBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'AI Agent Design Decisions',
      scenarios: aiAgentScenarios,
    },
  },
]
