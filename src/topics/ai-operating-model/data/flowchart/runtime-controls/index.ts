import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { defenseJourney } from './journeys/defense-flow'
import { workflowExecutionJourney, incidentResponseJourney } from './journeys/incident-response'

export const runtimeControlsSchema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [defenseJourney, workflowExecutionJourney, incidentResponseJourney],
}
