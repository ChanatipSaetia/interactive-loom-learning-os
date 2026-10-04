/**
 * "Create with AI" — a phone-friendly guide page (create.html) for writing
 * Loom topics with Claude or Gemini: copy, download or share the published
 * authoring prompt, set up a Claude Project or Gemini Gem, ask, then open
 * the answer in Loom Viewer. `?ai=gemini` preselects the assistant.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, Download, ExternalLink, Eye, Share2, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import {
  ASSISTANTS,
  EXAMPLE_REQUESTS,
  LOOM_ASSISTANT_NAME,
  LOOM_PROMPT_FILE_NAME,
  LOOM_PROMPT_PATH,
  assistantInstructions,
  type AssistantId,
} from '../core/learning-engine/composition/oui/llm-guide'
import '../core/delivery/web-app-shell/layout.css'

const BASE = import.meta.env.BASE_URL ?? '/'
const PROMPT_URL = `${BASE}${LOOM_PROMPT_PATH}`
const VIEWER_URL = `${BASE}viewer.html`
const ASSISTANT_KEY = 'loom-create-assistant'

function isAssistant(value: unknown): value is AssistantId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ASSISTANTS, value)
}

/** The chosen assistant: `?ai=` wins, then the last choice on this device, else Claude. */
function initialAssistant(): AssistantId {
  const fromUrl = new URLSearchParams(window.location.search).get('ai')
  if (isAssistant(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(ASSISTANT_KEY)
    if (isAssistant(saved)) return saved
  } catch {
    // Storage unavailable (private mode): fall through to the default.
  }
  return 'claude'
}

/** Copy text; falls back to a hidden textarea where the Clipboard API is missing or refused. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand?.('copy') ?? false
    area.remove()
    return ok
  }
}

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function promptFile(text: string): File {
  return new File([text], LOOM_PROMPT_FILE_NAME, { type: 'text/plain' })
}

/** True where the browser can share a file (phones: "Save to Files", AirDrop, other apps). */
function canShareFiles(): boolean {
  try {
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [promptFile('')] })
  } catch {
    return false
  }
}

type PromptState = { status: 'loading' } | { status: 'ready'; text: string } | { status: 'error' }

/** The published prompt, fetched up front so Copy runs inside the tap (iOS requires that). */
function usePrompt(): PromptState {
  const [state, setState] = useState<PromptState>({ status: 'loading' })
  useEffect(() => {
    let cancelled = false
    fetch(PROMPT_URL)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => !cancelled && setState({ status: 'ready', text }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [])
  return state
}

/** Button that copies `text` and confirms for two seconds. */
function CopyButton({ text, label, primary, testId }: { text: string | null; label: string; primary?: boolean; testId: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    if (text === null) return
    setState((await copyText(text)) ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }
  return (
    <button type="button" className={`create-button${primary ? ' create-button--primary' : ''}`} onClick={onClick} disabled={text === null} data-testid={testId}>
      {state === 'copied' ? <Check size={16} /> : <Copy size={16} />}
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="create-step" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`}><span className="create-step-number" aria-hidden>{n}</span>{title}</h2>
      {children}
    </section>
  )
}

export function CreateApp() {
  const prompt = usePrompt()
  const text = prompt.status === 'ready' ? prompt.text : null
  const [shareable] = useState(canShareFiles)
  const [notice, setNotice] = useState('')
  const [assistantId, setAssistantId] = useState<AssistantId>(initialAssistant)
  const ai = ASSISTANTS[assistantId]
  const instructions = assistantInstructions(assistantId)

  const chooseAssistant = (id: AssistantId) => {
    setAssistantId(id)
    try {
      localStorage.setItem(ASSISTANT_KEY, id)
    } catch {
      // Not remembered; the choice still applies on this page.
    }
    const url = new URL(window.location.href)
    url.searchParams.set('ai', id)
    window.history.replaceState(null, '', url)
  }

  const share = useCallback(async () => {
    if (text === null) return
    try {
      await navigator.share({ files: [promptFile(text)], title: LOOM_PROMPT_FILE_NAME })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setNotice('Sharing did not work here. Use Download instead.')
    }
  }, [text])

  const sizeKb = text === null ? null : Math.round(new Blob([text]).size / 1024)

  return (
    <UISystemProvider>
      <div className="app-layout create">
        <header className="topnav">
          <a className="topnav-title create-brand" href={BASE}>
            <Sparkles size={16} /> Loom
          </a>
          <nav className="create-nav">
            <a className="create-pill" href={VIEWER_URL}><Eye size={15} /> Viewer</a>
            <ThemeToggle />
          </nav>
        </header>

        <main className="create-main">
          <div className="create-hero">
            <h1>Create a Loom topic with {ai.label}</h1>
            <p>Give {ai.label} the Loom prompt once, ask for any topic, and open the answer in Loom Viewer as an interactive lesson.</p>
            <div className="create-switch" role="radiogroup" aria-label="AI assistant">
              {Object.values(ASSISTANTS).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={a.id === assistantId}
                  className={a.id === assistantId ? 'is-active' : ''}
                  onClick={() => chooseAssistant(a.id)}
                  data-testid={`create-assistant-${a.id}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <Step n={1} title="Get the Loom prompt">
            <p>
              One file that teaches {ai.label} the Loom format: every section type, the rules and a full example.
              {sizeKb !== null && <span className="create-muted"> ({sizeKb} KB)</span>}
            </p>
            <div className="create-actions" data-testid="create-prompt-actions">
              <CopyButton text={text} label="Copy prompt" primary testId="create-copy-prompt" />
              <button type="button" className="create-button" onClick={() => text !== null && downloadText(text, LOOM_PROMPT_FILE_NAME)} disabled={text === null} data-testid="create-download-prompt">
                <Download size={16} /> Download .md
              </button>
              {shareable && (
                <button type="button" className="create-button" onClick={share} disabled={text === null} data-testid="create-share-prompt">
                  <Share2 size={16} /> Share / Save to Files
                </button>
              )}
            </div>
            {prompt.status === 'loading' && <p className="create-muted">Loading the prompt…</p>}
            {prompt.status === 'error' && (
              <p className="create-error" role="alert">
                Could not load the prompt. Open it directly: <a href={PROMPT_URL}>{LOOM_PROMPT_FILE_NAME}</a>
              </p>
            )}
            {notice && <p className="create-error" role="alert">{notice}</p>}
            <p className="create-small"><a href={PROMPT_URL} target="_blank" rel="noreferrer">View the prompt <ExternalLink size={12} /></a></p>
          </Step>

          <Step n={2} title={`Set up a ${ai.label} ${ai.workspace} (once)`}>
            <ol className="create-list">
              <li>
                {ai.createStep.split(LOOM_ASSISTANT_NAME)[0]}<strong>{LOOM_ASSISTANT_NAME}</strong>{ai.createStep.split(LOOM_ASSISTANT_NAME)[1]}{' '}
                <a href={ai.url} target="_blank" rel="noreferrer">Open {ai.label} <ExternalLink size={12} /></a>
              </li>
              <li>
                Add the prompt to the <strong>{ai.knowledge}</strong>: upload the downloaded <code>{LOOM_PROMPT_FILE_NAME}</code>.
                If you can't upload files on your phone, do this step once from a computer, or use the one-off chat below.
              </li>
              <li>
                Paste these into the {ai.workspace}'s <strong>instructions</strong>:
                <div className="create-actions">
                  <CopyButton text={instructions} label="Copy instructions" testId="create-copy-instructions" />
                </div>
                <details className="create-details">
                  <summary>Show instructions</summary>
                  <pre data-testid="create-instructions">{instructions}</pre>
                </details>
              </li>
            </ol>
            <p className="create-tip">
              <strong>Just trying it once?</strong> Skip the {ai.workspace}: start a {ai.label} chat, attach the file (or paste the prompt), then ask for your topic.
            </p>
          </Step>

          <Step n={3} title="Ask for a topic">
            <p>Start a new chat with the {ai.workspace} and say what you want to learn or teach. For example:</p>
            <ul className="create-examples">
              {EXAMPLE_REQUESTS.map((request, i) => (
                <li key={request}>
                  <span className="create-example-text">{request}</span>
                  <CopyButton text={request} label="Copy" testId={`create-copy-example-${i}`} />
                </li>
              ))}
            </ul>
          </Step>

          <Step n={4} title="Open it in Loom Viewer">
            <p>
              {ai.label} writes the whole topic into one {ai.document}. Copy or download it, save it as <code>&lt;topic-id&gt;.loom.oui</code>,
              then choose <strong>Open file</strong> in Loom Viewer.
            </p>
            <div className="create-actions">
              <a className="create-button create-button--primary" href={VIEWER_URL} data-testid="create-open-viewer"><Eye size={16} /> Open Loom Viewer</a>
            </div>
          </Step>

          <Step n={5} title="Fix and improve">
            <p>
              If Viewer shows an error for a section, copy the error into the same chat and say <em>"Fix these"</em>. Ask for changes the same
              way (<em>"make the quiz harder"</em>, <em>"add a flowchart"</em>). {ai.label} updates the {ai.document}; save it again and reopen it.
            </p>
            <p className="create-tip">
              When the Loom prompt is updated, download it again and replace the file in your {ai.workspace}.
            </p>
          </Step>
        </main>
      </div>
    </UISystemProvider>
  )
}
