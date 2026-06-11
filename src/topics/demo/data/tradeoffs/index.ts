import type { TradeoffScenario } from '../../../../sections/tradeoff-sandbox'
import { apiPatternScenario } from './api-pattern'
import { enterpriseWebScenario } from './enterprise-web'
import { realtimeChatScenario } from './realtime-chat'
import { financialAuditScenario } from './financial-audit'

export const apiPatternScenarios: TradeoffScenario[] = [
  apiPatternScenario
]

export const tradeoffSandboxScenarios: TradeoffScenario[] = [
  enterpriseWebScenario,
  realtimeChatScenario,
  financialAuditScenario
]
