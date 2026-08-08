import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PillarLayerSection } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/PillarLayerSection'
import { PillarLayerSectionSchema } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'
import type { PillarLayerSectionData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'

const mockSectionData: PillarLayerSectionData = {
  type: 'pillar-layer',
  title: 'Microservices Layer Architecture',
  description: 'System capabilities and foundational layer overview.',
  layers: [
    { id: 'l-channels', title: 'Channels & API Gateway' },
    { id: 'l-services', title: 'Microservices Tier' },
    { id: 'l-infra', title: 'Infrastructure Tier' },
  ],
  matrix_blocks: [
    {
      id: 'b-channels',
      title: 'Edge Channels & API Gateway',
      description: 'GraphQL and REST Edge endpoints.',
      layer_id: 'l-channels',
      col_span: 2,
      row_span: 1,
      color: 'teal',
    },
    {
      id: 'b-auth-service',
      title: 'OAuth2 Provider',
      description: 'Issues JWT tokens and validates user profiles.',
      layer_id: 'l-services',
      col_span: 1,
      row_span: 1,
      color: 'mauve',
    },
    {
      id: 'b-cross-cutting',
      title: 'Cross-Cutting IAM Controller',
      description: 'Spans logic and infra tiers.',
      layer_id: 'l-services',
      offsets: [
        [0, 1],
        [1, 1],
      ],
    },
    {
      id: 'b-infra-auth',
      title: 'Auth Key Vault',
      description: 'Manages signing keys.',
      layer_id: 'l-infra',
      col_span: 1,
      row_span: 1,
    },
  ],
}

describe('PillarLayer Section (Layer Stacked Architecture)', () => {
  it('parses valid section data with Zod schema', () => {
    const result = PillarLayerSectionSchema.safeParse(mockSectionData)
    expect(result.success).toBe(true)
  })

  it('renders grid container with correct gridTemplateColumns style', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const gridContainer = screen.getByTestId('pillar-layer-grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer.style.gridTemplateColumns).toBe(
      'minmax(160px, 200px) repeat(2, minmax(180px, 1fr))'
    )
  })

  it('renders multi-column spanning block across columns', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const block0 = screen.getByTestId('pillar-layer-block-0')
    expect(block0.style.gridColumnStart).toBe('2')
    expect(block0.style.gridColumnEnd).toBe('span 2')
    expect(block0.style.gridRowStart).toBe('2')
    expect(block0.style.gridRowEnd).toBe('span 1')
  })

  it('renders matrix block with 2D grid placement, row_span, and col_span', () => {
    render(<PillarLayerSection section={mockSectionData} />)

    const block1 = screen.getByTestId('pillar-layer-block-1')
    expect(block1.style.gridColumnStart).toBe('2')
    expect(block1.style.gridColumnEnd).toBe('span 1')
    expect(block1.style.gridRowStart).toBe('3')
    expect(block1.style.gridRowEnd).toBe('span 1')

    const block2 = screen.getByTestId('pillar-layer-block-2')
    expect(block2.style.gridColumnStart).toBe('3')
    expect(block2.style.gridRowStart).toBe('3')
    expect(block2.style.gridRowEnd).toBe('span 2')
  })

  it('highlights associated layer header on block mouse enter', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const block1 = screen.getByTestId('pillar-layer-block-1')
    const layerHeader = screen.getByTestId('layer-row-l-services')

    fireEvent.mouseEnter(block1)
    expect(layerHeader).toHaveClass('is-highlighted')

    fireEvent.mouseLeave(block1)
    expect(layerHeader).not.toHaveClass('is-highlighted')
  })

  it('opens help guide modal on trigger click', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.queryByTestId('pillar-layer-help-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('section-help-btn-0'))
    expect(screen.getByTestId('pillar-layer-help-modal')).toBeInTheDocument()
  })

  it('renders L-shaped block with shape property and clipPath polygon', () => {
    const lShapeSectionData: PillarLayerSectionData = {
      ...mockSectionData,
      matrix_blocks: [
        mockSectionData.matrix_blocks[0],
        {
          id: 'b-l-block',
          title: 'L-Shaped Microservice Controller',
          description: 'Spans bottom row and left column stem.',
          layer_id: 'l-services',
          col_span: 2,
          row_span: 2,
          shape: 'l-bottom-left',
          color: 'mauve',
        },
        {
          id: 'b-corner-piece',
          title: 'Corner Filler Service',
          description: 'Slots into the L-block cutout at top-right.',
          layer_id: 'l-services',
          offsets: [[0, 1]],
          color: 'green',
        },
      ],
    }

    const parseResult = PillarLayerSectionSchema.safeParse(lShapeSectionData)
    expect(parseResult.success).toBe(true)

    render(<PillarLayerSection section={lShapeSectionData} />)
    const lBlock = screen.getByTestId('pillar-layer-block-1')
    expect(lBlock).toHaveClass('shape-l-bottom-left')
    expect(lBlock.style.clipPath).toBe('polygon(0 0, 50% 0, 50% 50%, 100% 50%, 100% 100%, 0 100%)')
  })

  it('parses and renders block with Option C relative offsets [dr, dc]', () => {
    const offsetSectionData: PillarLayerSectionData = {
      ...mockSectionData,
      matrix_blocks: [
        mockSectionData.matrix_blocks[0],
        {
          id: 'b-offset-l-block',
          title: 'Offset-based L-Block',
          layer_id: 'l-services',
          offsets: [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
          color: 'peach',
        },
        {
          id: 'b-corner-piece',
          title: 'Corner Filler Service',
          layer_id: 'l-services',
          offsets: [[0, 1]],
        },
      ],
    }

    const parseResult = PillarLayerSectionSchema.safeParse(offsetSectionData)
    expect(parseResult.success).toBe(true)

    render(<PillarLayerSection section={offsetSectionData} />)
    const offsetBlock = screen.getByTestId('pillar-layer-block-1')
    expect(offsetBlock.style.clipPath).toBe('polygon(0 0, 50% 0, 50% 50%, 100% 50%, 100% 100%, 0 100%)')
  })
})
