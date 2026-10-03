import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { ViewerApp } from './ViewerApp'
import '../styles/app.css'
import './viewer.css'

registerCoreSections()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewerApp />
  </StrictMode>,
)
