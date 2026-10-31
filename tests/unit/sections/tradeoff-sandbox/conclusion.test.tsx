import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TradeoffConclusion } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox/TradeoffConclusion'
import type { TradeoffScenario } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/schema'

const scenario: TradeoffScenario = {
  id: 'test', title: 'A search service', description: 'Balance relevance and simplicity.',
  metrics: [{ id: 'quality', label: 'Quality', baseValue: 50, min: 0, max: 100 }],
  steps: [{ id: 'retrieval', title: 'Retrieval strategy', recommended: 'hybrid', choices: [
    { id: 'hybrid', label: 'Hybrid', description: 'Combine keywords and vectors.', metrics: { quality: 20 }, pros: [], cons: [{ title: 'More infrastructure', description: 'Operate an embedding service.' }], whyThisFits: 'Supports both exact and semantic matches. Further explanation. Additional detail.' },
  ] }],
}

describe('one-page tradeoff conclusion', () => {
  it('connects the recommendation, authored reason, main compromise and recommended totals', () => {
    render(<TradeoffConclusion scenario={scenario} />)
    const conclusion = screen.getByTestId('tradeoff-conclusion')
    expect(conclusion).toHaveTextContent('Retrieval strategy')
    expect(conclusion).toHaveTextContent('Hybrid')
    expect(conclusion).toHaveTextContent('Supports both exact and semantic matches. Further explanation. Additional detail.')
    expect(conclusion).toHaveTextContent('More infrastructure — Operate an embedding service.')
    expect(within(conclusion).getByTestId('conclusion-test-metric-value-quality')).toHaveTextContent('70')
  })

  it('shortens the presenter reason without losing the selected option or compromise', () => {
    render(<TradeoffConclusion scenario={scenario} compact />)
    const row = document.querySelector('.tradeoff-conclusion-row')!
    expect(row).toHaveTextContent('Supports both exact and semantic matches.')
    expect(row).toHaveTextContent('Further explanation.')
    expect(row).not.toHaveTextContent('Additional detail.')
    expect(row).toHaveTextContent('More infrastructure')
    expect(row).not.toHaveTextContent('Operate an embedding service.')
  })

  it('does not invent a recommendation or apply deltas for an invalid recommendation', () => {
    render(<TradeoffConclusion scenario={{ ...scenario, steps: [{ ...scenario.steps[0], recommended: 'missing' }] }} />)
    expect(screen.getByText('No recommendation provided.')).toBeInTheDocument()
    expect(screen.getByTestId('conclusion-test-metric-value-quality')).toHaveTextContent('50')
    expect(screen.getByTestId('tradeoff-conclusion')).toHaveTextContent('0 / 1 decisions recommended')
  })
})
