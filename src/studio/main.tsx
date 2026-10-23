import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { StudioApp } from './StudioApp'
import { applyStoredTheme } from '../core/ui-system/theme/useTheme'
import { installGlassLens } from '../core/ui-system/theme/glass-lens'
import '../styles/app.css'
import './studio.css'

applyStoredTheme()
installGlassLens()

registerCoreSections()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioApp />
  </StrictMode>,
)
