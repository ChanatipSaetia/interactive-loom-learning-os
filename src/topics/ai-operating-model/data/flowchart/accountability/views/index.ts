import type { UnifiedFlowchartSchema } from '../../../../../../sections/flowchart'
import { sysArchView } from './sys-arch'

export const views: UnifiedFlowchartSchema['views'] = {
  SYS_ARCH: sysArchView,
}
