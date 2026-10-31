import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { compileOUINarration } from '../../../../src/core/learning-engine/composition/oui/compile'
import PresentFlowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/PresentFlowchart'
import type { FlowchartPresentData } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/present'

vi.mock('../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart', () => ({
  Flowchart: ({ present }: { present: { view?: string; step: number } }) => <div data-testid="flowchart-props">{present.view ?? 'default'}:{present.step}</div>,
}))

describe('flowchart narration views', () => {
  it('compiles multiple views on one journey beat and passes the active view to the renderer', () => {
    const result = compileOUINarration(`root = Narration([a, b])
a = NarrationStep("step1", "Start with systems.", null, "architecture")
b = NarrationStep("step1", "Then follow messages.", null, "sequence")`)
    expect(result.value?.steps.map((step) => step.view)).toEqual(['architecture', 'sequence'])
    const steps = result.value!.steps
    const data = {} as FlowchartPresentData
    const props = { data, beats: [], beat: 1, sectionIndex: 0, active: true }
    const { rerender } = render(<PresentFlowchart {...props} narrationStep={steps[0]} />)
    expect(screen.getByTestId('flowchart-props')).toHaveTextContent('architecture:')
    rerender(<PresentFlowchart {...props} narrationStep={steps[1]} />)
    expect(screen.getByTestId('flowchart-props')).toHaveTextContent('sequence:')
    rerender(<PresentFlowchart {...props} />)
    expect(screen.getByTestId('flowchart-props')).toHaveTextContent('default:')
  })
})
