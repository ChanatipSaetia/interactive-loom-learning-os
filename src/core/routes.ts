import type { SectionConfig } from './registry'
import { demoSections } from '../topics/demo/sections'
import { aiAgentSections } from '../topics/ai-agent/sections'
import { aiOperatingModelSections } from '../topics/ai-operating-model/sections'
import { agentopsSections } from '../topics/agentops/sections'
import { aiGovernanceSections } from '../topics/ai-governance/sections'
import { sellOnlineSections } from '../topics/sell-online-thai/sections'
import { shopeeBuyerSections } from '../topics/shopee-buyer-journey/sections'

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
    id: 'ai-agent',
    label: 'AI Agent Architecture',
    path: '/topics/ai-agent',
    category: 'Architecture',
    description: 'Explore AI Agent system architecture with LLM, tools, and memory',
    sections: aiAgentSections,
  },
  {
    id: 'ai-operating-model',
    label: 'AI Operating Model',
    path: '/topics/ai-operating-model',
    category: 'Governance',
    description: 'Design decisions, autonomy tiers, HITL oversight patterns, and production deployment controls for AI agents',
    sections: aiOperatingModelSections,
  },
  {
    id: 'agentops',
    label: 'AgentOps Framework',
    path: '/topics/agentops',
    category: 'Operations',
    description: 'Four-phase operational lifecycle for LLM agents: monitoring, anomaly detection, root cause analysis, and resolution',
    sections: agentopsSections,
  },
  {
    id: 'ai-governance',
    label: 'AI Governance',
    path: '/topics/ai-governance',
    category: 'Governance',
    description: 'Risk taxonomy, intervention categories, governance frameworks (OWASP, SAIF, ARC), and design decisions for autonomous AI systems',
    sections: aiGovernanceSections,
  },
   {
      id: 'sell-online-thai',
      label: 'ขายของออนไลน์',
      path: '/topics/sell-online-thai',
      category: 'E-Commerce',
      description: 'ออกแบบระบบขายของออนไลน์แบบครบวงจร: เลือกแพลตฟอร์ม โลจิสติกส์ การเงิน และการตลาด',
      sections: sellOnlineSections,
    },
    {
      id: 'shopee-buyer-journey',
      label: 'Shopee Buyer Journey',
      path: '/topics/shopee-buyer-journey',
      category: 'E-Commerce',
      description: 'เส้นทางการช้อปบน Shopee: ค้นหา เปรียบเทียบ สั่งซื้อ ชำระเงิน จัดส่ง และรีวิว',
      sections: shopeeBuyerSections,
    },
  ]
