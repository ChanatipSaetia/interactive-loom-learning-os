import { expect, it } from 'vitest'
import { readReference, referencePaths } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { getUnifiedOUISpec } from '../../../src/core/learning-engine/composition/oui/library'

it('offers peer candidates by task and keeps capability reads progressive', () => {
  const index = readReference('capabilities/index.md')
  expect(index).toHaveProperty('content')
  if (!('content' in index)) throw new Error('Missing capability index')
  for (const name of ['TextContent', 'Table', 'LineChart', 'Steps', 'TradeoffSandbox', 'Flowchart', 'ImageGallery']) {
    expect(index.content).toContain(`capabilities/${name}.md`)
    const leaf = readReference(`capabilities/${name}.md`)
    expect(leaf).toHaveProperty('content', expect.stringContaining(`components/${name}.md`))
    expect(leaf).toHaveProperty('content', expect.not.stringContaining('QuizChoice('))
  }
  expect(index.content).not.toMatch(/LessonText|standard versus|native sections/i)
  expect(index.content).not.toContain('Table(columns:')
  expect(Math.ceil(index.content!.length / 4)).toBeLessThanOrEqual(1800)
})

it('uses a single task catalog with no missing, duplicate or retired contracts', () => {
  const spec = getUnifiedOUISpec()
  const names = spec.componentGroups.flatMap((group) => group.components)
  expect(new Set(names).size).toBe(names.length)
  expect([...names].sort()).toEqual(Object.keys(spec.components).sort())
  expect(spec.components).not.toHaveProperty('LessonText')
  expect(referencePaths()).not.toContain('components/LessonText.md')
  expect(readReference('components/LessonText.md')).toHaveProperty('error', 'REFERENCE_NOT_FOUND')
})

it('reviews equivalent media compositions without preferring a prebuilt implementation', async () => {
  const { topicPlanReview } = await import('../../../src/core/learning-engine/composition/oui/topic-plan')
  const review = (gallery: string) => topicPlanReview({
    schemaVersion: 1, topicId: 'visual-examples', goal: 'Compare visual examples',
    objectives: [{ id: 'recognize', description: 'Recognize the visual differences', evidenceOfLearning: 'Explain one distinguishing feature.' }],
    sections: [{ id: 'examples', title: 'Compare examples', objectiveRefs: ['recognize'], components: ['TextContent', gallery],
      activity: 'Inspect the labelled images and explain their differences.', rationale: 'Images preserve the visual distinctions while captions explain the relevant features.',
      presentation: { target: 'both', strategy: 'Read allows inspection; Present focuses the labelled examples.' } }],
  }, true).advisoryDiagnostics
  expect(review('ImageGallery')).toEqual(review('LearningGallery'))
  expect(review('ImageGallery').some((warning) => warning.code === 'UNJUSTIFIED_TEXT_SELECTION')).toBe(false)
})
