import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { happyPathJourney } from './journeys/happy-path'
import { humanEscalationJourney } from './journeys/human-escalation'

export const agentSchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [happyPathJourney, humanEscalationJourney]
}
