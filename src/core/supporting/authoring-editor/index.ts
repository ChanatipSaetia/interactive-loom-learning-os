import { lazy } from 'react'

export { VisualFormEditor } from './components/VisualFormEditor'

export { DynamicSchemaForm } from './components/DynamicSchemaForm'

/** OpenUI Lang code editor (CodeMirror), loaded on demand. */
export const LazyOUICodeEditor = lazy(() => import('./components/OUICodeEditor'))
export type { OUICodeEditorProps } from './components/OUICodeEditor'
export * from './oui-language'
