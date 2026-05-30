import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './styles/app.css'
import './sections/architecture-flow'
import './sections/data-flow'
import './sections/step-by-step'
import './sections/drag-drop'
import './sections/choice'
import './sections/text'
import './sections/bullets'
import './topics/demo'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
