import type { SectionLayout } from '../../validation/types'
import { singleFile } from '../../validation/layout'

export const ReflectionSynthesisLayouts: Record<string, SectionLayout> = {
  'reflection-sequence': singleFile('sequence.yaml'),
  'reflection-template': singleFile('template.yaml'),
}
