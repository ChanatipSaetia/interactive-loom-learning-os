import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { SectionRegistry } from './core/learning-engine/registry'
import './styles/app.css'

SectionRegistry.register('intro', () => import('./core/learning-engine/sub-contexts/progressive-content/components/intro'))
SectionRegistry.register('text', () => import('./core/learning-engine/sub-contexts/progressive-content/components/text'))
SectionRegistry.register('bullets', () => import('./core/learning-engine/sub-contexts/progressive-content/components/bullets'))
SectionRegistry.register('flowchart', () => import('./core/learning-engine/sub-contexts/process-simulation/components/flowchart'))
SectionRegistry.register('tradeoff-sandbox', () => import('./core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox'))
SectionRegistry.register('taxonomy-browser', () => import('./core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser'))
SectionRegistry.register('flashcards', () => import('./core/learning-engine/sub-contexts/practice-assessment/components/flashcards'))
SectionRegistry.register('quiz', () => import('./core/learning-engine/sub-contexts/practice-assessment/components/quiz'))
SectionRegistry.register('concept-map', () => import('./core/learning-engine/sub-contexts/practice-assessment/components/concept-map'))
SectionRegistry.register('scenario', () => import('./core/learning-engine/sub-contexts/process-simulation/components/scenario'))
SectionRegistry.register('decision-tree', () => import('./core/learning-engine/sub-contexts/tradeoff-sandbox/components/decision-tree'))
SectionRegistry.register('image-gallery', () => import('./core/learning-engine/sub-contexts/progressive-content/components/image-gallery'))
SectionRegistry.register('formula-sandbox', () => import('./core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox'))
SectionRegistry.register('reflection-sequence', () => import('./core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence'))
SectionRegistry.register('reflection-template', () => import('./core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
