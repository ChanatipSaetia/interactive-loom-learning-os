import { describe, it, expect } from 'vitest'
import { AUTHORING_EXAMPLE, FACTS_EXAMPLE, HOWTO_EXAMPLE, HOWTO_NARRATION_EXAMPLE, NARRATION_EXAMPLE, TABLE_CHART_EXAMPLE, getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { compileOUITopic } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { sectionBeatsOf, validateOUINarration, validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'
import { parseTopicSource } from '../../../../../../src/core/supporting/authoring-editor/workspace'

describe('Loom authoring prompt', () => {
  it('has a worked example that is a valid single-file topic', () => {
    const [{ topicId, files }] = parseTopicSource(AUTHORING_EXAMPLE)
    expect(topicId).toBe('green-tea')
    const topic = compileOUITopic(files['topic.oui'])
    expect(topic.issues).toEqual([])
    const sections = topic.value!.sections
    expect(Object.keys(files).filter((p) => p !== 'topic.oui').sort()).toEqual(sections.map((s) => `sections/${s}.oui`).sort())
    for (const name of sections) {
      const file = `sections/${name}.oui`
      expect(validateOUISection(files[file], { topicId, sectionName: name, file }).diagnostics, file).toEqual([])
    }
    expect(validateOUISection(files['sections/steep-guide.oui']).payload?.data.type).toBe('openui')
  })

  it('has a valid table and chart example', () => {
    const result = validateOUISection(TABLE_CHART_EXAMPLE, { topicId: 'green-tea', sectionName: 'water-temperature', file: 'sections/water-temperature.oui' })
    expect(result.diagnostics).toEqual([])
    expect(result.payload?.data.type).toBe('openui')
  })

  it('has valid layout examples, the how-to played one beat per child', () => {
    for (const [name, source] of [['cold-brew', HOWTO_EXAMPLE], ['three-teas', FACTS_EXAMPLE]]) {
      const result = validateOUISection(source, { topicId: 'green-tea', sectionName: name, file: `sections/${name}.oui` })
      expect(result.diagnostics, name).toEqual([])
      expect(result.payload?.data.type).toBe('openui')
    }
    expect(sectionBeatsOf(HOWTO_EXAMPLE)?.map((b) => b.id)).toEqual(['title', 'part1', 'part2', 'part3', 'part4'])
    const narration = validateOUINarration(HOWTO_NARRATION_EXAMPLE, HOWTO_EXAMPLE, { sectionName: 'cold-brew' })
    expect(narration.diagnostics).toEqual([])
    expect(narration.payload?.steps.filter((s) => s.beat === 'part2')).toHaveLength(2)
  })

  it('has a narration example that is valid for the example vocabulary section', () => {
    const [{ files }] = parseTopicSource(AUTHORING_EXAMPLE)
    const result = validateOUINarration(NARRATION_EXAMPLE, files['sections/vocabulary.oui'], { sectionName: 'vocabulary' })
    expect(result.diagnostics).toEqual([])
    expect(result.payload?.steps).toHaveLength(5)
  })

  it('explains the topic layout and the three output formats around the OpenUI Lang spec', () => {
    const prompt = getLoomAuthoringPrompt()
    for (const text of ['## Topic Layout', '## Output Formats', '// @loom-topic <topic-id>', '<topic-id>/sections/<name>.oui',
      '## Syntax Rules', '## Component Signatures', '  - correct: true for the one correct choice', AUTHORING_EXAMPLE, '## Standard OpenUI Sections', '// @openui "<Section title>"', 'https://openui.com/docs/api-reference/react-ui',
      '### Tables and Charts', 'Table(columns: Col[])', '### Layouts for Other Content', 'Steps(items: StepsItem[])', HOWTO_EXAMPLE, FACTS_EXAMPLE, HOWTO_NARRATION_EXAMPLE, 'BarChart(labels: string[], series: Series[]', TABLE_CHART_EXAMPLE, '## Loom Authoring Rules',
      '## Narration Files', 'sections/<name>.narrate.oui', NARRATION_EXAMPLE, 'Spotlight(targets: string[])']) {
      expect(prompt, text).toContain(text)
    }
    expect(prompt).not.toMatch(/streaming|charts for trends|every program must define `root = Topic|\.loom\.json|JSON bundle/i)
  })
})
