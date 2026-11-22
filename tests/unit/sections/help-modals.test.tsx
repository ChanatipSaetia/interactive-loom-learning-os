import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BulletsHelpModal } from '../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/BulletsHelpModal'
import { ConceptMapHelpModal } from '../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map/ConceptMapHelpModal'
import { DecisionTreeHelpModal } from '../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/decision-tree/DecisionTreeHelpModal'
import { FlashcardsHelpModal } from '../../../src/core/learning-engine/sub-contexts/practice-assessment/components/flashcards/FlashcardsHelpModal'
import { FlowchartHelpModal } from '../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/FlowchartHelpModal'
import { FormulaHelpModal } from '../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/FormulaHelpModal'
import { IntroHelpModal } from '../../../src/core/learning-engine/sub-contexts/progressive-content/components/intro/IntroHelpModal'
import { PillarLayerHelpModal } from '../../../src/core/learning-engine/sub-contexts/progressive-content/components/pillar-layer/PillarLayerHelpModal'
import { QuizHelpModal } from '../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz/QuizHelpModal'
import { ReflectionSequenceHelpModal } from '../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence/ReflectionSequenceHelpModal'
import { ReflectionTemplateHelpModal } from '../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template/ReflectionTemplateHelpModal'
import { ScenarioHelpModal } from '../../../src/core/learning-engine/sub-contexts/process-simulation/components/scenario/ScenarioHelpModal'
import { TaxonomyHelpModal } from '../../../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser/TaxonomyHelpModal'
import { TextHelpModal } from '../../../src/core/learning-engine/sub-contexts/progressive-content/components/text/TextHelpModal'
import { TradeoffHelpModal } from '../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox/TradeoffHelpModal'

const modals: Array<{ name: string; Component: React.ComponentType<{ isOpen: boolean; onClose: () => void }>; id: string; content: Array<string | RegExp>; closeId?: string; closeText?: string; overlay?: string }> = [
  { name: 'BulletsHelpModal', Component: BulletsHelpModal, id: 'bullets-help-modal', content: ['Bullet Points Section Guide'], closeText: 'Got it' },
  { name: 'ConceptMapHelpModal', Component: ConceptMapHelpModal, id: 'cm-help-modal', content: ['Concept Map Guide & Concepts', 'What is a Concept Map?'], closeId: 'cm-help-close', overlay: 'cm-help-overlay' },
  { name: 'DecisionTreeHelpModal', Component: DecisionTreeHelpModal, id: 'dt-help-modal', content: [/Decision Tree/], closeId: 'dt-help-close' },
  { name: 'FlashcardsHelpModal', Component: FlashcardsHelpModal, id: 'fc-help-modal', content: ['Flashcard Deck Concepts & Authoring Guide', 'Dual-Faced Card Anatomy'], closeId: 'fc-help-close', overlay: 'fc-help-overlay' },
  { name: 'FlowchartHelpModal', Component: FlowchartHelpModal, id: 'flowchart-help-modal', content: ['Flowchart & Event Storming Concepts Guide', 'The Event Storming Cycle'], closeId: 'flowchart-help-close', overlay: 'flowchart-help-overlay' },
  { name: 'FormulaHelpModal', Component: FormulaHelpModal, id: 'fm-help-modal', content: ['Formula Sandbox Concepts & Guide'], closeId: 'fm-help-close' },
  { name: 'IntroHelpModal', Component: IntroHelpModal, id: 'intro-help-modal', content: ['Topic Intro & Overview Guide', 'The Intro Section Structure'], closeId: 'intro-help-close', overlay: 'intro-help-overlay' },
  { name: 'PillarLayerHelpModal', Component: PillarLayerHelpModal, id: 'pillar-layer-help-modal', content: ['Pillar & Layer Section Guide'], closeText: 'Got it' },
  { name: 'QuizHelpModal', Component: QuizHelpModal, id: 'qz-help-modal', content: ['Quiz Section Concepts & Guide'], closeId: 'qz-help-close' },
  { name: 'ReflectionSequenceHelpModal', Component: ReflectionSequenceHelpModal, id: 'reflection-sequence-help-modal', content: ['Reflection Sequence Challenge Guide'], closeText: 'Got it' },
  { name: 'ReflectionTemplateHelpModal', Component: ReflectionTemplateHelpModal, id: 'reflection-template-help-modal', content: ['Reflection Template Fill-In-Blank Guide'], closeText: 'Got it' },
  { name: 'ScenarioHelpModal', Component: ScenarioHelpModal, id: 'sc-help-modal', content: [/Scenario Section/], closeId: 'sc-help-close' },
  { name: 'TaxonomyHelpModal', Component: TaxonomyHelpModal, id: 'taxonomy-help-modal', content: ['Taxonomy Browser Section Guide'], closeText: 'Got it' },
  { name: 'TextHelpModal', Component: TextHelpModal, id: 'text-help-modal', content: ['Rich Text Section Guide'], closeText: 'Got it' },
  { name: 'TradeoffHelpModal', Component: TradeoffHelpModal, id: 'to-help-modal', content: ['Trade-off Sandbox Concepts & Guide'], closeId: 'to-help-close' },
]

describe.each(modals)('$name', ({ Component, id, content, closeId, closeText, overlay }) => {
  it('is hidden when closed and shows its guide when open', () => {
    const { rerender } = render(<Component isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId(id)).not.toBeInTheDocument()
    rerender(<Component isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId(id)).toBeInTheDocument()
    for (const text of content) expect(screen.getAllByText(text).length).toBeGreaterThan(0)
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<Component isOpen={true} onClose={onClose} />)
    fireEvent.click(closeId ? screen.getByTestId(closeId) : screen.getByRole('button', { name: closeText }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  if (overlay) {
    it('calls onClose when the backdrop is clicked', () => {
      const onClose = vi.fn()
      render(<Component isOpen={true} onClose={onClose} />)
      fireEvent.click(screen.getByTestId(overlay))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose on Escape', () => {
      const onClose = vi.fn()
      render(<Component isOpen={true} onClose={onClose} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  }
})
