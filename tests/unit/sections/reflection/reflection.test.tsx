import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReflectionSequence } from '../../../../src/sections/reflection-sequence'
import { ReflectionTemplate } from '../../../../src/sections/reflection-template'

describe('ReflectionSequence Multi-Scenario', () => {
  const challenges = [
    {
      prompt: 'Scenario 1 Prompt',
      items: [
        { id: 'item1', text: 'Step 1' },
        { id: 'item2', text: 'Step 2' },
      ],
      solution: ['item1', 'item2'],
    },
    {
      prompt: 'Scenario 2 Prompt',
      items: [
        { id: 'itemA', text: 'Step A' },
        { id: 'itemB', text: 'Step B' },
      ],
      solution: ['itemB', 'itemA'],
    },
  ]

  it('renders first scenario and navigates to the second scenario', () => {
    render(<ReflectionSequence title="Sequence Test" challenges={challenges} />)

    // Verify first scenario is shown
    expect(screen.getByText('Scenario 1 Prompt')).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()

    // Navigate to second scenario
    const nextBtn = screen.getByText('Next Scenario')
    fireEvent.click(nextBtn)

    // Verify second scenario is shown and first scenario elements are unmounted/cleared
    expect(screen.getByText('Scenario 2 Prompt')).toBeInTheDocument()
    expect(screen.getByText('Step A')).toBeInTheDocument()
    expect(screen.getByText('Step B')).toBeInTheDocument()
    expect(screen.queryByText('Scenario 1 Prompt')).not.toBeInTheDocument()
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
  })

  it('verifies correct answers independently for sequence builder', () => {
    render(<ReflectionSequence title="Sequence Test" challenges={challenges} />)

    // 1. Solve first scenario
    // Tap Step 1 -> Slot 1
    fireEvent.click(screen.getByText('Step 1'))
    fireEvent.click(screen.getAllByText('Tap to place step here')[0])

    // Tap Step 2 -> Slot 2
    fireEvent.click(screen.getByText('Step 2'))
    fireEvent.click(screen.getAllByText('Tap to place step here')[0]) // index 0 because slot 1 is filled

    // Verify correct
    fireEvent.click(screen.getByText('Verify Sequence Model'))
    expect(screen.getByText('Correct! You have mapped the process flow sequence accurately.')).toBeInTheDocument()

    // 2. Navigate to second scenario
    const nextBtn = screen.getByText('Next Scenario')
    fireEvent.click(nextBtn)

    // Verify feedback is reset
    expect(screen.queryByText('Correct! You have mapped the process flow sequence accurately.')).not.toBeInTheDocument()

    // Solve second scenario
    // Tap Step B -> Slot 1
    fireEvent.click(screen.getByText('Step B'))
    fireEvent.click(screen.getAllByText('Tap to place step here')[0])

    // Tap Step A -> Slot 2
    fireEvent.click(screen.getByText('Step A'))
    fireEvent.click(screen.getAllByText('Tap to place step here')[0])

    // Verify correct
    fireEvent.click(screen.getByText('Verify Sequence Model'))
    expect(screen.getByText('Correct! You have mapped the process flow sequence accurately.')).toBeInTheDocument()
  })
})

describe('ReflectionTemplate Multi-Scenario', () => {
  const challenges = [
    {
      prompt: 'Template 1 Prompt',
      template: 'Option is {zone-1}',
      chips: [
        { id: 'chip-smaller', text: 'smaller' },
        { id: 'chip-larger', text: 'larger' },
      ],
      solution: { 'zone-1': 'chip-smaller' },
    },
    {
      prompt: 'Template 2 Prompt',
      template: 'Option is {zone-1}',
      chips: [
        { id: 'chip-fewer', text: 'fewer' },
        { id: 'chip-more', text: 'more' },
      ],
      solution: { 'zone-1': 'chip-fewer' },
    },
  ]

  it('renders first scenario and transitions correctly', () => {
    render(<ReflectionTemplate title="Template Test" challenges={challenges} />)

    // Verify first scenario
    expect(screen.getByText('Template 1 Prompt')).toBeInTheDocument()
    expect(screen.getByText('smaller')).toBeInTheDocument()

    // Navigate to second scenario
    const nextBtn = screen.getByText('Next Scenario')
    fireEvent.click(nextBtn)

    // Verify second scenario
    expect(screen.getByText('Template 2 Prompt')).toBeInTheDocument()
    expect(screen.getByText('fewer')).toBeInTheDocument()
    expect(screen.queryByText('Template 1 Prompt')).not.toBeInTheDocument()
    expect(screen.queryByText('smaller')).not.toBeInTheDocument()
  })

  it('verifies correct answers independently for each scenario', () => {
    render(<ReflectionTemplate title="Template Test" challenges={challenges} />)

    // 1. Solve first scenario (tap chip, then tap zone)
    fireEvent.click(screen.getByText('smaller'))
    fireEvent.click(screen.getByText('[ ? ]'))

    // Verify correct
    fireEvent.click(screen.getByText('Verify Explanation'))
    expect(screen.getByText('Correct! You have successfully completed the explanation template.')).toBeInTheDocument()

    // 2. Navigate to second scenario
    const nextBtn = screen.getByText('Next Scenario')
    fireEvent.click(nextBtn)

    // Verify feedback is reset
    expect(screen.queryByText('Correct! You have successfully completed the explanation template.')).not.toBeInTheDocument()

    // Solve second scenario (tap chip, then tap zone)
    fireEvent.click(screen.getByText('fewer'))
    fireEvent.click(screen.getByText('[ ? ]'))

    // Verify correct
    fireEvent.click(screen.getByText('Verify Explanation'))
    expect(screen.getByText('Correct! You have successfully completed the explanation template.')).toBeInTheDocument()
  })
})
