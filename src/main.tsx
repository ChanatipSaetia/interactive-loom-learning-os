import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { SectionRegistry } from './core/registry'
import { TopicRegistry } from './core/topic-registry'
import './styles/app.css'

// Section registration
import TextSection from './sections/text'
import BulletsSection from './sections/bullets'
import Flowchart from './sections/flowchart'
import TradeoffSandboxSection from './sections/tradeoff-sandbox'
import TaxonomyBrowserSection from './sections/taxonomy-browser'
import FlashcardDeck from './sections/flashcards'

// Topic registration
import DemoTopic from './topics/demo'


SectionRegistry.register('text', TextSection as ComponentType<unknown>)
SectionRegistry.register('bullets', BulletsSection as ComponentType<unknown>)
SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>)
SectionRegistry.register('tradeoff-sandbox', TradeoffSandboxSection as ComponentType<unknown>)
SectionRegistry.register('taxonomy-browser', TaxonomyBrowserSection as ComponentType<unknown>)
SectionRegistry.register('flashcards', FlashcardDeck as ComponentType<unknown>)
TopicRegistry.register('demo', DemoTopic)


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
