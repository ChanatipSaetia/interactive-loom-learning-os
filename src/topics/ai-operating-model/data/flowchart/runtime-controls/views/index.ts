import type { UnifiedFlowchartSchema } from '../../../../../../sections/flowchart'
import { sysArchView } from './sys-arch'
import { eventStormingView } from './event-storming'

export const views: UnifiedFlowchartSchema['views'] = {
  SYS_ARCH: sysArchView,
  EVENT_STORMING: eventStormingView,
}
