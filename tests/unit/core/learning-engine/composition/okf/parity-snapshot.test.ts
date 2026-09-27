/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
/**
 * Parity snapshot harness for the OKF loading pipeline refactor
 * (grill-log-okf-loading-pipeline.md, Q11 / Implied Story 1).
 *
 * Records what the lesson stream currently receives — `loadOKFBundle` +
 * `bundleToSections` over every real topic in public/okf — as one JSON file per
 * topic. The content migration and the new gateway-owned pipeline must keep
 * these snapshots unchanged.
 *
 * Regenerate intentionally with: npx vitest run -u parity-snapshot
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
// @ts-ignore
import * as fs from 'fs'
// @ts-ignore
import * as path from 'path'
import { loadOKFBundle, clearOKFCache } from '../../../../../../src/core/learning-engine/composition/okf/reader'
import { bundleToSections } from '../../../../../../src/core/learning-engine/composition/okf/sections'

// @ts-ignore
const OKF_ROOT = path.resolve(process.cwd(), 'public/okf')

function discoverTopics(): string[] {
  return fs
    .readdirSync(OKF_ROOT, { withFileTypes: true })
    .filter((d: any) => d.isDirectory() && fs.existsSync(path.join(OKF_ROOT, d.name, 'index.md')))
    .map((d: any) => d.name)
    .sort()
}

/** Serves `<base>/okf/<path>` from public/okf on disk, mirroring the Vite static server. */
function fsFetch(input: string | URL): Promise<Response> {
  const url = String(input)
  const marker = '/okf/'
  const rel = decodeURIComponent(url.slice(url.indexOf(marker) + marker.length))
  const filePath = path.join(OKF_ROOT, rel)
  if (!filePath.startsWith(OKF_ROOT) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return Promise.resolve(new Response('Not Found', { status: 404 }))
  }
  return Promise.resolve(new Response(fs.readFileSync(filePath, 'utf8'), { status: 200 }))
}

async function captureTopic(topicId: string): Promise<unknown> {
  try {
    const bundle = await loadOKFBundle(topicId)
    const configs = bundleToSections(bundle)
    return configs.map((config, i) => ({ folder: bundle[i].sectionFolder, ...config }))
  } catch (e) {
    return { error: (e as Error).message }
  }
}

describe('OKF loading pipeline parity snapshots', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn(fsFetch))
    clearOKFCache()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
    clearOKFCache()
  })

  it.each(discoverTopics())('%s', async (topicId) => {
    const snapshot = await captureTopic(topicId)
    await expect(JSON.stringify(snapshot, null, 2) + '\n').toMatchFileSnapshot(`./__parity__/${topicId}.json`)
  })
})
