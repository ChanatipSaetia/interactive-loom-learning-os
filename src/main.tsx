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

// Topic registration
import DemoTopic from './topics/demo'
import AiOperatingModelTopic from './topics/ai-operating-model'
import DddTopic from './topics/ddd'
import A2aA2uiTopic from './topics/a2a-a2ui'
import DocPipelineTopic from './topics/doc-pipeline'
import EcommerceOrdersTopic from './topics/ecommerce-orders'

SectionRegistry.register('text', TextSection as ComponentType<unknown>)
SectionRegistry.register('bullets', BulletsSection as ComponentType<unknown>)
SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>)
SectionRegistry.register('tradeoff-sandbox', TradeoffSandboxSection as ComponentType<unknown>)
SectionRegistry.register('taxonomy-browser', TaxonomyBrowserSection as ComponentType<unknown>)
TopicRegistry.register('demo', DemoTopic)
TopicRegistry.register('ai-operating-model', AiOperatingModelTopic)
TopicRegistry.register('ddd', DddTopic)
TopicRegistry.register('a2a-a2ui', A2aA2uiTopic)
TopicRegistry.register('doc-pipeline', DocPipelineTopic)
TopicRegistry.register('ecommerce-orders', EcommerceOrdersTopic)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
