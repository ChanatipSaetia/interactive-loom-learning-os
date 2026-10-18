/**
 * TopicWorkspace — Loom Studio's model of one topic folder.
 *
 *   topic.oui                    → manifest (title, category, …, section order)
 *   sections/<name>.oui          → section sources
 *   sections/<name>.narrate.oui  → optional narration for Present mode (grill-log-presenting-mode.md, decision 91)
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
import { validateOUINarration, validateOUISection } from '../../../learning-engine/validation/oui-gateway'
import { narrationPath, type NarrationData } from '../../../learning-engine/composition/oui/narration'
import type { ValidationResult } from '../../../learning-engine/validation/types'
import type { OKFSectionData, OKFSectionMeta } from '../../../learning-engine/composition/okf/types'
import type { TopicFolder } from './folder'
import type { TopicFiles } from './archive'
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
  /** The section's narration file, if it has one (or one is being written). */
  narration: NarrationState | null
}

export interface NarrationState {
  /** Current (possibly unsaved) source; empty means the file is removed on save. */
  source: string
  /** Source as last written to disk ('' when the file does not exist yet). */
  savedSource: string
  validation: ValidationResult<NarrationData | null>
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

function validateNarration(topicId: string, name: string, source: string, sectionSource: string): ValidationResult<NarrationData | null> {
  return validateOUINarration(source, sectionSource, { topicId, sectionName: name, file: narrationPath(name) })
}

function narrationState(topicId: string, name: string, source: string, savedSource: string, sectionSource: string): NarrationState {
  return { source, savedSource, validation: validateNarration(topicId, name, source, sectionSource) }
}

const narrationDirty = (n: NarrationState | null) => !!n && n.source !== n.savedSource

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
    readonly folder: TopicFolder,
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

    const files = await folder.listFiles('sections')
    const onDisk = files.filter((f) => f.endsWith('.oui') && !f.endsWith('.narrate.oui')).map((f) => f.slice(0, -4))
    const sections: SectionState[] = []
    for (const name of listed) {
      const source = await folder.readText(sectionPath(name))
      if (source === null) {
        notices.push(`sections/${name}.oui is listed in topic.oui but missing; removed it from the list.`)
        continue
      }
      sections.push(await TopicWorkspace.readSection(folder, name, source))
    }
    for (const name of onDisk.filter((n) => !listed.includes(n))) {
      const source = (await folder.readText(sectionPath(name)))!
      notices.push(`sections/${name}.oui was not listed in topic.oui; added it at the end.`)
      sections.push(await TopicWorkspace.readSection(folder, name, source))
    }
    for (const file of files.filter((f) => f.endsWith('.narrate.oui'))) {
      if (!sections.some((s) => `${s.name}.narrate.oui` === file)) notices.push(`sections/${file} has no section of that name; it is left as it is.`)
    }
    return new TopicWorkspace(folder, metadata, { ...metadata }, sections, listed, notices)
  }

  /**
   * Replace the folder's content with `files` (topic.oui + sections/*.oui),
   * deleting section files that are not in `files`. Reopen the folder
   * afterwards to edit the imported topic.
   */
  static async replaceFolderContents(folder: TopicFolder, files: Record<string, string>): Promise<void> {
    const topicSource = files[TOPIC_FILE]
    if (topicSource === undefined) throw new WorkspaceError('The imported topic has no topic.oui.')
    const topic = compileOUITopic(topicSource)
    const errors = topic.issues.filter((i) => i.tier < 3)
    if (!topic.value || errors.length) {
      throw new WorkspaceError(`The imported topic.oui has errors:\n${errors.map((i) => `  ${i.line ? `line ${i.line}: ` : ''}${i.message}`).join('\n')}`)
    }
    for (const [path, text] of Object.entries(files)) await folder.writeText(path, text)
    for (const file of await folder.listFiles('sections')) {
      const path = `sections/${file}`
      if (file.endsWith('.oui') && !(path in files)) await folder.remove(path)
    }
  }

  private static async readSection(folder: TopicFolder, name: string, source: string): Promise<SectionState> {
    const narration = await folder.readText(narrationPath(name))
    return TopicWorkspace.sectionState(folder.name, name, source, source, undefined, narration === null ? null : { source: narration, savedSource: narration })
  }

  /** A section's state; its narration is validated again against the (new) section source. */
  private static sectionState(
    topicId: string,
    name: string,
    source: string,
    savedSource: string,
    previous?: SectionState,
    narration: Pick<NarrationState, 'source' | 'savedSource'> | null = previous?.narration ?? null,
  ): SectionState {
    const validation = validate(topicId, name, source)
    return {
      name,
      source,
      savedSource,
      validation,
      lastValid: usable(validation) ?? previous?.lastValid ?? null,
      narration: narration && narrationState(topicId, name, narration.source, narration.savedSource, source),
    }
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
      dirtySections: this.sections.filter((s) => s.source !== s.savedSource || narrationDirty(s.narration)).map((s) => s.name),
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

  /** Every file of the topic as currently edited (unsaved changes included). */
  exportFiles(): TopicFiles {
    const files: Record<string, string> = {
      [TOPIC_FILE]: printOUITopic({ ...this.metadata, sections: this.sections.map((s) => s.name) }),
    }
    for (const s of this.sections) {
      files[sectionPath(s.name)] = s.source
      if (s.narration?.source.trim()) files[narrationPath(s.name)] = s.narration.source
    }
    return { topicId: this.folder.name, files }
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

  /**
   * Set a section's narration source (buffered until save). The first call starts a narration file;
   * an empty source removes the file on save.
   */
  setNarration(name: string, source: string) {
    const index = this.sections.findIndex((s) => s.name === name)
    if (index < 0) return
    const section = this.sections[index]
    if (section.narration?.source === source || (!section.narration && !source)) return
    const narration = narrationState(this.folder.name, name, source, section.narration?.savedSource ?? '', section.source)
    this.sections = this.sections.map((s, i) => (i === index ? { ...s, narration } : s))
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

  /**
   * Add a section without writing anything: the file and topic.oui are
   * written by `save()` (an AI assistant's proposal, grill-log-ai-assistant.md).
   */
  insertSection(name: string, source: string, index = this.sections.length) {
    const problem = this.checkSectionName(name)
    if (problem) throw new WorkspaceError(problem)
    const sections = [...this.sections]
    sections.splice(Math.max(0, Math.min(index, sections.length)), 0, TopicWorkspace.sectionState(this.folder.name, name, source, ''))
    this.sections = sections
    this.emit()
  }

  /** Put the sections in `names` order without writing (saved with topic.oui). Every section must be listed once. */
  setSectionOrder(names: readonly string[]) {
    const byName = new Map(this.sections.map((s) => [s.name, s]))
    if (names.length !== byName.size || names.some((n) => !byName.has(n)) || new Set(names).size !== names.length) {
      throw new WorkspaceError('The section order must list every section exactly once.')
    }
    if (names.join('\n') === this.sections.map((s) => s.name).join('\n')) return
    this.sections = names.map((n) => byName.get(n)!)
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
    for (const s of this.sections.filter((x) => narrationDirty(x.narration))) {
      const narration = s.narration as NarrationState
      if (narration.source.trim()) await this.folder.writeText(narrationPath(s.name), narration.source)
      else if (narration.savedSource) await this.folder.remove(narrationPath(s.name))
    }
    this.sections = this.sections.map((s) => ({
      ...s,
      savedSource: s.source,
      narration: s.narration && (s.narration.source.trim() ? { ...s.narration, savedSource: s.narration.source } : null),
    }))
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
    if (current.narration?.savedSource) {
      await this.folder.writeText(narrationPath(to), current.narration.savedSource)
      await this.folder.remove(narrationPath(from))
    }
    const renamed = TopicWorkspace.sectionState(this.folder.name, to, current.source, current.savedSource, current)
    await this.commitOrder(this.sections.map((s) => (s.name === from ? renamed : s)))
  }

  async deleteSection(name: string): Promise<void> {
    await this.folder.remove(sectionPath(name))
    if (this.section(name)?.narration?.savedSource) await this.folder.remove(narrationPath(name))
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
