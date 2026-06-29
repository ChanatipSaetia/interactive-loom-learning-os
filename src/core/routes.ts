import type { SectionConfig } from './registry'
import { demoSections } from '../topics/demo/sections'
import { motorcycleSections } from '../topics/motorcycle/sections'
import { haystackSections } from '../topics/haystack/sections'

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
    id: 'motorcycle',
    label: 'คู่มือผู้ใช้มอเตอร์ไซค์ (Motorcycle Guide)',
    path: '/topics/motorcycle',
    category: 'Mechanical',
    description: 'เรียนรู้การทำงาน การบำรุงรักษา และการแก้ปัญหาเบื้องต้นของรถมอเตอร์ไซค์',
    sections: motorcycleSections,
  },
  {
    id: 'haystack',
    label: 'Haystack 2.x - AI Search Framework',
    path: '/topics/haystack',
    category: 'Architecture',
    description: 'Build modern search applications with LLMs using pipelines, components, and document stores',
    sections: haystackSections,
  },
 ]
