import { lazy } from 'react'

export { EditorPanel } from './components/EditorPanel'
export { VisualFormEditor } from './components/VisualFormEditor'

export { DynamicSchemaForm } from './components/DynamicSchemaForm'

export { useSectionEditorBuffer, formatSectionRawText, parseSectionRawText } from './hooks/useSectionEditorBuffer'

export { buildSectionSaveFiles, buildDownloadFiles, triggerDownload } from './services/okfSave'
export type { SectionSaveFiles } from './services/okfSave'

/** OpenUI Lang code editor (CodeMirror), loaded on demand. */
export const LazyOUICodeEditor = lazy(() => import('./components/OUICodeEditor'))
export type { OUICodeEditorProps } from './components/OUICodeEditor'
export * from './oui-language'
