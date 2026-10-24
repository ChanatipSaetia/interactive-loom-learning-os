import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { registerCorePresenters } from '../core/learning-engine/registry/register-core-presenters'
import { ViewerApp } from './ViewerApp'
import { LearnerMemoryProvider, deviceId, indexedDbAdapter, memoryAdapter, migrateProgressOnce } from '../core/supporting/learner-progress'
import { applyStoredTheme } from '../core/ui-system/theme/useTheme'
import { installGlassLens } from '../core/ui-system/theme/glass-lens'
import '../styles/app.css'
import './viewer.css'

applyStoredTheme()
installGlassLens()

registerCoreSections()
registerCorePresenters()

// Learner memory (decisions 143–152): IndexedDB when the browser has it
const memory = typeof indexedDB === 'undefined' ? memoryAdapter() : indexedDbAdapter()
const device = deviceId()
void migrateProgressOnce(memory, device)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LearnerMemoryProvider port={memory} device={device}>
      <ViewerApp />
    </LearnerMemoryProvider>
  </StrictMode>,
)
