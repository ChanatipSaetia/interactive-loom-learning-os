import type { SectionConfig } from '../../core/registry'
import {
  restNodes,
  restEdges,
  wsNodes,
  wsEdges,
  flowPaths,
  textParagraphs,
  bulletItems,
  restLifecycleSteps,
  dragItems,
  dragZones,
  choiceOptions,
} from './data'

export const demoSections: SectionConfig[] = [
  {
    type: 'architecture-flow',
    props: {
      title: 'REST API Architecture',
      nodes: restNodes,
      edges: restEdges,
    },
  },
  {
    type: 'architecture-flow',
    props: {
      title: 'WebSocket Architecture',
      nodes: wsNodes,
      edges: wsEdges,
    },
  },
  {
    type: 'data-flow',
    props: {
      title: 'Data Flow Patterns',
      paths: flowPaths,
      particleColor: '#ff7759',
    },
  },
  {
    type: 'text',
    props: {
      title: 'What is REST?',
      heading: 'Representational State Transfer',
      paragraphs: textParagraphs,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'HTTP Methods',
      ordered: false,
      items: bulletItems,
    },
  },
  {
    type: 'step-by-step',
    props: {
      title: 'REST Lifecycle',
      steps: restLifecycleSteps,
    },
  },
  {
    type: 'drag-drop',
    props: {
      title: 'Categorize Communication Patterns',
      items: dragItems,
      zones: dragZones,
    },
  },
  {
    type: 'choice',
    props: {
      title: 'REST API vs WebSocket',
      options: choiceOptions,
    },
  },
]
