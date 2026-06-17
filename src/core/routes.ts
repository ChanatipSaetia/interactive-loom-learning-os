import type { SectionConfig } from './registry'
import { demoSections } from '../topics/demo/sections'
import { aiOperatingModelSections } from '../topics/ai-operating-model/sections'
import { dddSections } from '../topics/ddd/sections'
import { a2aA2uiSections } from '../topics/a2a-a2ui/sections'
import { docPipelineSections } from '../topics/doc-pipeline/sections'
import { ecommerceOrdersSections } from '../topics/ecommerce-orders/sections'

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
  {
    id: 'a2a-a2ui',
    label: 'A2A & A2UI Protocols',
    path: '/topics/a2a-a2ui',
    category: 'AI Protocols',
    description: 'Agent-to-Agent (A2A) and Agent-to-UI (A2UI) protocols for interoperable AI agent communication and generative UI',
    sections: a2aA2uiSections,
  },
  {
    id: 'doc-pipeline',
    label: 'AI Document Ingestion Pipeline',
    path: '/topics/doc-pipeline',
    category: 'Architecture',
    description: 'AI-driven document processing with OCR extraction, LLM validation, confidence-based routing, and human audit loop',
    sections: docPipelineSections,
  },
  {
    id: 'ecommerce-orders',
    label: 'E-Commerce Order Processing',
    path: '/topics/ecommerce-orders',
    category: 'Architecture',
    description: 'Automated order processing with inventory lock, Stripe payment authorization, fraud detection, and risk analyst review gates',
    sections: ecommerceOrdersSections,
  },
 ]
