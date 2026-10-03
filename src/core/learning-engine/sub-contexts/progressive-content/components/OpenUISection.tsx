import { lazy } from 'react'

/**
 * Lazily loaded: the renderer pulls in the standard OpenUI component library
 * (`@openuidev/react-ui`, charts, markdown, …), which should only load when an
 * `openui` section is actually shown. Render it inside a `<Suspense>`.
 */
export const OpenUISection = lazy(() => import('./openui'))
export type { OpenUISectionProps } from './openui'
export { OpenUIHelpModal } from './openui/OpenUIHelpModal'
