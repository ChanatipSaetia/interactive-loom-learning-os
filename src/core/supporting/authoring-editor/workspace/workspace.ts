/**
 * TopicWorkspace — Loom Studio's model of one topic folder.
 *
 *   topic.oui              → manifest (title, category, …, section order)
 *   sections/<name>.oui    → section sources
 *
 * Content edits (section sources, topic metadata) are buffered and written
 * by `save()`. Structural actions (add, rename, delete, reorder) are
 * confirmed in the UI and written immediately, together with `topic.oui`
 * (using the last *saved* metadata, so unsaved metadata edits stay pending).
 *
 * Framework-agnostic: subscribe() + getSnapshot() plug into React's
 * useSyncExternalStore.
 */
import { compileOUISection, compileOUITopic, type OUISectionPayload, type OUITopicManifest } from '../../../learning-engine/composition/oui/compile'
import { CONTENT_ID } from '../../../learning-engine/composition/oui/catalog-gen'
import { printOUISection, printOUITopic } from '../../../learning-engine/composition/oui/print'
import { validateOUISection } from '../../../learning-engine/validation/oui-gateway'
import type { ValidationResult } from '../../../learning-engine/validation/types'
import type { OKFSectionData, OKFSectionMeta } from '../../../learning-engine/composition/okf/types'
import type { TopicFolder } from './folder'
import { getSectionTemplate, newTopicSource } from './templates'

export type TopicMetadata = Omit<OUITopicManifest, 'sections'>

export interface SectionState {
  name: string
  /** Current (possibly unsaved) source. */
  source: string
  /** Source as last written to disk. */
  savedSource: string
  validation: ValidationResult<OUISectionPayload | null>
  /** Latest compiled payload without tier 1/2 errors (for the live preview). */
  lastValid: OUISectionPayload | null
}

export interface WorkspaceSnapshot {
  topicId: string
  metadata: TopicMetadata
  sections: SectionState[]
  /** Section names whose source differs from disk. */
  dirtySections: string[]
  /** Topic metadata or section order differs from topic.oui on disk. */
  topicDirty: boolean
  /** Things fixed up while opening the folder (shown once in the UI). */
  notices: string[]
}

export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkspaceError'
  }
}

const TOPIC_FILE = 'topic.oui'
const sectionPath = (name: string) => `sections/${name}.oui`

function validate(topicId: string, name: string, source: string): ValidationResult<OUISectionPayload | null> {
  return validateOUISection(source, { topicId, sectionName: name, file: sectionPath(name) })
}

function usable(result: ValidationResult<OUISectionPayload | null>): OUISectionPayload | null {
  return result.payload && !result.diagnostics.some((d) => d.tier < 3) ? result.payload : null
}

function sameMetadata(a: TopicMetadata, b: TopicMetadata): boolean {
  const norm = (m: TopicMetadata) => JSON.stringify({
    title: m.title, category: m.category, description: m.description,
    tags: m.tags?.length ? m.tags : undefined, difficulty: m.difficulty || undefined,
    updatedAt: m.updatedAt || undefined, isNew: m.isNew || undefined,
  })
  return norm(a) === norm(b)
}

export class TopicWorkspace {
  private listeners = new Set<() => void>()
  private snapshot: WorkspaceSnapshot

  private constructor(
    private readonly folder: TopicFolder,
    private metadata: TopicMetadata,
    private savedMetadata: TopicMetadata,
    private sections: SectionState[],
    private savedOrder: string[],
    private notices: string[],
  ) {
    this.snapshot = this.buildSnapshot()
  }

  /** Open a topic folder. An empty folder becomes a new topic (topic.oui is created). */
  static async open(folder: TopicFolder): Promise<TopicWorkspace> {
    const notices: string[] = []
    let topicSource = await folder.readText(TOPIC_FILE)
    if (topicSource === null) {
      topicSource = newTopicSource(folder.name)
      await folder.writeText(TOPIC_FILE, topicSource)
      notices.push('Created topic.oui for a new topic.')
    }
    const topic = compileOUITopic(topicSource)
    const errors = topic.issues.filter((i) => i.tier < 3)
    if (!topic.value || errors.length) {
      throw new WorkspaceError(`topic.oui has errors:\n${errors.map((i) => `  ${i.line ? `line ${i.line}: ` : ''}${i.message}`).join('\n')}`)
    }
    const { sections: listed, ...metadata } = topic.value

    const onDisk = (await folder.listFiles('sections')).filter((f) => f.endsWith('.oui')).map((f) => f.slice(0, -4))
    const sections: SectionState[] = []
    for (const name of listed) {
      const source = await folder.readText(sectionPath(name))
      if (source === null) {
        notices.push(`sections/${name}.oui is listed in topic.oui but missing; removed it from the list.`)
        continue
      }
      sections.push(TopicWorkspace.sectionState(folder.name, name, source, source))
    }
    for (const name of onDisk.filter((n) => !listed.includes(n))) {
      const source = (await folder.readText(sectionPath(name)))!
      notices.push(`sections/${name}.oui was not listed in topic.oui; added it at the end.`)
      sections.push(TopicWorkspace.sectionState(folder.name, name, source, source))
    }
    return new TopicWorkspace(folder, metadata, { ...metadata }, sections, listed, notices)
  }

  private static sectionState(topicId: string, name: string, source: string, savedSource: string, previous?: SectionState): SectionState {
    const validation = validate(topicId, name, source)
    return { name, source, savedSource, validation, lastValid: usable(validation) ?? previous?.lastValid ?? null }
  }

  // --- Store plumbing -------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): WorkspaceSnapshot => this.snapshot

  private buildSnapshot(): WorkspaceSnapshot {
    const order = this.sections.map((s) => s.name)
    return {
      topicId: this.folder.name,
      metadata: this.metadata,
      sections: this.sections,
      dirtySections: this.sections.filter((s) => s.source !== s.savedSource).map((s) => s.name),
      topicDirty: !sameMetadata(this.metadata, this.savedMetadata) || order.join('\n') !== this.savedOrder.join('\n'),
      notices: this.notices,
    }
  }

  private emit() {
    this.snapshot = this.buildSnapshot()
    this.listeners.forEach((l) => l())
  }

  get isDirty(): boolean {
    return this.snapshot.dirtySections.length > 0 || this.snapshot.topicDirty
  }

  section(name: string): SectionState | undefined {
    return this.sections.find((s) => s.name === name)
  }

  // --- Content edits (buffered until save) ----------------------------------

  setSource(name: string, source: string) {
    const index = this.sections.findIndex((s) => s.name === name)
    if (index < 0 || this.sections[index].source === source) return
    const previous = this.sections[index]
    this.sections = this.sections.map((s, i) => (i === index ? TopicWorkspace.sectionState(this.folder.name, name, source, previous.savedSource, previous) : s))
    this.emit()
  }

  /** Apply a Visual Form edit by reprinting the section source. */
  setSectionData(name: string, meta: OKFSectionMeta, data: OKFSectionData) {
    this.setSource(name, printOUISection(meta, data))
  }

  updateMetadata(patch: Partial<TopicMetadata>) {
    this.metadata = { ...this.metadata, ...patch }
    this.emit()
  }

  dismissNotices() {
    this.notices = []
    this.emit()
  }

  /** Write every dirty section and, if needed, topic.oui. */
  async save(): Promise<void> {
    for (const s of this.sections.filter((x) => x.source !== x.savedSource)) {
      await this.folder.writeText(sectionPath(s.name), s.source)
    }
    this.sections = this.sections.map((s) => ({ ...s, savedSource: s.source }))
    if (this.snapshot.topicDirty) await this.writeTopic(this.metadata)
    this.emit()
  }

  // --- Structural actions (written immediately) -----------------------------

  /** Validate a new section file name. Returns an error message or null. */
  checkSectionName(name: string, except?: string): string | null {
    if (!CONTENT_ID.test(name)) return 'Use lowercase letters, digits, "-" or "_" (starting with a letter or digit).'
    if (name !== except && this.sections.some((s) => s.name === name)) return `A section named "${name}" already exists.`
    return null
  }

  async addSection(name: string, type: string, title: string, index = this.sections.length): Promise<void> {
    const problem = this.checkSectionName(name)
    if (problem) throw new WorkspaceError(problem)
    const template = getSectionTemplate(type)
    if (!template) throw new WorkspaceError(`Unknown section type "${type}".`)
    const source = template.source(title)
    await this.folder.writeText(sectionPath(name), source)
    const sections = [...this.sections]
    sections.splice(Math.max(0, Math.min(index, sections.length)), 0, TopicWorkspace.sectionState(this.folder.name, name, source, source))
    await this.commitOrder(sections)
  }

  async renameSection(from: string, to: string): Promise<void> {
    if (from === to) return
    const problem = this.checkSectionName(to, from)
    if (problem) throw new WorkspaceError(problem)
    const current = this.section(from)
    if (!current) throw new WorkspaceError(`No section named "${from}".`)
    await this.folder.writeText(sectionPath(to), current.savedSource)
    await this.folder.remove(sectionPath(from))
    const renamed = TopicWorkspace.sectionState(this.folder.name, to, current.source, current.savedSource, current)
    await this.commitOrder(this.sections.map((s) => (s.name === from ? renamed : s)))
  }

  async deleteSection(name: string): Promise<void> {
    await this.folder.remove(sectionPath(name))
    await this.commitOrder(this.sections.filter((s) => s.name !== name))
  }

  async moveSection(from: number, to: number): Promise<void> {
    if (from === to || from < 0 || from >= this.sections.length) return
    const sections = [...this.sections]
    const [moved] = sections.splice(from, 1)
    sections.splice(Math.max(0, Math.min(to, sections.length)), 0, moved)
    await this.commitOrder(sections)
  }

  private async commitOrder(sections: SectionState[]) {
    this.sections = sections
    await this.writeTopic(this.savedMetadata)
    this.emit()
  }

  private async writeTopic(metadata: TopicMetadata) {
    const order = this.sections.map((s) => s.name)
    await this.folder.writeText(TOPIC_FILE, printOUITopic({ ...metadata, sections: order }))
    this.savedMetadata = { ...metadata }
    this.savedOrder = order
  }
}

/** Section meta + data for a compiled source (used by the Visual Form). */
export function compileForForm(source: string): OUISectionPayload | null {
  return compileOUISection(source).value
}
