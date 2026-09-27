/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
/**
 * Parity snapshot harness for the OKF loading pipeline
 * (grill-log-okf-loading-pipeline.md, Q11 / Implied Story 1).
 *
 * The snapshots record the component props every real topic in public/okf
 * produced under the original hand-written reader. The gateway-owned pipeline
 * (storage → validateSectionFiles → toSectionConfigs) must reproduce them.
 *
 * Two props were renamed on purpose (Q10), and are mapped back before comparing:
 *   - flowchart: `flow` (AbstractFlow) replaces the pre-derived `schema`
 *   - pillar-layer: payload fields are spread instead of nested under `section`
 *
 * Regenerate intentionally with: npx vitest run -u parity-snapshot
 */
import { describe, it, expect, beforeEach } from 'vitest'
// @ts-ignore
import * as fs from 'fs'
// @ts-ignore
import * as path from 'path'
import { NodeFsStorageAdapter } from '../../../../../../src/core/delivery/adapters/node-fs-storage'
import { loadOKFBundle, clearOKFCache } from '../../../../../../src/core/learning-engine/composition/okf/loader'
import { toSectionConfig } from '../../../../../../src/core/learning-engine/composition/okf/section-config'
import { deriveSchema } from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive'
import type { OKFBundledSection } from '../../../../../../src/core/learning-engine/composition/okf/types'

// @ts-ignore
const OKF_ROOT = path.resolve(process.cwd(), 'public/okf')
const storage = new NodeFsStorageAdapter(OKF_ROOT)

function discoverTopics(): string[] {
  return fs
    .readdirSync(OKF_ROOT, { withFileTypes: true })
    .filter((d: any) => d.isDirectory() && fs.existsSync(path.join(OKF_ROOT, d.name, 'index.md')))
    .map((d: any) => d.name)
    .sort()
}

/**
 * Object key order is not compared (schemas and hand-written mappers emit fields in
 * different orders), so keys are sorted recursively. Array order is compared.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
        : v,
    2,
  )
}

/** Map the two intentionally renamed props back to their original shape. */
function toRecordedProps(section: OKFBundledSection): { type: string; props: Record<string, unknown> } {
  const { type, props } = toSectionConfig(section)
  const data = section.data as Record<string, any>
  const recorded = { ...props }
  if (type === 'flowchart') {
    delete recorded.flow
    recorded.schema = deriveSchema(data.flow)
  }
  if (type === 'pillar-layer') {
    for (const key of Object.keys(data)) if (key !== 'title') delete recorded[key]
    recorded.section = data
  }
  return { type, props: recorded }
}

async function captureTopic(topicId: string) {
  const bundle = await loadOKFBundle(topicId, storage)
  return {
    snapshot: bundle.map((section) => ({ folder: section.sectionFolder, ...toRecordedProps(section) })),
    failed: bundle
      .filter((section) => section.validation?.status === 'error')
      .map((section) => ({ folder: section.sectionFolder, diagnostics: section.validation?.diagnostics })),
  }
}

describe('OKF loading pipeline parity snapshots', () => {
  beforeEach(() => clearOKFCache())

  it.each(discoverTopics())('%s', async (topicId) => {
    const { snapshot, failed } = await captureTopic(topicId)
    expect(failed).toEqual([])
    await expect(stableStringify(snapshot) + '\n').toMatchFileSnapshot(`./__parity__/${topicId}.json`)
  })
})
