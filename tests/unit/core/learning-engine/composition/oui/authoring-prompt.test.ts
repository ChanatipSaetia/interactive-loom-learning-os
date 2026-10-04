import { describe, it, expect } from 'vitest'
import { AUTHORING_EXAMPLE, getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
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
  })

  it('explains the topic layout and the three output formats around the OpenUI Lang spec', () => {
    const prompt = getLoomAuthoringPrompt()
    for (const text of ['## Topic Layout', '## Output Formats', '// @loom-topic <topic-id>', '<topic-id>/sections/<name>.oui',
      '## Syntax Rules', '## Component Signatures', '  - correct: true for the one correct choice', AUTHORING_EXAMPLE, '## Loom Authoring Rules']) {
      expect(prompt, text).toContain(text)
    }
    expect(prompt).not.toMatch(/streaming|charts for trends|every program must define `root = Topic|\.loom\.json|JSON bundle/i)
  })
})
