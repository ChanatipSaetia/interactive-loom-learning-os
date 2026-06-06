import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import './styles/app.css'
import './sections/architecture-flow'
import './sections/data-flow'
import './sections/step-by-step'
import './sections/text'
import './sections/bullets'
import './sections/flowchart'
import './sections/situation-choice'
import './sections/tradeoff-sandbox'
import './sections/taxonomy-browser'
import './topics/demo'
import './topics/ai-agent'
import './topics/ai-operating-model'
import './topics/agentops'
import './topics/ai-governance'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
