import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { registerCoreSections } from './core/learning-engine/registry/register-core-sections'
import { applyStoredTheme } from './core/ui-system/theme/useTheme'
import './styles/app.css'

applyStoredTheme()

registerCoreSections()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
