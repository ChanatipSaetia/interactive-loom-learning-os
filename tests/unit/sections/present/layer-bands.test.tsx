import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import PresentPillarLayer from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/pillar-layer/PresentPillarLayer'
import { pillarLayerBeats, type PillarLayerPresentData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'

const data: PillarLayerPresentData = { section: {
  type: 'pillar-layer', title: 'Network', description: 'Long introductory description',
  layers: [{ id: 'app', title: 'Application', description: 'Application detail' }, { id: 'transport', title: 'Transport' }],
  matrix_blocks: [{ id: 'http', title: 'HTTP', layer_id: 'app', description: 'HTTP details', depends_on: ['tcp'] }, { id: 'tcp', title: 'TCP', layer_id: 'transport' }],
} }

describe('presentation layer bands', () => {
  it('gives peer groups separate outer boxes on the same level', () => {
    const grouped: PillarLayerPresentData = { section: {
      type: 'pillar-layer', title: 'Capabilities', layers: [{ id: 'cap', title: 'Capabilities' }],
      matrix_blocks: [
        { id: 'tool', title: 'Tool Execution', layer_id: 'cap', group: 'Tools' },
        { id: 'api', title: 'APIs', layer_id: 'cap', col_offset: 1, group: 'Tools' },
        { id: 'search', title: 'Retrieval', layer_id: 'cap', col_offset: 2, group: 'Knowledge' },
      ],
    } }
    const { container, rerender } = render(<PresentPillarLayer data={grouped} beat={0} beats={pillarLayerBeats(grouped)} sectionIndex={0} active />)
    const levels = container.querySelectorAll('.present-layer-level')
    expect(levels).toHaveLength(1)
    const boxes = levels[0].querySelectorAll('.present-layer-band')
    expect(boxes).toHaveLength(2)
    expect(boxes[0]).toHaveTextContent('ToolsTool ExecutionAPIs')
    expect(boxes[0]).not.toHaveTextContent('Retrieval')
    expect(boxes[1]).toHaveTextContent('KnowledgeRetrieval')
    expect(boxes[0]).toHaveAttribute('data-shown')
    expect(boxes[0]).toHaveAttribute('data-focus')
    expect(boxes[1]).not.toHaveAttribute('data-shown')
    expect(beatSpeech(container, 0).map((part) => part.text).join(' ')).not.toContain('Retrieval')
    expect(pillarLayerBeats(grouped).map((b) => b.id)).toEqual(['layer1', 'layer1.group2', 'overview'])
    rerender(<PresentPillarLayer data={grouped} beat={1} beats={pillarLayerBeats(grouped)} sectionIndex={0} active />)
    expect(boxes[0]).toHaveAttribute('data-shown')
    expect(boxes[0]).not.toHaveAttribute('data-focus')
    expect(boxes[1]).toHaveAttribute('data-shown')
    expect(boxes[1]).toHaveAttribute('data-focus')
    const speech = beatSpeech(container, 1).map((part) => part.text).join(' ')
    expect(speech).toContain('Retrieval')
    expect(speech).not.toContain('Tool Execution')
    rerender(<PresentPillarLayer data={grouped} beat={2} beats={pillarLayerBeats(grouped)} sectionIndex={0} active />)
    expect(container.querySelectorAll('.present-layer-band[data-shown]')).toHaveLength(2)
    expect(container.querySelectorAll('.present-layer-band.is-current')).toHaveLength(0)
    expect(container.querySelector('[data-testid="present-pillar-layer"]')).toHaveAttribute('data-focus')
    rerender(<PresentPillarLayer data={grouped} beat={0} beats={pillarLayerBeats(grouped)} sectionIndex={0} active />)
    expect(boxes[1]).not.toHaveAttribute('data-shown')
  })
  it('nests items inside their layer and keeps the presentation names-only', () => {
    const { container, rerender } = render(<PresentPillarLayer data={data} beat={0} beats={pillarLayerBeats(data)} sectionIndex={0} active />)
    const bands = container.querySelectorAll('.present-layer-band')
    expect(bands).toHaveLength(2)
    expect(bands[0]).toHaveTextContent('Application')
    expect(bands[0]).toHaveTextContent('HTTP')
    expect(bands[0]).not.toHaveTextContent('TCP')
    expect(bands[1]).toHaveAttribute('data-shown')
    expect(bands[0]).not.toHaveAttribute('data-shown')
    expect(container.textContent).not.toContain('detail')
    expect(container.textContent).not.toContain('Long introductory')
    rerender(<PresentPillarLayer data={data} beat={1} beats={pillarLayerBeats(data)} sectionIndex={0} active />)
    expect(container.querySelectorAll('.present-layer-band[data-shown]')).toHaveLength(2)
  })
})
