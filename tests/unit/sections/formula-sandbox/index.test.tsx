import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormulaSandbox from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox'
import { HUDProvider } from '../../../../src/core/learning-engine/composition/context/HUDContext'
import { HUDDrawer } from '../../../../src/core/delivery/web-app-shell/TopicShell'
import PresentFormula from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/PresentFormula'
import { formulaBeats } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'

describe('FormulaSandbox Component', () => {
  const variables = [
    {
      id: 'var_a',
      label: 'Variable A',
      min: 10,
      max: 50,
      step: 10,
      defaultValue: 20,
    },
    {
      id: 'var_b',
      label: 'Variable B',
      min: 2,
      max: 10,
      step: 2,
      defaultValue: 4,
    },
  ]

  const metrics = [
    {
      id: 'metric_sum',
      label: 'Sum Metric (units)',
      formula: 'var_a + var_b',
      description: 'Sum of Variable A and Variable B',
    },
    {
      id: 'metric_product',
      label: 'Product Metric ($)',
      formula: 'var_a * var_b',
      description: 'Product of Variable A and Variable B',
    },
  ]

  it('renders variables and computed metrics', () => {
    render(
      <HUDProvider>
        <FormulaSandbox title="Sandbox Test" variables={variables} metrics={metrics} />
      </HUDProvider>
    )

    // Verify sliders exist
    expect(screen.getByText('Variable A')).toBeInTheDocument()
    expect(screen.getByText('Variable B')).toBeInTheDocument()

    expect(screen.queryByText('Variable A + Variable B')).not.toBeInTheDocument()
    expect(screen.queryByText('Variable A × Variable B')).not.toBeInTheDocument()

    // Sum should be 20 + 4 = 24
    expect(screen.getByText('24 units')).toBeInTheDocument()

    // Product should be 20 * 4 = 80
    expect(screen.getByText('$80.00')).toBeInTheDocument()
  })

  it('shows only the clicked metric formula in its Read details', () => {
    render(<HUDProvider><FormulaSandbox variables={variables} metrics={metrics} /><HUDDrawer /></HUDProvider>)
    expect(screen.queryByText(/Sum Metric = Variable A/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sum Metric \(units\)/ }))
    expect(screen.getByText('Sum Metric = Variable A + Variable B')).toBeInTheDocument()
    expect(screen.queryByText('Product Metric = Variable A × Variable B')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Product Metric \(\$\)/ }))
    expect(screen.getByText('Product Metric = Variable A × Variable B')).toBeInTheDocument()
    expect(screen.queryByText('Sum Metric = Variable A + Variable B')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reveals and hides the selected formula on metric activation in Present', () => {
    const data = { variables, metrics }
    render(<PresentFormula data={data} beats={formulaBeats(data)} beat={0} sectionIndex={0} active />)
    const sum = screen.getByRole('button', { name: /Sum Metric \(units\)/ })
    expect(sum).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Variable A + Variable B')).not.toBeInTheDocument()
    fireEvent.click(sum)
    expect(sum).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Variable A + Variable B')).toBeInTheDocument()
    expect(screen.queryByText('Variable A × Variable B')).not.toBeInTheDocument()
    fireEvent.click(sum)
    expect(screen.queryByText('Variable A + Variable B')).not.toBeInTheDocument()
  })

  it('updates metrics when sliders change', () => {
    render(
      <HUDProvider>
        <FormulaSandbox title="Sandbox Test" variables={variables} metrics={metrics} />
      </HUDProvider>
    )

    // Find slider A (input element)
    const sliders = screen.getAllByRole('slider')
    const sliderA = sliders[0]

    // Change value of slider A to 40
    fireEvent.change(sliderA, { target: { value: '40' } })

    // Sum should update to 40 + 4 = 44
    expect(screen.getByText('44 units')).toBeInTheDocument()

    // Product should update to 40 * 4 = 160
    expect(screen.getByText('$160.00')).toBeInTheDocument()
  })
})
