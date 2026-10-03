/**
 * OpenUI Lang content pipeline — library, compiler, reader, React bridge.
 * See grill-log-openui-input.md.
 */
export {
  compileOUISection,
  compileOUITopic,
  compileOUICatalog,
  compileSectionElement,
  compileElementTree,
  indexStatementLines,
} from './compile'
export type {
  OUIIssue,
  OUIIssueCode,
  OUISourceMap,
  OUICompileResult,
  OUISectionPayload,
  OUITopicManifest,
  OUICatalogManifest,
} from './compile'

export {
  loomOUILibrary,
  getLoomOUIJSONSchema,
  getLoomOUIComponent,
  LOOM_OUI_COMPONENTS,
  OUI_SECTION_TYPES,
} from './library'

export {
  loadOUICatalog,
  loadOUICatalogTopicIds,
  loadOUITopic,
  loadOUITopicManifest,
  loadOUISection,
  getCachedOUITopic,
  clearOUICache,
  getContentBase,
  sectionPath,
  OUILoadError,
} from './reader'
export type { OUIBundledSection, OUITopicBundle } from './reader'

export { createLoomReactLibrary, OUISectionRenderer } from './react'
export type { RenderSectionFn, OUISectionRendererProps } from './react'
