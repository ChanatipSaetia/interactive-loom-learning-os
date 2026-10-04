/**
 * "Create with AI" — a phone-friendly guide page (create.html) for writing
 * Loom topics with Claude, Gemini or Microsoft 365 Copilot (copy, download
 * or share the published authoring prompt, set up a Claude Project, Gemini
 * Gem or Copilot agent, ask, then open the answer in Loom Viewer), or with a
 * coding agent such as Claude Code or opencode (install the Loom skill, ask,
 * open the topic folder it writes). `?ai=gemini` / `?ai=copilot` / `?ai=agent`
 * preselects the tab.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, Download, ExternalLink, Eye, Share2, Sparkles } from 'lucide-react'
import { LoomToolsNav } from '../core/delivery/web-app-shell/LoomToolsNav'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { copyText } from '../core/ui-system/clipboard'
import {
  ASSISTANTS,
  EXAMPLE_REQUESTS,
  LOOM_ASSISTANT_NAME,
  LOOM_PROMPT_FILE_NAME,
  LOOM_PROMPT_PATH,
  LOOM_SKILL_NAME,
  LOOM_SKILL_PATH,
  SKILL_TOOLS,
  skillInstallCommand,
  skillInstallPrompt,
  assistantInstructions,
  type AssistantGuide,
  type AssistantId,
} from '../core/learning-engine/composition/oui/llm-guide'
import '../core/delivery/web-app-shell/layout.css'

const BASE = import.meta.env.BASE_URL ?? '/'
const PROMPT_URL = `${BASE}${LOOM_PROMPT_PATH}`
const VIEWER_URL = `${BASE}viewer.html`
const ASSISTANT_KEY = 'loom-create-assistant'

/** A guide tab: one of the chat assistants, or coding agents with the Loom skill. */
type GuideId = AssistantId | 'agent'

const TABS: Array<{ id: GuideId; label: string }> = [
  ...Object.values(ASSISTANTS).map(({ id, label }) => ({ id, label })),
  { id: 'agent', label: 'Claude Code / opencode' },
]

function isGuide(value: unknown): value is GuideId {
  return value === 'agent' || (typeof value === 'string' && Object.prototype.hasOwnProperty.call(ASSISTANTS, value))
}

/** The chosen tab: `?ai=` wins, then the last choice on this device, else Claude. */
function initialGuide(): GuideId {
  const fromUrl = new URLSearchParams(window.location.search).get('ai')
  if (isGuide(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(ASSISTANT_KEY)
    if (isGuide(saved)) return saved
  } catch {
    // Storage unavailable (private mode): fall through to the default.
  }
  return 'claude'
}

function downloadText(text: string, fileName: string) {
  const type = fileName.endsWith('.md') ? 'text/markdown' : 'text/plain'
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function promptFile(text: string, fileName = LOOM_PROMPT_FILE_NAME): File {
  return new File([text], fileName, { type: 'text/plain' })
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
  const [guideId, setGuideId] = useState<GuideId>(initialGuide)
  /** The chat assistant, or null on the coding-agent tab. */
  const ai = guideId === 'agent' ? null : ASSISTANTS[guideId]
  const promptFileName = ai?.promptFileName ?? LOOM_PROMPT_FILE_NAME

  const chooseGuide = (id: GuideId) => {
    setGuideId(id)
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
      await navigator.share({ files: [promptFile(text, promptFileName)], title: promptFileName })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setNotice('Sharing did not work here. Use Download instead.')
    }
  }, [text, promptFileName])

  const sizeKb = text === null ? null : Math.round(new Blob([text]).size / 1024)

  return (
    <UISystemProvider>
      <div className="app-layout create">
        <header className="topnav">
          <a className="topnav-title create-brand" href={BASE}>
            <Sparkles size={16} /> Loom
          </a>
          <nav className="create-nav">
            <LoomToolsNav current="create" />
            <ThemeToggle />
          </nav>
        </header>

        <main className="create-main">
          <div className="create-hero">
            <h1>Create a Loom topic with {ai ? ai.label : 'Claude Code or opencode'}</h1>
            <p>
              {ai
                ? `Give ${ai.label} the Loom prompt once, ask for any topic, and open the answer in Loom Viewer as an interactive lesson.`
                : 'Install the Loom skill once, ask your coding agent for any topic, and open the topic folder it writes in Loom Viewer as an interactive lesson.'}
            </p>
            <div className="create-switch" role="radiogroup" aria-label="AI assistant">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="radio"
                  aria-checked={tab.id === guideId}
                  className={tab.id === guideId ? 'is-active' : ''}
                  onClick={() => chooseGuide(tab.id)}
                  data-testid={`create-assistant-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {ai ? (
            <ChatGuide
              ai={ai}
              prompt={prompt}
              text={text}
              sizeKb={sizeKb}
              shareable={shareable}
              share={share}
              notice={notice}
            />
          ) : <AgentGuide />}
        </main>
      </div>
    </UISystemProvider>
  )
}

function ExampleRequests() {
  return (
    <ul className="create-examples">
      {EXAMPLE_REQUESTS.map((request, i) => (
        <li key={request}>
          <span className="create-example-text">{request}</span>
          <CopyButton text={request} label="Copy" testId={`create-copy-example-${i}`} />
        </li>
      ))}
    </ul>
  )
}

/** Steps for a chat assistant: prompt, Project/Gem/agent, ask, open, fix. */
function ChatGuide({ ai, prompt, text, sizeKb, shareable, share, notice }: {
  ai: AssistantGuide
  prompt: PromptState
  text: string | null
  sizeKb: number | null
  shareable: boolean
  share: () => void
  notice: string
}) {
  const instructions = assistantInstructions(ai.id)
  return (
    <>
      <Step n={1} title="Get the Loom prompt">
        <p>
          One file that teaches {ai.label} the Loom format: every section type, the rules and a full example.
          {sizeKb !== null && <span className="create-muted"> ({sizeKb} KB)</span>}
        </p>
        <div className="create-actions" data-testid="create-prompt-actions">
          <CopyButton text={text} label="Copy prompt" primary testId="create-copy-prompt" />
          <button type="button" className="create-button" onClick={() => text !== null && downloadText(text, ai.promptFileName)} disabled={text === null} data-testid="create-download-prompt">
            <Download size={16} /> Download .{ai.promptFileName.split('.').pop()}
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
        {ai.note && <p className="create-tip" data-testid="create-assistant-note">{ai.note}</p>}
        <ol className="create-list">
          <li>
            {ai.createStep.split(LOOM_ASSISTANT_NAME)[0]}<strong>{LOOM_ASSISTANT_NAME}</strong>{ai.createStep.split(LOOM_ASSISTANT_NAME)[1]}{' '}
            <a href={ai.url} target="_blank" rel="noreferrer">Open {ai.label} <ExternalLink size={12} /></a>
          </li>
          <li>
            Add the prompt to the <strong>{ai.knowledge}</strong>: upload the downloaded <code>{ai.promptFileName}</code>.
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
        <ExampleRequests />
      </Step>

      <Step n={4} title="Open it in Loom Viewer">
        <p>
          {ai.label} writes the whole topic into one {ai.document}. Copy it, open Loom Viewer, tap <strong>Paste text</strong>, paste and
          press <strong>Open</strong>. On a computer you can just press Ctrl/Cmd+V on Viewer's start screen. Prefer a file? Save it as{' '}
          <code>&lt;topic-id&gt;.loom.oui</code> and use <strong>Open file</strong>.
        </p>
        <div className="create-actions">
          <a className="create-button create-button--primary" href={VIEWER_URL} data-testid="create-open-viewer"><Eye size={16} /> Open Loom Viewer</a>
        </div>
      </Step>

      <Step n={5} title="Fix and improve">
        <p>
          If Viewer shows an error for a section, copy the error into the same chat and say <em>"Fix these"</em>. Ask for changes the same
          way (<em>"make the quiz harder"</em>, <em>"add a flowchart"</em>). {ai.editsInPlace ? `${ai.label} updates the ${ai.document}` : `${ai.label} writes the whole topic again in a new ${ai.document}`}; copy and paste it into Viewer again.
        </p>
        <p className="create-tip">
          When the Loom prompt is updated, download it again and replace the file in your {ai.workspace}.
        </p>
      </Step>
    </>
  )
}

/** Steps for a coding agent (Claude Code, opencode): install the skill, ask, open, fix. */
function AgentGuide() {
  const skillPrompt = skillInstallPrompt()
  return (
    <>
      <Step n={1} title="Install the Loom skill (once)">
        <p>
          The <code>{LOOM_SKILL_NAME}</code> skill teaches the agent the Loom format. Copy the install steps and paste them into Claude Code
          or opencode: the agent downloads the skill for you.
        </p>
        <div className="create-actions">
          <CopyButton text={skillPrompt} label="Copy install steps" primary testId="create-copy-skill-steps" />
        </div>
        <details className="create-details">
          <summary>Show install steps</summary>
          <pre data-testid="create-skill-steps">{skillPrompt}</pre>
        </details>
        <details className="create-details">
          <summary>Or run it yourself in a terminal (macOS, Linux or WSL)</summary>
          <ul className="create-examples">
            {SKILL_TOOLS.map((tool) => {
              const command = skillInstallCommand(tool.dir)
              return (
                <li key={tool.id} className="create-command">
                  <span className="create-example-text"><strong>{tool.label}</strong> <span className="create-muted">({tool.note})</span></span>
                  <pre data-testid={`create-skill-command-${tool.id}`}>{command}</pre>
                  <CopyButton text={command} label="Copy" testId={`create-copy-skill-${tool.id}`} />
                </li>
              )
            })}
          </ul>
        </details>
        <p className="create-small">
          <a href={`${BASE}${LOOM_SKILL_PATH}/SKILL.md`} target="_blank" rel="noreferrer">View the skill <ExternalLink size={12} /></a>
        </p>
        <p className="create-tip">
          <strong>Working in the Interactive Loom repository?</strong> The skill is already in <code>.claude/skills/</code>; skip this step.
        </p>
      </Step>

      <Step n={2} title="Ask for a topic">
        <p>Start a new Claude Code or opencode session in any folder (new, so it loads the skill) and say what you want to learn or teach. For example:</p>
        <ExampleRequests />
      </Step>

      <Step n={3} title="Open it in Loom Viewer">
        <p>
          The agent writes a topic folder there: <code>&lt;topic-id&gt;/topic.oui</code> plus one <code>sections/&lt;name&gt;.oui</code> per
          section. Open Loom Viewer, use <strong>Open folder</strong> and pick <code>&lt;topic-id&gt;</code>; or open it in Loom Studio to edit it
          with a live preview. In the Interactive Loom repository it writes <code>public/content/&lt;topic-id&gt;/</code> and checks it with the
          content tests; see it with <code>npm run dev</code>.
        </p>
        <div className="create-actions">
          <a className="create-button create-button--primary" href={VIEWER_URL} data-testid="create-open-viewer"><Eye size={16} /> Open Loom Viewer</a>
        </div>
      </Step>

      <Step n={4} title="Fix and improve">
        <p>
          If Viewer shows errors, press <strong>Copy errors for your AI chat</strong> and paste them into the agent. Ask for changes the same way
          (<em>"make the quiz harder"</em>, <em>"add a flowchart"</em>). The agent edits the files; open the folder in Viewer again.
        </p>
        <p className="create-tip">When the Loom prompt is updated, run the install steps again to update the skill.</p>
      </Step>
    </>
  )
}
