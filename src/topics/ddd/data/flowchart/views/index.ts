import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'
import { eventStormingView } from './event-storming'
import { sysArchView } from './sys-arch'

export const views: UnifiedFlowchartSchema['views'] = {
  EVENT_STORMING: eventStormingView,
  SYS_ARCH: sysArchView,
}
