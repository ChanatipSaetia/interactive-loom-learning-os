import { describe, expect, it } from 'vitest'
import source from '../../../samples/viewer-review-demo.loom.oui?raw'
import { readTopicText } from '../../../src/core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic } from '../../../src/viewer/compileTopic'
import { KNOWN_SECTION_TYPES } from '../../../src/core/learning-engine/validation/gateway'
import { coreBeatsOf } from '../../../src/core/learning-engine/registry/register-core-presenters'
import { validateOUISection } from '../../../src/core/learning-engine/validation/oui-gateway'
import type { TradeoffScenario } from '../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/schema'

const topic = readTopicText(source)[0]
const folderFiles = import.meta.glob('../../../public/content/viewer-review-demo/**/*.oui', { eager: true, query: '?raw', import: 'default' })

describe('permanent Viewer review demo', () => {
  it('covers every supported section type once, with valid sources and playable beats', () => {
    const compiled = compileViewerTopic(topic)
    expect(compiled.error).toBeUndefined()
    expect(compiled.narrationErrors).toEqual([])
    const expected = [...KNOWN_SECTION_TYPES].map((type) => type === 'text' ? 'openui' : type).sort()
    expect(compiled.sections.map(({ config }) => config?.type).sort()).toEqual(expected)
    for (const section of compiled.sections) {
      expect(section.error, section.name).toBeUndefined()
      const result = validateOUISection(topic.files[`sections/${section.name}.oui`])
      expect(result.diagnostics, section.name).toEqual([])
      const beats = coreBeatsOf(section.config!)
      expect(beats.length, section.name).toBeGreaterThan(1)
      expect(new Set(beats.map(({ id }) => id)).size, section.name).toBe(beats.length)
    }
  })

  it('keeps the downloadable sample identical to the topic folder', () => {
    for (const [path, content] of Object.entries(topic.files)) {
      expect(folderFiles[`../../../public/content/viewer-review-demo/${path}`], path).toBe(content)
    }
  })

  it('demonstrates four tradeoff decisions with explicit recommendations and combined metrics', () => {
    const section = compileViewerTopic(topic).sections.find(({ config }) => config?.type === 'tradeoff-sandbox')!
    const [scenario] = section.config!.props.scenarios as TradeoffScenario[]
    expect(scenario.steps).toHaveLength(4)
    const totals = Object.fromEntries(scenario.metrics.map((metric) => [metric.id, metric.baseValue]))
    for (const step of scenario.steps) {
      expect(step.choices.length).toBeGreaterThan(1)
      const choice = step.choices.find(({ id }) => id === step.recommended)!
      expect(choice.whyThisFits).toBeTruthy()
      expect(choice.cons.length).toBeGreaterThan(0)
      for (const [id, delta] of Object.entries(choice.metrics)) totals[id] += delta
    }
    expect(totals).toEqual({ speed: 65, depth: 75 })
  })
})
