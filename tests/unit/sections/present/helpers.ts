/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore Node's fs has no types in this project; tests read content fixtures like layout-metrics.ts
import { readFileSync } from 'fs'
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { bundleToSections } from '../../../../src/core/learning-engine/composition/okf/sections'

/** Compile a section the way Loom Viewer does and return its props. */
export function propsOf<T>(source: string): T {
  const result = validateOUISection(source, { topicId: 't', sectionName: 's', file: 'sections/s.oui' })
  if (!result.payload) throw new Error(JSON.stringify(result.diagnostics))
  return bundleToSections([result.payload])[0].props as T
}

/** A section file from the repo's own topics. */
export const content = (path: string): string => readFileSync(`public/content/${path}`, 'utf8')

export const kinds = (beats: Array<{ kind: string }>) => beats.map((b) => b.kind)
