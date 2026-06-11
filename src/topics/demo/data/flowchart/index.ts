import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { happyPathJourney } from './journeys/happy-path'

export const agentSchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [happyPathJourney]
}
