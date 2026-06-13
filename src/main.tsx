import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import './styles/app.css'
import './sections/text'
import './sections/bullets'
import './sections/flowchart'
import './sections/tradeoff-sandbox'
import './sections/taxonomy-browser'
import './topics/demo'
import './topics/ai-operating-model'
import './topics/ddd'
import './topics/a2a-a2ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
