import type { SectionConfig } from '../../core/registry'
import {
  agentNodes,
  agentEdges,
  agentJourneys,
  agentTextParagraphs,
  agentLifecycleMarkdown,
  agentCapabilityBullets,
  orchestrationChoices,
  agentDragItems,
  agentDragZones,
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
    type: 'drag-drop',
    props: {
      title: 'Match Component to Layer',
      items: agentDragItems,
      zones: agentDragZones,
    },
  },
  {
    type: 'choice',
    props: {
      title: 'Orchestration Strategy',
      options: orchestrationChoices,
    },
  },
]
