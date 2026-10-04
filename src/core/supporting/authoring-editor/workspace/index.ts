/**
 * Loom Studio workspace: topic-folder storage port, section templates and the
 * TopicWorkspace store.
 */
export { fileSystemAccessFolder, memoryFolder, pickTopicFolder, supportsFolderPicker } from './folder'
export type { TopicFolder, MemoryFolder } from './folder'
export { SECTION_TEMPLATES, getSectionTemplate, humanize, newTopicSource } from './templates'
export type { SectionTemplate } from './templates'
export { TopicWorkspace, WorkspaceError, compileForForm } from './workspace'
export type { SectionState, TopicMetadata, WorkspaceSnapshot } from './workspace'
export {
  BUNDLE_EXTENSION,
  SOURCE_EXTENSION,
  TopicArchiveError,
  createTopicBundle,
  createTopicSource,
  createTopicZip,
  groupTopicFiles,
  parseTopicBundle,
  parseTopicSource,
  readTopicArchive,
  readTopicFolderFiles,
  readZipEntries,
} from './archive'
export type { TopicFiles } from './archive'
