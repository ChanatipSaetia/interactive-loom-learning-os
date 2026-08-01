import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PillarLayerSection } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/PillarLayerSection'
import { PillarLayerSectionSchema } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'
import type { PillarLayerSectionData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'

const mockSectionData: PillarLayerSectionData = {
  type: 'pillar-layer',
  title: 'Microservices Architecture Matrix',
  description: 'System capabilities and foundational layer overview.',
  pillars: [
    { id: 'p-auth', title: 'Identity & Auth', subtitle: 'Security Pillar', color: 'blue' },
    { id: 'p-commerce', title: 'Commerce', subtitle: 'Domain Pillar', color: 'green' },
  ],
  layers: [
    {
      id: 'l-channels',
      title: 'Channels & API Gateway',
      span: 'full',
      blocks: [{ title: 'GraphQL Gateway' }, { title: 'REST Edge' }],
    },
    { id: 'l-services', title: 'Microservices Tier', span: 'matrix' },
    { id: 'l-infra', title: 'Infrastructure Tier', span: 'matrix' },
  ],
  matrix_blocks: [
    {
      id: 'b-auth-service',
      title: 'OAuth2 Provider',
      description: 'Issues JWT tokens and validates user profiles.',
      layer_id: 'l-services',
      pillar_id: 'p-auth',
      col_span: 1,
      row_span: 1,
      color: 'mauve',
      tags: ['OAuth2', 'Security'],
    },
    {
      id: 'b-cross-cutting',
      title: 'Cross-Cutting IAM Controller',
      description: 'Spans logic and infra tiers across commerce.',
      layer_id: 'l-services',
      pillar_id: 'p-commerce',
      col_span: 1,
      row_span: 2,
    },
    {
      id: 'b-infra-auth',
      title: 'Auth Key Vault',
      description: 'Manages signing keys.',
      layer_id: 'l-infra',
      pillar_id: 'p-auth',
      col_span: 1,
      row_span: 1,
    },
  ],
}

describe('PillarLayer Section (2D CSS Grid Layout Engine & UX)', () => {
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

  it('renders full-width spanning layer across all columns', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const fullWidthLayer = screen.getByTestId('full-width-layer-l-channels')
    expect(fullWidthLayer).toBeInTheDocument()
    expect(fullWidthLayer.style.gridColumnStart).toBe('2')
    expect(fullWidthLayer.style.gridColumnEnd).toBe('4')
    expect(screen.getByText('GraphQL Gateway')).toBeInTheDocument()
    expect(screen.getByText('REST Edge')).toBeInTheDocument()
  })

  it('renders matrix block with 2D grid placement, row_span, and col_span', () => {
    render(<PillarLayerSection section={mockSectionData} />)

    const block0 = screen.getByTestId('pillar-layer-block-0')
    expect(block0.style.gridColumnStart).toBe('2')
    expect(block0.style.gridColumnEnd).toBe('span 1')
    expect(block0.style.gridRowStart).toBe('3')
    expect(block0.style.gridRowEnd).toBe('span 1')

    const block1 = screen.getByTestId('pillar-layer-block-1')
    expect(block1.style.gridColumnStart).toBe('3')
    expect(block1.style.gridRowStart).toBe('3')
    expect(block1.style.gridRowEnd).toBe('span 2')
  })

  it('highlights associated pillar and layer headers on block mouse enter', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const block0 = screen.getByTestId('pillar-layer-block-0')
    const pillarHeader = screen.getByTestId('pillar-header-p-auth')
    const layerHeader = screen.getByTestId('layer-row-l-services')

    fireEvent.mouseEnter(block0)
    expect(pillarHeader).toHaveClass('is-highlighted')
    expect(layerHeader).toHaveClass('is-highlighted')

    fireEvent.mouseLeave(block0)
    expect(pillarHeader).not.toHaveClass('is-highlighted')
    expect(layerHeader).not.toHaveClass('is-highlighted')
  })

  it('opens block detail modal drawer on click', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.queryByTestId('pillar-layer-block-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('pillar-layer-block-0'))
    expect(screen.getByTestId('pillar-layer-block-dialog')).toBeInTheDocument()
    expect(screen.getAllByText('OAuth2 Provider').length).toBe(2)
    expect(screen.getAllByText('Issues JWT tokens and validates user profiles.').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Pillar: Identity & Auth')).toBeInTheDocument()
    expect(screen.getByText('Layer: Microservices Tier')).toBeInTheDocument()
  })

  it('closes block detail modal drawer on close button click', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    fireEvent.click(screen.getByTestId('pillar-layer-block-0'))
    expect(screen.getByTestId('pillar-layer-block-dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('pillar-layer-block-dialog-close'))
    expect(screen.queryByTestId('pillar-layer-block-dialog')).not.toBeInTheDocument()
  })

  it('opens help guide modal on trigger click', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.queryByTestId('pillar-layer-help-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('section-help-btn-0'))
    expect(screen.getByTestId('pillar-layer-help-modal')).toBeInTheDocument()
  })
})
