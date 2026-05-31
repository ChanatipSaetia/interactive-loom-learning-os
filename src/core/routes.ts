import type { SectionConfig } from './registry'
import { demoSections } from '../topics/demo/sections'
import { aiAgentSections } from '../topics/ai-agent/sections'

export interface TopicRoute {
  id: string
  label: string
  path: string
  category: string
  description: string
  sections: SectionConfig[]
}

export const routes: TopicRoute[] = [
  {
    id: 'demo',
    label: 'REST API vs WebSocket',
    path: '/demo/rest-vs-websocket',
    category: 'Architecture',
    description: 'Compare REST API and WebSocket communication patterns',
    sections: demoSections,
  },
  {
    id: 'ai-agent',
    label: 'AI Agent Architecture',
    path: '/topics/ai-agent',
    category: 'Architecture',
    description: 'Explore AI Agent system architecture with LLM, tools, and memory',
    sections: aiAgentSections,
  },
]
