import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { SectionRegistry } from './core/registry'
import './styles/app.css'

SectionRegistry.register('intro', () => import('./sections/intro'))
SectionRegistry.register('text', () => import('./sections/text'))
SectionRegistry.register('bullets', () => import('./sections/bullets'))
SectionRegistry.register('flowchart', () => import('./core/subdomains/process-simulation/components/flowchart'))
SectionRegistry.register('tradeoff-sandbox', () => import('./sections/tradeoff-sandbox'))
SectionRegistry.register('taxonomy-browser', () => import('./sections/taxonomy-browser'))
SectionRegistry.register('flashcards', () => import('./sections/flashcards'))
SectionRegistry.register('quiz', () => import('./sections/quiz'))
SectionRegistry.register('concept-map', () => import('./sections/concept-map'))
SectionRegistry.register('scenario', () => import('./core/subdomains/process-simulation/components/scenario'))
SectionRegistry.register('decision-tree', () => import('./sections/decision-tree'))
SectionRegistry.register('image-gallery', () => import('./sections/image-gallery'))
SectionRegistry.register('formula-sandbox', () => import('./sections/formula-sandbox'))
SectionRegistry.register('reflection-sequence', () => import('./sections/reflection-sequence'))
SectionRegistry.register('reflection-template', () => import('./sections/reflection-template'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
