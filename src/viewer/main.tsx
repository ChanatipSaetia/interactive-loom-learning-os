import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { registerCorePresenters } from '../core/learning-engine/registry/register-core-presenters'
import { ViewerApp } from './ViewerApp'
import { applyStoredTheme } from '../core/ui-system/theme/useTheme'
import '../styles/app.css'
import './viewer.css'

applyStoredTheme()

registerCoreSections()
registerCorePresenters()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewerApp />
  </StrictMode>,
)
