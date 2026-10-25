import { createRoot } from 'react-dom/client'
import { App } from '@modelcontextprotocol/ext-apps'
import { registerCoreSections } from '../core/learning-engine/registry/register-core-sections'
import { registerCorePresenters } from '../core/learning-engine/registry/register-core-presenters'
import { installGlassLens } from '../core/ui-system/theme/glass-lens'
import { McpApp, themeForHost } from './McpApp'
import '../styles/app.css'
import '../viewer/viewer.css'
import './mcp-app.css'

// The chat's theme arrives with the handshake; until then, follow the system (decision 196).
document.documentElement.dataset.theme = themeForHost(undefined)
installGlassLens()

registerCoreSections()
registerCorePresenters()

const app = new App({ name: 'Loom', version: '1.0.0' }, {})

// No StrictMode: the app connects to the chat once.
createRoot(document.getElementById('root')!).render(<McpApp app={app} />)
