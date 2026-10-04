import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CreateApp } from './CreateApp'
import '../styles/app.css'
import './create.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CreateApp />
  </StrictMode>,
)
