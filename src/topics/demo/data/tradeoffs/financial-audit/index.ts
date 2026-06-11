import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { uiStep } from './ui'
import { backendStep } from './backend'
import { deploymentStep } from './deployment'

export const financialAuditScenario: TradeoffScenario = {
  id: 'financial-audit',
  title: 'High-Security Financial Auditing Platform',
  description: 'Build a compliance-critical auditing system: Angular frontend, Java monolith, PostgreSQL, deployed on-premise. Prioritize security, auditability, and regulatory compliance.',
  metrics: [
    { id: 'security', label: 'Security', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'compliance', label: 'Compliance', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'maintainability', label: 'Maintainability', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'time-market', label: 'Time to Market', baseValue: 40, min: 0, max: 100, direction: 'higher' },
  ],
  steps: [
    uiStep,
    backendStep,
    deploymentStep,
  ],
}
