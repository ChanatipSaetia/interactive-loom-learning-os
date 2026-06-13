import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { taskFlowJourney } from './journeys/task-flow'
import { streamFlowJourney } from './journeys/stream-flow'

export const a2aTaskLifecycleSchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [taskFlowJourney, streamFlowJourney],
}
