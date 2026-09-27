import type { SectionLayout } from '../../validation/types'
import { collection, singleFile } from '../../validation/layout'

export const TradeoffSandboxLayouts: Record<string, SectionLayout> = {
  'tradeoff-sandbox': collection('scenarios'),
  'formula-sandbox': singleFile('sandbox.yaml'),
  'decision-tree': singleFile('tree.yaml'),
}
