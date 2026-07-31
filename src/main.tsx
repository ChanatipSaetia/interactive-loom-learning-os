import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { SectionRegistry } from './core/registry'
import './styles/app.css'

SectionRegistry.register('intro', () => import('./core/subdomains/progressive-content/components/intro'))
SectionRegistry.register('text', () => import('./core/subdomains/progressive-content/components/text'))
SectionRegistry.register('bullets', () => import('./core/subdomains/progressive-content/components/bullets'))
SectionRegistry.register('flowchart', () => import('./core/subdomains/process-simulation/components/flowchart'))
SectionRegistry.register('tradeoff-sandbox', () => import('./core/subdomains/tradeoff-sandbox/components/tradeoff-sandbox'))
SectionRegistry.register('taxonomy-browser', () => import('./core/subdomains/progressive-content/components/taxonomy-browser'))
SectionRegistry.register('flashcards', () => import('./sections/flashcards'))
SectionRegistry.register('quiz', () => import('./sections/quiz'))
SectionRegistry.register('concept-map', () => import('./sections/concept-map'))
SectionRegistry.register('scenario', () => import('./core/subdomains/process-simulation/components/scenario'))
SectionRegistry.register('decision-tree', () => import('./core/subdomains/tradeoff-sandbox/components/decision-tree'))
SectionRegistry.register('image-gallery', () => import('./core/subdomains/progressive-content/components/image-gallery'))
SectionRegistry.register('formula-sandbox', () => import('./core/subdomains/tradeoff-sandbox/components/formula-sandbox'))
SectionRegistry.register('reflection-sequence', () => import('./core/subdomains/reflection-synthesis/components/reflection-sequence'))
SectionRegistry.register('reflection-template', () => import('./core/subdomains/reflection-synthesis/components/reflection-template'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
