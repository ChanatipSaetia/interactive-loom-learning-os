import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TIMELINE_EXAMPLE, TIMELINE_NARRATION_EXAMPLE } from '../../../../src/core/learning-engine/composition/oui/timeline-authoring'
import { validateOUISection, validateOUINarration, sectionBeatsOf } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print'
import { TimelineSectionSchema, validateTimeline, type TimelineSectionData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/timeline'
import { layoutTimeline, timelineGroups } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/timeline-layout'
import { timelineBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import TimelineSection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/timeline'
import PresentTimeline from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/timeline/PresentTimeline'
import { TimelineFormEditor } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/timeline/TimelineFormEditor'

const sample = () => structuredClone(validateOUISection(TIMELINE_EXAMPLE).payload!.data) as TimelineSectionData

describe('measured timeline', () => {
  it('compiles, round-trips and narrates every stage, including simultaneous highlights', () => {
    const result = validateOUISection(TIMELINE_EXAMPLE)
    expect(result.diagnostics).toEqual([])
    const source = printOUISection(result.payload!.meta, result.payload!.data)
    const back = validateOUISection(source)
    expect(back.diagnostics).toEqual([])
    expect(back.payload!.data).toEqual(result.payload!.data)
    expect(sectionBeatsOf(source)!.map((b) => b.id)).toEqual(['title', 'overview', 'group1', 'group2', 'group3', 'summary'])
    const narration = validateOUINarration(TIMELINE_NARRATION_EXAMPLE, source)
    expect(narration.diagnostics).toEqual([])
    expect(narration.payload!.steps.find((s) => s.beat === 'group2')!.effects).toHaveLength(2)
  })

  it('uses a shared time scale and elapsed time instead of summing overlapping durations', () => {
    const data = sample()
    const { placed, end } = layoutTimeline(data)
    expect(end).toBe(200)
    expect(data.activities.reduce((sum, a) => sum + a.duration, 0)).toBe(280)
    const db = placed.find((p) => p.activity.id === 'records')!
    const search = placed.find((p) => p.activity.id === 'documents')!
    const compose = placed.find((p) => p.activity.id === 'compose')!
    expect(db.x).toBe(search.x)
    expect(search.width / db.width).toBeCloseTo(150 / 80)
    expect(compose.x).toBeCloseTo(search.x + search.width)
  })

  it('gives every task its own row, including tasks with the same participant', () => {
    const data = sample()
    data.activities[2].lane = data.activities[1].lane
    const placed = layoutTimeline(data).placed
    expect(placed.find((p) => p.activity.id === 'records')!.y).not.toBe(placed.find((p) => p.activity.id === 'documents')!.y)
    expect(placed.find((p) => p.activity.id === 'records')!.x).toBe(placed.find((p) => p.activity.id === 'documents')!.x)
  })

  it('orders tasks from top to bottom by start time, independent of participant order', () => {
    const data = sample()
    data.activities = [data.activities[3], data.activities[2], data.activities[0], data.activities[1]]
    const { placed } = layoutTimeline(data)
    expect(placed.map((p) => p.activity.id)).toEqual(['validate', 'documents', 'records', 'compose'])
    expect(placed.map((p) => p.y)).toEqual([...placed.map((p) => p.y)].sort((a, b) => a - b))
    expect(placed[1].x).toBe(placed[2].x)
  })

  it('keeps long compact labels and timing metadata inside their lane', () => {
    const data = sample()
    data.activities[2].title = 'Find relevant documents across several knowledge collections'
    const layout = layoutTimeline(data, true)
    const item = layout.placed.find((p) => p.activity.id === 'documents')!
    expect(item.barY + 44).toBeLessThan(item.y + item.height)
    const db = layout.placed.find((p) => p.activity.id === 'records')!
    expect(item.width / db.width).toBeCloseTo(150 / 80)
  })

  it('supports zero-duration milestones without inventing elapsed time', () => {
    const data = TimelineSectionSchema.parse({ type: 'timeline', lanes: [{ id: 'lane', title: 'Lane' }], activities: [{ id: 'a', title: 'Ready', lane: 'lane', start: 0, duration: 0 }] })
    expect(validateTimeline(data)).toEqual([])
    expect(layoutTimeline(data).end).toBe(0)
    render(<TimelineSection section={data} />)
    expect(screen.getByRole('button', { name: /Ready: 0 to 0 ms/ })).toBeInTheDocument()
  })

  it('groups equal start times together when explanation groups are omitted', () => {
    const data = sample()
    data.groups = []
    expect(timelineGroups(data).map((g) => g.activities)).toEqual([['validate'], ['records', 'documents'], ['compose']])
  })

  it('keeps the complete diagram visible while parallel work and the join get focus', () => {
    const section = sample(), data = { section }, beats = timelineBeats(data)
    const props = { data, beats, sectionIndex: 0, active: true }
    const { container, rerender } = render(<PresentTimeline {...props} beat={0} />)
    expect(container.querySelectorAll('.timeline-activity')).toHaveLength(4)
    expect(container.querySelectorAll('.timeline-activity.is-active')).toHaveLength(0)
    rerender(<PresentTimeline {...props} beat={2} />)
    expect(container.querySelectorAll('.timeline-activity')).toHaveLength(4)
    expect(container.querySelectorAll('.timeline-activity.is-active')).toHaveLength(2)
    expect(screen.getByTestId('timeline-activity-records')).toHaveClass('is-active')
    expect(screen.getByTestId('timeline-activity-documents')).toHaveClass('is-active')
    rerender(<PresentTimeline {...props} beat={3} />)
    expect(screen.getByTestId('timeline-activity-compose')).toHaveClass('is-active')
    expect(container.querySelectorAll('.timeline-dependency.is-active')).toHaveLength(2)
    rerender(<PresentTimeline {...props} beat={4} />)
    expect(container.querySelectorAll('.timeline-activity.is-active')).toHaveLength(0)
    expect(container).toHaveTextContent('200 ms elapsed')
    rerender(<PresentTimeline {...props} beat={1} />)
    expect(screen.getByTestId('timeline-activity-validate')).toHaveClass('is-active')
  })

  it('enlarges a dense stage with a whole-schedule map and preserves absolute time', () => {
    const section = sample()
    const extras = Array.from({ length: 11 }, (_, i) => ({ id: `extra${i}`, title: `Background task ${i + 1}`, lane: 'database', start: 250 + i * 10, duration: 5 }))
    section.activities.push(...extras)
    for (let i = 0; i < extras.length; i += 4) section.groups.push({ id: `background${i}`, title: 'Background work', activities: extras.slice(i, i + 4).map((a) => a.id) })
    expect(validateTimeline(section)).toEqual([])
    const data = { section }, beats = timelineBeats(data), props = { data, beats, sectionIndex: 0, active: true }
    const { container, rerender } = render(<PresentTimeline {...props} beat={0} />)
    expect(container.querySelectorAll('.timeline-activity')).toHaveLength(15)
    rerender(<PresentTimeline {...props} beat={2} />)
    expect(container.querySelectorAll('.timeline-activity')).toHaveLength(2)
    expect(screen.getByTestId('timeline-context').querySelectorAll('rect')).toHaveLength(15)
    expect(screen.getByRole('group', { name: 'Timeline in ms; elapsed 355 ms' })).toBeInTheDocument()
    expect(screen.getByText('Waits for earlier work: Validate')).toBeInTheDocument()
    rerender(<PresentTimeline {...props} beat={beats.length - 1} />)
    expect(container.querySelectorAll('.timeline-activity')).toHaveLength(15)
    expect(screen.queryByTestId('timeline-context')).not.toBeInTheDocument()
  })

  it('opens Read details by keyboard and emits the activity selection', () => {
    const onEvent = vi.fn()
    render(<TimelineSection section={sample()} onEvent={onEvent} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Compose answer:/ }), { key: 'Enter' })
    expect(screen.getByText('Waits for both retrieval tasks. The request completes at 200 ms.')).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'TimelineActivitySelected', activityId: 'compose' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fetch records' }))
    expect(screen.getByText('Finishes at 100 ms; composing still waits for Search.')).toBeInTheDocument()
  })

  it('removes dependency and group references when an activity is removed in Studio', () => {
    const onChange = vi.fn()
    render(<TimelineFormEditor data={sample()} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove activity' })[1])
    const data = onChange.mock.calls[0][0] as TimelineSectionData
    expect(data.activities.some((a) => a.id === 'records')).toBe(false)
    expect(data.activities.find((a) => a.id === 'compose')!.depends_on).toEqual(['documents'])
    expect(data.groups.flatMap((g) => g.activities)).not.toContain('records')
    expect(validateTimeline(data)).toEqual([])
  })
})

describe('timeline validation', () => {
  it.each([
    ['unknown lane', (d: TimelineSectionData) => { d.activities[0].lane = 'missing' }, /Unknown timeline lane/],
    ['unknown dependency', (d: TimelineSectionData) => { d.activities[0].depends_on = ['missing'] }, /Unknown dependency/],
    ['self dependency', (d: TimelineSectionData) => { d.activities[0].depends_on = ['validate'] }, /cannot depend on itself/],
    ['early join', (d: TimelineSectionData) => { d.activities[3].start = 100 }, /starts before/],
    ['duplicate activity', (d: TimelineSectionData) => { d.activities[1].id = 'validate' }, /Duplicate activities ID/],
    ['missing group target', (d: TimelineSectionData) => { d.groups[0].activities.push('missing') }, /Unknown grouped activity/],
    ['incomplete groups', (d: TimelineSectionData) => { d.groups = [d.groups[0]] }, /leave some activities unexplained/],
  ])('rejects %s', (_, mutate, message) => {
    const data = sample()
    mutate(data)
    expect(validateTimeline(data).some((d) => message.test(d.message))).toBe(true)
  })

  it('rejects zero-duration dependency cycles', () => {
    const data = sample()
    data.activities.forEach((a) => { a.start = 0; a.duration = 0; a.depends_on = undefined })
    data.activities[0].depends_on = ['records']; data.activities[1].depends_on = ['validate']
    expect(validateTimeline(data).some((d) => /cycle/.test(d.message))).toBe(true)
  })

  it.each([-1, Infinity, NaN])('rejects invalid timing %s', (start) => {
    const data = sample()
    data.activities[0].start = start
    expect(TimelineSectionSchema.safeParse(data).success).toBe(false)
  })
})
