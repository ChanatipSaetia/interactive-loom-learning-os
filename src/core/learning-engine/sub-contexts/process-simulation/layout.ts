import type { SectionLayout } from '../../validation/types'
import { fixedFiles, singleFile } from '../../validation/layout'

export const ProcessSimulationLayouts: Record<string, SectionLayout> = {
  flowchart: fixedFiles('flow', {
    actors: 'actors.yaml',
    systems: 'systems.yaml',
    steps: 'steps.yaml',
    journeys: 'journeys.yaml',
  }),
  scenario: singleFile('scenarios.yaml'),
}
