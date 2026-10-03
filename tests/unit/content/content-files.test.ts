/**
 * Every committed OpenUI Lang content file must compile and validate:
 * the catalog, each topic manifest, and each section (no tier 1/2/3 diagnostics),
 * and all cross-file references (TopicRef → topic.oui, SectionRef → section file)
 * must resolve.
 */
import { describe, it, expect } from 'vitest'
import { compileOUICatalog, compileOUITopic } from '../../../src/core/learning-engine/composition/oui/compile'
import { validateOUISection } from '../../../src/core/learning-engine/validation/oui-gateway'

declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { query: string; import: string; eager: true }): Record<string, T>
  }
}

const FILES = import.meta.glob<string>('/public/content/**/*.oui', { query: '?raw', import: 'default', eager: true })
const file = (rel: string) => FILES[`/public/content/${rel}`]

const catalog = compileOUICatalog(file('index.oui') ?? '')

describe('public/content', () => {
  it('has a valid catalog', () => {
    expect(catalog.issues).toEqual([])
    expect(catalog.value?.topics.length).toBeGreaterThan(0)
  })

  for (const topicId of catalog.value?.topics ?? []) {
    describe(topicId, () => {
      const topic = compileOUITopic(file(`${topicId}/topic.oui`) ?? '')

      it('has a valid topic.oui', () => {
        expect(file(`${topicId}/topic.oui`), 'topic.oui exists').toBeDefined()
        expect(topic.issues).toEqual([])
        expect(topic.value?.sections.length).toBeGreaterThan(0)
      })

      it('has valid sections for every SectionRef', () => {
        for (const name of topic.value?.sections ?? []) {
          const rel = `${topicId}/sections/${name}.oui`
          expect(file(rel), `${rel} exists`).toBeDefined()
          const result = validateOUISection(file(rel)!, { topicId, sectionName: name, file: rel })
          expect(result.diagnostics, rel).toEqual([])
        }
      })
    })
  }

  it('has no section files that no topic includes', () => {
    const referenced = new Set(
      (catalog.value?.topics ?? []).flatMap((t) =>
        (compileOUITopic(file(`${t}/topic.oui`) ?? '').value?.sections ?? []).map((s) => `/public/content/${t}/sections/${s}.oui`)),
    )
    const orphans = Object.keys(FILES).filter((f) => f.includes('/sections/') && !referenced.has(f))
    expect(orphans).toEqual([])
  })
})
