// The app the shell loads from ASSET_ORIGIN (GitHub Pages in production). It answers the spike's
// questions: did a script from the declared origin run, does fullscreen work, does audio start after
// a click, and can the app talk back to the chat (a message and the model's context).
import { App } from './ext-apps.js'

const root = document.getElementById('root')

// Decision 196: the app's default theme follows the chat app's light or dark mode (host context),
// not the system: Liquid Glass when dark, Liquid Glass Light when light. Loom's own data-theme ids
// are used, so the SDK's applyDocumentTheme (which writes data-theme="light"/"dark") is not.
const HOST_THEMES = { dark: 'liquid-glass', light: 'liquid-glass-light' }
const PALETTES = {
  'liquid-glass': { card: 'rgba(48,52,70,.72)', text: '#c6d0f5', muted: 'rgba(198,208,245,.75)', accent: '#8caaee', onAccent: '#232634', page: '#1e2030' },
  'liquid-glass-light': { card: 'rgba(255,255,255,.72)', text: '#4c4f69', muted: 'rgba(76,79,105,.75)', accent: '#1e66f5', onAccent: '#ffffff', page: '#eef1f8' },
}
function applyHostTheme(theme) {
  const id = HOST_THEMES[theme] ?? (matchMedia('(prefers-color-scheme: light)').matches ? HOST_THEMES.light : HOST_THEMES.dark)
  document.documentElement.dataset.theme = id
  document.body.style.background = PALETTES[id].page
  report('theme', `${id} (host says ${theme ?? 'nothing'})`)
}
const results = {}
const report = (key, value) => {
  results[key] = value
  render()
}

let topic = null

function render() {
  const rows = Object.entries(results).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
  const c = PALETTES[document.documentElement.dataset.theme] ?? PALETTES['liquid-glass']
  root.innerHTML = `
    <div style="font:14px system-ui;padding:12px;border-radius:16px;background:${c.card};color:${c.text};backdrop-filter:blur(18px) saturate(1.6);border:1px solid rgba(255,255,255,.18)">
      <div style="font-weight:600;font-size:16px">${topic ? topic.title : 'Waiting for a topic…'}</div>
      <div style="color:${c.muted};margin:4px 0 10px">${topic ? `${topic.sections} sections · ${topic.chars} characters` : ''}</div>
      <button id="play" style="font:600 14px system-ui;padding:8px 16px;border-radius:999px;border:0;background:${c.accent};color:${c.onAccent};cursor:pointer">▶ Play</button>
      <table style="margin-top:12px;border-collapse:collapse;font-size:12px">${rows}</table>
    </div>`
  document.getElementById('play').onclick = play
}

async function play() {
  // Audio needs a click: start a short tone and the speech voice.
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
    report('audio', ctx.state)
  } catch (e) {
    report('audio', `blocked: ${e.message}`)
  }
  report('speech voices', 'speechSynthesis' in window ? String(speechSynthesis.getVoices().length) : 'no speechSynthesis')
  try {
    const r = await app.requestDisplayMode({ mode: 'fullscreen' })
    report('fullscreen', `host answered ${r.mode}`)
  } catch (e) {
    report('fullscreen', `refused: ${e.message}`)
  }
  try {
    await app.updateModelContext({ content: [{ type: 'text', text: 'Learner pressed Play on the topic.' }] })
    report('model context', 'sent')
  } catch (e) {
    report('model context', `refused: ${e.message}`)
  }
  try {
    await app.sendMessage({ role: 'user', content: [{ type: 'text', text: 'Next topic, please: I finished this one.' }] })
    report('message to chat', 'sent')
  } catch (e) {
    report('message to chat', `refused: ${e.message}`)
  }
}

function describe(oui) {
  const title = /Topic\(\s*"([^"]*)"/.exec(oui)?.[1] ?? 'Untitled topic'
  const sections = (oui.match(/SectionRef\(/g) ?? []).length
  return { title, sections, chars: oui.length }
}

const app = new App({ name: 'loom-spike-app', version: '0.0.1' }, {})
app.ontoolinput = (params) => {
  topic = describe(String(params.arguments?.oui ?? ''))
  report('tool input', 'received')
}
report('script from asset origin', `ran (${location.origin === 'null' ? 'sandboxed origin' : location.origin})`)
app.onhostcontextchanged = (ctx) => {
  if (ctx.theme) applyHostTheme(ctx.theme)
}
await app.connect()
const ctx = app.getHostContext()
applyHostTheme(ctx?.theme)
report('connected to host', `${app.getHostVersion()?.name ?? '?'}; modes: ${(ctx?.availableDisplayModes ?? []).join(', ') || 'not given'}`)
