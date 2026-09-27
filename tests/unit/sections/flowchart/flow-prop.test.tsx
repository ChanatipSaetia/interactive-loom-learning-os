import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart'
import { FlowchartSectionSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/schema'

const { flow } = FlowchartSectionSchema.parse({
  type: 'flowchart',
  flow: {
    actors: { shopper: { title: 'Shopper', desc: 'Buys things' } },
    systems: { ledger: { title: 'Ledger Service', desc: 'Records orders', type: 'aggregate' } },
    steps: [
      {
        id: 'place',
        type: 'linear',
        initiatedBy: 'shopper',
        policy: 'On checkout',
        command: 'Record order',
        handledBy: 'ledger',
        resultEvents: [{ id: 'recorded', title: 'Order recorded' }],
      },
    ],
    journeys: [
      {
        id: 'main',
        label: 'Main',
        description: 'Happy path',
        steps: [{ stepId: 'place', name: 'Record', description: 'The ledger records the order' }],
      },
    ],
  },
})

describe('Flowchart flow prop', () => {
  it('derives its views from the validated AbstractFlow', () => {
    render(<Flowchart title="Orders" flow={flow} />, { wrapper: MemoryRouter })

    expect(screen.getAllByText('Ledger Service').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Order recorded').length).toBeGreaterThan(0)
  })
})
