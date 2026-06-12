import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { accountabilityJourney } from './journeys/accountability-flow'

export const accountabilitySchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [accountabilityJourney],
}
