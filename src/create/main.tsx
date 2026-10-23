import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CreateApp } from './CreateApp'
import { applyStoredTheme } from '../core/ui-system/theme/useTheme'
import { installGlassLens } from '../core/ui-system/theme/glass-lens'
import '../styles/app.css'
import './create.css'

applyStoredTheme()
installGlassLens()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CreateApp />
  </StrictMode>,
)
