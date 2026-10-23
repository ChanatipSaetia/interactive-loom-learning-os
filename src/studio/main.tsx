import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { StudioApp } from './StudioApp'
import { applyStoredTheme } from '../core/ui-system/theme/useTheme'
import '../styles/app.css'
import './studio.css'

applyStoredTheme()

registerCoreSections()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioApp />
  </StrictMode>,
)
