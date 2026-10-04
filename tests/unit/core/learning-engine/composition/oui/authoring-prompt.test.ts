import { describe, it, expect } from 'vitest'
import { AUTHORING_EXAMPLE, TABLE_CHART_EXAMPLE, getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { compileOUITopic } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'
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

  it('explains the topic layout and the three output formats around the OpenUI Lang spec', () => {
    const prompt = getLoomAuthoringPrompt()
    for (const text of ['## Topic Layout', '## Output Formats', '// @loom-topic <topic-id>', '<topic-id>/sections/<name>.oui',
      '## Syntax Rules', '## Component Signatures', '  - correct: true for the one correct choice', AUTHORING_EXAMPLE, '## Standard OpenUI Sections', '// @openui "<Section title>"', 'https://openui.com/docs/api-reference/react-ui',
      '### Tables and Charts', 'Table(columns: Col[])', 'BarChart(labels: string[], series: Series[]', TABLE_CHART_EXAMPLE, '## Loom Authoring Rules']) {
      expect(prompt, text).toContain(text)
    }
    expect(prompt).not.toMatch(/streaming|charts for trends|every program must define `root = Topic|\.loom\.json|JSON bundle/i)
  })
})
