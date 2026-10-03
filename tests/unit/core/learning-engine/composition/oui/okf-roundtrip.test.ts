/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Every OKF section in public/okf must survive OKF → OpenUI Lang → compile
 * with identical section data and meta. This is the safety net for the
 * OKF → OpenUI migration (scripts/okf-to-oui.ts).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { clearOKFCache, loadOKFBundle } from '../../../../../../src/core/learning-engine/composition/okf/reader'
import type { OKFBundled } from '../../../../../../src/core/learning-engine/composition/okf/types'
import { printOUISection } from '../../../../../../src/core/learning-engine/composition/oui/print'
import { validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'

declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { query: string; import: string; eager: true }): Record<string, T>
  }
}

const OKF_FILES = import.meta.glob<string>('/public/okf/**/*.{md,yaml,yml}', { query: '?raw', import: 'default', eager: true })
const TOPICS = [...new Set(Object.keys(OKF_FILES)
  .map((f) => /^\/public\/okf\/([^/]+)\/index\.md$/.exec(f)?.[1])
  .filter((t): t is string => !!t))].sort()

/** Remove differences that are equivalent for rendering, or fields no component reads. */
function normalize(type: string, data: unknown, metaTitle?: string): unknown {
  const clone = JSON.parse(JSON.stringify(data)) as Record<string, any>
  const dropEmptyChildren = (items: any[] = []) => items.forEach((item) => {
    if (Array.isArray(item.children) && item.children.length === 0) delete item.children
    dropEmptyChildren(item.children)
  })
  if (type === 'bullets') dropEmptyChildren(clone.items)
  if (type === 'intro') {
    clone.roadmap?.forEach((r: any) => delete r.id)
    if (clone.roadmap?.length === 0) delete clone.roadmap
    if (!clone.title || clone.title === metaTitle) delete clone.title
  }
  if (type === 'reflection-sequence' || type === 'reflection-template') clone.challenges?.forEach((c: any) => delete c.id)
  return clone
}

const bundles = new Map<string, OKFBundled>()

beforeAll(async () => {
  (window as unknown as Record<string, unknown>).__OKF_BASE_OVERRIDE__ = '/okf'
  vi.stubGlobal('fetch', async (url: string) => {
    const body = OKF_FILES[`/public${decodeURIComponent(url)}`]
    return body === undefined ? new Response('not found', { status: 404 }) : new Response(body)
  })
  for (const topic of TOPICS) {
    clearOKFCache()
    bundles.set(topic, await loadOKFBundle(topic))
  }
})

afterAll(() => {
  vi.unstubAllGlobals()
  delete (window as unknown as Record<string, unknown>).__OKF_BASE_OVERRIDE__
  clearOKFCache()
})

describe('OKF → OpenUI Lang round trip', () => {
  it('finds the OKF topics', () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(12)
  })

  for (const topic of TOPICS) {
    it(`${topic}: every section prints, validates and compiles back to the same data`, () => {
      const bundle = bundles.get(topic)!
      expect(bundle.length).toBeGreaterThan(0)
      for (const section of bundle) {
        const label = `${topic}/${section.sectionFolder}`
        const source = printOUISection(section.meta, section.data)
        const result = validateOUISection(source)

        expect(result.diagnostics, `${label} diagnostics`).toEqual([])
        const back = result.payload!
        expect(normalize(back.meta.type, back.data, back.meta.title), `${label} data`)
          .toEqual(normalize(section.meta.type, section.data, section.meta.title))
        expect(back.meta, `${label} meta`).toEqual(JSON.parse(JSON.stringify({
          type: section.meta.type,
          title: section.meta.title ?? '',
          resource: '.',
          heading: section.meta.heading,
          ordered: section.meta.ordered,
          intro: section.meta.intro,
        })))
      }
    })
  }
})
