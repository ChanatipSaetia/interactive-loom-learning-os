import type { SectionConfig } from '../../core/registry'
import {
  agentNodes,
  agentEdges,
  agentJourneys,
  agentTextParagraphs,
  agentLifecycleMarkdown,
  agentCapabilityBullets,
  apiPatternSituations,
  tradeoffSandboxScenarios,
  taxonomyCategories,
} from './data'

export const demoSections: SectionConfig[] = [
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
      nodes: agentNodes,
      edges: agentEdges,
      journeys: agentJourneys,
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
    type: 'situation-choice',
    props: {
      title: 'Communication Pattern Choice',
      situations: apiPatternSituations,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Architecture Trade-off Sandbox',
      scenarios: tradeoffSandboxScenarios,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'AI Agent Capability Taxonomy',
      categories: taxonomyCategories,
    },
  },
]
