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
    expect(PillarLayerSectionSchema.safeParse(mockSectionData).success).toBe(true)
  })

  it('renders each layer header followed by its blocks', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const grid = screen.getByTestId('pillar-layer-grid')
    const order = [...grid.children].map((el) => el.getAttribute('data-testid'))
    expect(order).toEqual([
      'layer-row-l-channels',
      'pillar-layer-block-0',
      'layer-row-l-services',
      'pillar-layer-block-1',
      'pillar-layer-block-2',
      'layer-row-l-infra',
      'pillar-layer-block-3',
    ])
    expect(grid.style.getPropertyValue('--pillar-cols')).toBe('2')
  })

  it('places blocks by layer row and column for the wide layout', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const block0 = screen.getByTestId('pillar-layer-block-0')
    expect(block0.style.getPropertyValue('--row')).toBe('1')
    expect(block0.style.getPropertyValue('--col')).toBe('2')
    expect(block0.style.getPropertyValue('--col-span')).toBe('2')
    expect(block0.classList.contains('is-wide')).toBe(true)
  })

  it('derives row and column spans from relative offsets', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    const block2 = screen.getByTestId('pillar-layer-block-2')
    expect(block2.style.getPropertyValue('--row')).toBe('2')
    expect(block2.style.getPropertyValue('--row-span')).toBe('2')
    expect(block2.style.getPropertyValue('--col')).toBe('3')
  })

  it('applies the block colour class', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.getByTestId('pillar-layer-block-0').classList.contains('color-teal')).toBe(true)
  })

  it('opens help guide modal on trigger click', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.queryByTestId('pillar-layer-help-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('section-help-btn-0'))
    expect(screen.getByTestId('pillar-layer-help-modal')).toBeInTheDocument()
  })

  it('clips an L-shaped block with a polygon', () => {
    const data: PillarLayerSectionData = {
      ...mockSectionData,
      matrix_blocks: [
        { id: 'b-l', title: 'L-Shaped IAM Controller', layer_id: 'l-services', col_span: 2, row_span: 2, shape: 'l-bottom-left' },
      ],
    }
    render(<PillarLayerSection section={data} />)
    const block = screen.getByTestId('pillar-layer-block-0')
    expect(block.classList.contains('is-shaped')).toBe(true)
    expect(block.style.getPropertyValue('--clip')).toContain('polygon(')
  })

  it('without dependencies, blocks are not tappable and there is no hint', () => {
    render(<PillarLayerSection section={mockSectionData} />)
    expect(screen.queryByTestId('pillar-layer-hint')).not.toBeInTheDocument()
    expect(screen.getByTestId('pillar-layer-block-0')).not.toHaveAttribute('role')
  })

  describe('tracing dependencies', () => {
    const linked: PillarLayerSectionData = {
      ...mockSectionData,
      matrix_blocks: [
        { id: 'b-app', title: 'App', layer_id: 'l-channels', depends_on: ['b-api'] },
        { id: 'b-api', title: 'API', layer_id: 'l-services', depends_on: ['b-db'] },
        { id: 'b-other', title: 'Other', layer_id: 'l-services' },
        { id: 'b-db', title: 'Database', layer_id: 'l-infra' },
      ],
    }

    it('shows what each block uses', () => {
      render(<PillarLayerSection section={linked} />)
      expect(screen.getByTestId('pillar-layer-hint')).toHaveTextContent('Tap a block')
      expect(screen.getByTestId('pillar-block-uses-0')).toHaveTextContent('Uses: API')
      expect(screen.queryByTestId('pillar-block-uses-3')).not.toBeInTheDocument()
    })

    it('tapping a block marks everything it needs and everything it affects, and dims the rest', () => {
      render(<PillarLayerSection section={linked} />)
      fireEvent.click(screen.getByTestId('pillar-layer-block-1'))
      expect(screen.getByTestId('pillar-layer-block-1').classList.contains('is-selected')).toBe(true)
      expect(screen.getByTestId('pillar-layer-block-3').classList.contains('is-needed')).toBe(true)
      expect(screen.getByTestId('pillar-layer-block-0').classList.contains('is-affected')).toBe(true)
      expect(screen.getByTestId('pillar-layer-block-2').classList.contains('is-dimmed')).toBe(true)
      expect(screen.getByTestId('layer-row-l-services').classList.contains('is-highlighted')).toBe(true)
      const trace = screen.getByTestId('pillar-trace')
      expect(trace).toHaveTextContent('NeedsDatabase')
      expect(trace).toHaveTextContent('If it changes, it affectsApp')
    })

    it('follows chains: a foundation block affects everything built on it', () => {
      render(<PillarLayerSection section={linked} />)
      fireEvent.click(screen.getByTestId('pillar-layer-block-3'))
      expect(screen.getByTestId('pillar-trace')).toHaveTextContent('If it changes, it affectsAPI, App')
      expect(screen.getByTestId('pillar-trace')).toHaveTextContent('Needsnothing')
    })

    it('names in the trace move the selection; tapping the selected block clears it', () => {
      render(<PillarLayerSection section={linked} />)
      fireEvent.click(screen.getByTestId('pillar-layer-block-1'))
      fireEvent.click(screen.getByRole('button', { name: 'Database' }))
      expect(screen.getByTestId('pillar-layer-block-3').classList.contains('is-selected')).toBe(true)
      fireEvent.click(screen.getByTestId('pillar-layer-block-3'))
      expect(screen.queryByTestId('pillar-trace')).not.toBeInTheDocument()
      expect(screen.getByTestId('pillar-layer-block-2').classList.contains('is-dimmed')).toBe(false)
    })

    it('blocks answer to the keyboard', () => {
      render(<PillarLayerSection section={linked} />)
      fireEvent.keyDown(screen.getByTestId('pillar-layer-block-0'), { key: 'Enter' })
      expect(screen.getByTestId('pillar-layer-block-0')).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
