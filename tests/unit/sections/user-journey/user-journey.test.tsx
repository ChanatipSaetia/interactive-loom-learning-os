import { JourneyRail } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/user-journey/JourneyView'
import demoSource from '../../../../samples/user-journey-demo.loom.oui?raw'
import { compileViewerTopic } from '../../../../src/viewer/compileTopic'
import { readTopicText } from '../../../../src/core/supporting/authoring-editor/workspace/archive'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { USER_JOURNEY_EXAMPLE } from '../../../../src/core/learning-engine/composition/oui/user-journey-authoring'
import { validateOUISection, validateOUINarration, sectionBeatsOf } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print'
import { journeyPages, journeyScenes, UserJourneySectionSchema, type UserJourneySectionData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/user-journey'
import { userJourneyBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import UserJourneySection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/user-journey'
import PresentUserJourney from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/user-journey/PresentUserJourney'
import { UserJourneyFormEditor } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/user-journey/UserJourneyFormEditor'
import { getAuthoringGuide } from '../../../../src/core/learning-engine/composition/oui/authoring-guide'
import { PickAnchorProvider } from '../../../../src/core/ui-system/pick-anchor'
import { compileOUISection } from '../../../../src/core/learning-engine/composition/oui/compile'

const sample = () => structuredClone(validateOUISection(USER_JOURNEY_EXAMPLE).payload!.data) as UserJourneySectionData

describe('native user journey', () => {
  it('opens the complete demo in Viewer with native configs and narration for every beat', () => {
    const topic = compileViewerTopic(readTopicText(demoSource)[0])
    expect(topic.error).toBeUndefined()
    expect(topic.narrationErrors).toEqual([])
    expect(topic.sections).toHaveLength(2)
    for (const section of topic.sections) {
      expect(section.error).toBeUndefined()
      expect(section.config?.type).toBe('user-journey')
      const data = section.config!.props.section as UserJourneySectionData
      expect(data.person).toBeTruthy()
      const expected = ['title', ...userJourneyBeats({ section: data }).map((b) => b.id)]
      expect(section.narration?.steps.map((s) => s.beat)).toEqual(expected)
    }
  })
  it('compiles simple authoring syntax and round trips without losing optional fields', () => {
    const result = validateOUISection(USER_JOURNEY_EXAMPLE)
    expect(result.diagnostics).toEqual([])
    const back = validateOUISection(printOUISection(result.payload!.meta, result.payload!.data))
    expect(back.diagnostics).toEqual([])
    expect(back.payload!.data).toEqual(result.payload!.data)
    expect(back.payload!.data.type).toBe('user-journey')
  })

  it('supports an outcome without friction or recovery using positional nulls', () => {
    const source = "root = Page(\"A\", UserJourney(\"A\", \"B\", \"C\", [JourneyStage(\"D\", \"E\", \"F\", \"G\", null, null, \"Done\")]))"
    const result = validateOUISection(source)
    expect(result.diagnostics).toEqual([])
    expect(sectionBeatsOf(source)?.map((b) => b.id)).toEqual(['title', 'overview', 'stage1.goal', 'stage1.action', 'stage1.response', 'stage1.outcome'])
    expect(validateOUISection(printOUISection(result.payload!.meta, result.payload!.data)).payload!.data).toEqual(result.payload!.data)
  })

  it('rejects empty required fields, empty journeys, and recovery without friction', () => {
    const data = sample()
    expect(UserJourneySectionSchema.safeParse({ ...data, stages: [] }).success).toBe(false)
    expect(UserJourneySectionSchema.safeParse({ ...data, person: ' ' }).success).toBe(false)
    expect(UserJourneySectionSchema.safeParse({ ...data, stages: [{ ...data.stages[0], action: ' ' }] }).success).toBe(false)
    const result = validateOUISection("root = Page(\"A\", UserJourney(\"A\", \"B\", \"C\", [JourneyStage(\"D\", \"E\", \"F\", \"G\", null, \"Recovery\")]))")
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ tier: 3, field: 'stages[0].recovery' })]))
  })

  it('derives only authored moments and accepts narration targeting stage fields', () => {
    expect(sectionBeatsOf(USER_JOURNEY_EXAMPLE)?.map((b) => b.id)).toEqual(['title', 'overview', 'stage1.goal', 'stage1.action', 'stage1.response', 'stage2.goal', 'stage2.action', 'stage2.response', 'stage2.friction', 'stage2.outcome'])
    expect(validateOUINarration('root = Narration([NarrationStep("stage2.friction", "Compare alternatives.", [Highlight("visit.recovery")])])', USER_JOURNEY_EXAMPLE).diagnostics).toEqual([])
    expect(validateOUINarration('root = Narration([NarrationStep("stage1.friction", "Invented")])', USER_JOURNEY_EXAMPLE).diagnostics.length).toBeGreaterThan(0)
  })

  it('explores complete stages in Read and emits selection events', () => {
    const onEvent = vi.fn()
    render(<UserJourneySection section={sample()} onEvent={onEvent} />)
    expect(screen.getByText('Maya compares riding position, parking needs and costs.')).toBeInTheDocument()
    expect(screen.queryByText('Recovery')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Overall journey goal' })).toHaveTextContent(sample().goal)
    expect(screen.getByText('Stage goal')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next stage' }))
    expect(screen.getByText('The first model feels uncomfortable.')).toBeInTheDocument()
    expect(screen.getByText('Recovery')).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'JourneyStageSelected', stageIndex: 1 }))
    expect(screen.getByRole('button', { name: 'Next stage' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Previous stage: Compare options/ }))
    expect(screen.getByRole('button', { name: 'Previous stage' })).toBeDisabled()
  })

  it('reveals beats within readable pages and shows the stage heading only once', () => {
    const section = sample(), data = { section }, beats = userJourneyBeats(data)
    const props = { data, beats, sectionIndex: 0, active: true }
    const { container, rerender } = render(<PresentUserJourney {...props} beat={0} />)
    expect(container).toHaveTextContent(section.goal)
    expect(container.querySelectorAll('.journey-slide')).toHaveLength(0)
    let page: Element | null = null
    let previousPage = ''
    const pages = journeyPages(section)
    for (let beat = 1; beat < beats.length; beat++) {
      rerender(<PresentUserJourney {...props} beat={beat} />)
      const current = pages.find((p) => p.scenes.includes(beat - 1))!
      const pageId = `${current.stage}:${pages.filter((p) => p.stage === current.stage).indexOf(current)}`
      const shown = current.scenes.filter((index) => index < beat).length
      expect(container.querySelectorAll('.journey-detail')).toHaveLength(shown)
      const currentPage = container.querySelector('.journey-step-page')
      if (previousPage === pageId) expect(currentPage).toBe(page)
      else if (page) expect(currentPage).not.toBe(page)
      page = currentPage
      previousPage = pageId
      expect(screen.getAllByRole('heading', { name: new RegExp(section.stages[current.stage].name) })).toHaveLength(1)
      expect(currentPage).not.toHaveTextContent(section.stages[current.stage].name)
      expect(container.querySelectorAll('[data-focus]')).toHaveLength(1)
      expect(screen.getByRole('region', { name: 'Overall journey goal' })).toHaveTextContent(section.goal)
      expect(container.querySelector('.journey-selector [aria-current="step"]')).toBeInTheDocument()
      expect(container.querySelector(`[data-beat="${beat}"][data-focus]`)).toBeInTheDocument()
    }
    rerender(<PresentUserJourney {...props} beat={beats.findIndex((b) => b.id === 'stage2.friction')} />)
    expect(container).toHaveTextContent('Compare another suitable model before deciding.')
    expect(container).not.toHaveTextContent(section.stages[1].outcome!)
    expect(container).not.toHaveTextContent(section.stages[1].action)
    expect(container).toHaveTextContent(section.stages[1].response)
    expect(container).not.toHaveTextContent(section.stages[0].action)
    rerender(<PresentUserJourney {...props} beat={beats.findIndex((b) => b.id === 'stage2.action')} />)
    expect(container.querySelectorAll('.journey-detail')).toHaveLength(2)
    expect(container).not.toHaveTextContent(section.stages[1].friction!)
  })

  it('shows only adjacent stages and supports clicking, arrows and horizontal swipes', () => {
    const section = sample()
    section.stages.push(...[3, 4, 5].map((n) => ({ ...section.stages[0], name: `Stage ${n}` })))
    const onSelect = vi.fn()
    const { rerender } = render(<JourneyRail section={section} selected={2} onSelect={onSelect} />)
    expect(screen.getByRole('heading', { name: /Stage 3/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.queryByText('Compare options')).not.toBeInTheDocument()
    expect(screen.queryByText('Stage 5')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous stage: Visit the dealer' }))
    expect(onSelect).toHaveBeenLastCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Next stage: Stage 4' }))
    expect(onSelect).toHaveBeenLastCalledWith(3)
    const slider = screen.getByRole('navigation', { name: 'Journey stages' })
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith(1)
    fireEvent.touchStart(slider, { touches: [{ clientX: 250, clientY: 20 }] })
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 100, clientY: 25 }] })
    expect(onSelect).toHaveBeenLastCalledWith(3)
    onSelect.mockClear()
    fireEvent.touchStart(slider, { touches: [{ clientX: 100, clientY: 20 }] })
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 160, clientY: 200 }] })
    expect(onSelect).not.toHaveBeenCalled()
    rerender(<JourneyRail section={section} selected={0} onSelect={onSelect} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.keyDown(screen.getByRole('navigation'), { key: 'ArrowLeft' })
    expect(onSelect).not.toHaveBeenCalled()
    rerender(<JourneyRail section={section} selected={4} onSelect={onSelect} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Previous stage: Stage 4' })).toBeInTheDocument()
  })

  it('navigates Present neighbors to the first body beat of the selected stage', () => {
    const section = sample(), data = { section }, beats = userJourneyBeats(data), onBeatChange = vi.fn()
    const props = { data, beats, sectionIndex: 0, active: true, onBeatChange }
    const { rerender } = render(<PresentUserJourney {...props} beat={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next stage: Visit the dealer' }))
    expect(onBeatChange).toHaveBeenLastCalledWith(4)
    rerender(<PresentUserJourney {...props} beat={4} />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous stage: Compare options' }))
    expect(onBeatChange).toHaveBeenLastCalledWith(1)
  })

  it('splits stages into small pages without dropping or renaming beats', () => {
    const data = sample()
    const pages = journeyPages(data)
    expect(pages.slice(0, 2)).toEqual([{ stage: 0, scenes: [0, 1] }, { stage: 0, scenes: [2] }])
    expect(pages.flatMap((p) => p.scenes)).toEqual(journeyScenes(data).map((_, i) => i))
    expect(pages.every((p) => p.scenes.length <= 2)).toBe(true)
    data.stages[0].goal = 'A long explanation '.repeat(30)
    expect(journeyPages(data)[0].scenes).toEqual([0])
  })

  it('preserves compiled stage anchors in Read for authoring and narration', () => {
    const compiled = compileOUISection(USER_JOURNEY_EXAMPLE)
    const section = compiled.value!.data as UserJourneySectionData
    const map = compiled.sourceMap!
    const scope = { file: 'sections/journey.oui', label: 'Journey', anchorOf: (value: unknown) => { const a = map.anchorOf(value); return a ? `${a.statement}${a.path}` : undefined }, anchorOfId: () => undefined }
    const { container } = render(<PickAnchorProvider scope={scope}><UserJourneySection section={section} /></PickAnchorProvider>)
    expect(container.querySelector('[data-oui-anchor="compare.action"]')).toBeInTheDocument()
  })

  it('edits optional fields, adds, removes and reorders stages through Studio', () => {
    const onChange = vi.fn(), data = sample()
    const { rerender } = render(<UserJourneyFormEditor data={data} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add stage' }))
    const added = onChange.mock.lastCall![0] as UserJourneySectionData
    expect(added.stages).toHaveLength(3)
    expect(UserJourneySectionSchema.safeParse(added).success).toBe(true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Move earlier' })[1])
    expect(onChange.mock.lastCall![0].stages[0].name).toBe('Visit the dealer')
    fireEvent.change(screen.getAllByLabelText(/Outcome/)[1], { target: { value: '' } })
    expect(onChange.mock.lastCall![0].stages[1].outcome).toBeUndefined()
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove stage' })[1])
    const single = onChange.mock.lastCall![0] as UserJourneySectionData
    rerender(<UserJourneyFormEditor data={single} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Remove stage' })).toBeDisabled()
  })

  it('includes focused authoring guidance only when requested', () => {
    expect(getAuthoringGuide(['user-journey'])).toContain('JourneyStage(name, goal, action, response')
    expect(getAuthoringGuide(['user-journey'])).toContain('## User Journeys')
    expect(getAuthoringGuide(['quiz'])).not.toContain('## User Journeys')
  })
})
