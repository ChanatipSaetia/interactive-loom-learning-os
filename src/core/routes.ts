import type { SectionConfig } from './registry'
import { demoSections } from '../topics/demo/sections'
import { aiOperatingModelSections } from '../topics/ai-operating-model/sections'
import { dddSections } from '../topics/ddd/sections'

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
    label: 'AI Agent Architecture (Demo)',
    path: '/demo/ai-agent',
    category: 'Architecture',
    description: 'Explore AI Agent system architecture with LLM, tools, and memory',
    sections: demoSections,
  },
  {
    id: 'ai-operating-model',
    label: 'AI Operating Model',
    path: '/topics/ai-operating-model',
    category: 'Governance',
    description: 'Six design decisions for deploying AI agents: workflow map, data/context, scope/authority, runtime controls, measurement, and accountability',
    sections: aiOperatingModelSections,
  },
  {
    id: 'ddd',
    label: 'Domain-Driven Design',
    path: '/topics/ddd',
    category: 'Architecture',
    description: 'Strategic and tactical patterns for modeling complex business domains: bounded contexts, aggregates, ubiquitous language, and context mapping',
    sections: dddSections,
  },
]
