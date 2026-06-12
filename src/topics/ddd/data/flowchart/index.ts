import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { dddDiscoveryJourney } from './journeys/ddd-discovery'
import { dddLayersJourney } from './journeys/ddd-layers'

export const dddSchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [
    dddDiscoveryJourney,
    dddLayersJourney,
  ]
}
