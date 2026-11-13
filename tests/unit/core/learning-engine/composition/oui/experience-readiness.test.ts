import { describe, expect, it } from 'vitest'
import { reviewTopicPlan, validateTopicPlan, type TopicPlan } from '../../../../../../src/core/learning-engine/composition/oui/topic-plan'

const plan = (component: string, overrides: Partial<TopicPlan['sections'][number]> = {}): TopicPlan => ({
  schemaVersion: 1, topicId: 'lesson', goal: 'Follow setup instructions',
  objectives: [{ id: 'setup', description: 'Initialize a scene', evidenceOfLearning: 'Explain each required initialization step' }],
  sections: [{ id: 'setup', title: 'Setup', components: [component], objectiveRefs: ['setup'], activity: 'Follow numbered setup instructions', rationale: 'Numbered concise steps preserve the required order without extra modeling.', presentation: { target: 'both', strategy: 'Reveal one numbered instruction per beat; Read keeps the checklist visible.' }, ...overrides }],
})
const codes = (p: TopicPlan) => reviewTopicPlan(p).map((d) => d.code)

describe('advisory experience readiness', () => {
  it.each(['Follow numbered setup instructions', 'Check prerequisites before initializing the renderer', 'Read concise key points and supporting details'])('accepts first-class Bullets: %s', (activity) => {
    const p = plan('Bullets', { activity })
    expect(validateTopicPlan(p)).toEqual([])
    expect(reviewTopicPlan(p)).toEqual([])
  })
  it('flags weak/missing decisions without changing structural valid semantics', () => {
    const p = plan('LessonText', { activity: 'Learn', rationale: 'best', presentation: undefined })
    p.objectives[0].description = 'Compare system architecture and data relationships'
    expect(validateTopicPlan(p)).toEqual([])
    expect(codes(p)).toEqual(expect.arrayContaining(['WEAK_LEARNER_ACTION', 'WEAK_RATIONALE', 'MISSING_PRESENTATION_STRATEGY', 'UNJUSTIFIED_TEXT_SELECTION']))
    expect(reviewTopicPlan(p).every((d) => d.severity === 'warning' && d.path && d.message)).toBe(true)
  })
  it('accepts justified connected prose even for a comparison goal', () => {
    const p = plan('LessonText', { activity: 'Read the nuanced comparison argument', rationale: 'Connected prose preserves qualifications and uncertainty; a numeric matrix would imply unsupported precision.' })
    p.objectives[0].description = 'Compare nuanced interpretations'
    expect(reviewTopicPlan(p)).toEqual([])
  })
  it('requires an intended OpenUI composition, not an interactivity quota', () => {
    expect(codes(plan('Table', { rationale: 'Explain the facts clearly' }))).toContain('MISSING_OPENUI_COMPOSITION')
    expect(reviewTopicPlan(plan('Table', { rationale: 'A static factual table supports lookup across the same attributes.' }))).toEqual([])
    expect(codes(plan('BarChart', { rationale: 'A bar chart compares benchmark performance' }))).toContain('CHART_DATA_UNVERIFIED')
    expect(codes(plan('BarChart', { rationale: 'A bar chart uses explicitly labelled illustrative data to teach reading axes.' }))).not.toContain('CHART_DATA_UNVERIFIED')
  })
  it.each(['event-storming', 'architecture', 'swimlanes', 'sequence', 'data-flow', 'state-machine'])('accepts one explicit primary Flowchart view: %s', (view) => {
    expect(reviewTopicPlan(plan('Flowchart', { presentation: { target: 'both', strategy: `initialView: "${view}"; follow the authored Journey path.` } }))).toEqual([])
  })
  it('warns about missing/unsupported explicit views', () => {
    expect(codes(plan('Flowchart'))).toContain('MISSING_FLOWCHART_VIEW')
    expect(codes(plan('Flowchart', { presentation: { target: 'present', strategy: 'initialView: "gantt" to show timing' } }))).toContain('UNSUPPORTED_FLOWCHART_VIEW')
  })
  it('flags exact repeated contributions and permits complementary bundles', () => {
    const p = plan('Bullets')
    p.sections.push({ ...p.sections[0], id: 'copy' })
    expect(codes(p)).toContain('POSSIBLE_REDUNDANT_SECTION')
    p.sections[1] = { ...p.sections[1], components: ['ReflectionSequence'], activity: 'Reconstruct the required initialization order', rationale: 'Practice ordering after the numbered instructions.' }
    expect(reviewTopicPlan(p)).toEqual([])
  })
  it('keeps exposure separate from assessment and malformed plans separate from advisory review', () => {
    const p = plan('Flashcards'); p.objectives[0].evidenceOfLearning = 'Flip all the cards'
    expect(codes(p)).toContain('ENGAGEMENT_AS_LEARNING_EVIDENCE')
    expect(reviewTopicPlan(null)).toEqual([])
  })
})

it('reviews a composition without classifying the entire page by its supporting text', () => {
  const prose = plan('LessonText', {
    activity: 'Compare matching factual attributes',
    rationale: 'A table aligns matching factual attributes; supporting prose explains the comparison.',
  })
  expect(codes(prose)).toContain('UNJUSTIFIED_TEXT_SELECTION')
  prose.sections[0].components = ['Stack', 'Table', 'LessonText']
  expect(codes(prose)).not.toContain('UNJUSTIFIED_TEXT_SELECTION')
  prose.sections[0].components = ['Stack', 'LessonText', 'Flowchart', 'BarChart']
  prose.sections[0].rationale = 'A diagram explains the process and quantities.'
  expect(codes(prose)).toEqual(expect.arrayContaining(['MISSING_FLOWCHART_VIEW', 'CHART_DATA_UNVERIFIED']))
})
