/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * NodeFsStorageAdapter — OKFStoragePort over the local filesystem for Node hosts
 * (CLI validation, the Vite plugin, and tests). Never bundled into the browser app.
 */
// @ts-ignore — Node built-in; the browser tsconfig carries no Node types
import * as fs from 'fs'
// @ts-ignore — Node built-in
import * as path from 'path'
import type { OKFStoragePort } from '../ports'
import type { SectionFiles } from '../../learning-engine/validation/types'
import { isSectionFile, parseTopicIndexSections, type TopicManifest } from '../manifest'

/** Section files in a folder, sorted by name (numeric prefixes set collection order). */
export function listSectionFiles(sectionDir: string): string[] {
  return (fs.readdirSync(sectionDir) as string[])
    .filter((name) => isSectionFile(name) && fs.statSync(path.join(sectionDir, name)).isFile())
    .sort()
}

/** Manifest for one topic folder: every section folder containing a section.md. */
export function buildTopicManifest(topicDir: string): TopicManifest {
  const sectionsDir = path.join(topicDir, 'sections')
  const sections: Record<string, string[]> = {}
  if (!fs.existsSync(sectionsDir)) return { sections }
  for (const folder of (fs.readdirSync(sectionsDir) as string[]).sort()) {
    const dir = path.join(sectionsDir, folder)
    if (fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'section.md'))) {
      sections[folder] = listSectionFiles(dir)
    }
  }
  return { sections }
}

export class NodeFsStorageAdapter implements OKFStoragePort {
  constructor(
    private okfRoot: string,
    private hexmapsRoot?: string,
  ) {}

  /** Section folders in index.md order. */
  async listSections(topicId: string): Promise<string[]> {
    const indexMd = fs.readFileSync(path.join(this.okfRoot, topicId, 'index.md'), 'utf-8') as string
    return parseTopicIndexSections(indexMd)
  }

  /** Every section folder on disk that has a section.md, whether or not index.md links it. */
  async listSectionFolders(topicId: string): Promise<string[]> {
    return Object.keys(buildTopicManifest(path.join(this.okfRoot, topicId)).sections)
  }

  async readSectionFiles(topicId: string, sectionFolder: string): Promise<SectionFiles> {
    const dir = path.join(this.okfRoot, topicId, 'sections', sectionFolder)
    if (!fs.existsSync(dir)) {
      throw new Error(`Section folder not found: ${topicId}/sections/${sectionFolder}`)
    }
    const files: SectionFiles = {}
    for (const name of listSectionFiles(dir)) {
      files[name] = fs.readFileSync(path.join(dir, name), 'utf-8') as string
    }
    return files
  }

  async readHexMap(topicId: string): Promise<string> {
    if (!this.hexmapsRoot) throw new Error('NodeFsStorageAdapter was created without a hexmaps root.')
    return fs.readFileSync(path.join(this.hexmapsRoot, `${topicId}.yaml`), 'utf-8') as string
  }

  async listTopics(): Promise<string[]> {
    return (fs.readdirSync(this.okfRoot) as string[])
      .filter((name) => fs.existsSync(path.join(this.okfRoot, name, 'index.md')))
      .sort()
  }
}
