import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { frontendStep } from './frontend'
import { backendStep } from './backend'
import { databaseStep } from './database'

export const enterpriseWebScenario: TradeoffScenario = {
  id: 'enterprise-web',
  title: 'Enterprise Web Application',
  description: 'Build a scalable enterprise web app: React SPA, Node.js microservices, PostgreSQL, deployed on Cloud PaaS. Evaluate trade-offs across frontend, backend, and infrastructure decisions.',
  metrics: [
    { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'scalability', label: 'Scalability', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
    { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
  ],
  steps: [
    frontendStep,
    backendStep,
    databaseStep,
  ],
}
