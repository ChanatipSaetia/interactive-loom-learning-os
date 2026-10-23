/**
 * "Create with AI" — a phone-friendly guide page (create.html) for writing
 * Loom topics with the `loom-topic-writer` agent skill: download it as a
 * zip and upload it to the Claude app, or install it for coding agents
 * (Claude Code, opencode, …) with `npx skills add`; then ask for a topic and
 * open it in Loom Viewer. `?ai=agent` preselects the coding-agent tab.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, Download, ExternalLink, Eye, Sparkles } from 'lucide-react'
import { LoomToolsNav } from '../core/delivery/web-app-shell/LoomToolsNav'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { copyText } from '../core/ui-system/clipboard'
import {
  EXAMPLE_REQUESTS,
  LOOM_REPO,
  LOOM_SKILL_NAME,
  LOOM_SKILL_PATH,
  LOOM_SKILL_ZIP_PATH,
  SKILL_ADD_COMMAND,
  SKILL_UPDATE_COMMAND,
} from '../core/learning-engine/composition/oui/llm-guide'
import '../core/delivery/web-app-shell/layout.css'

const BASE = import.meta.env.BASE_URL ?? '/'
const VIEWER_URL = `${BASE}viewer.html`
const SKILL_URL = `${BASE}${LOOM_SKILL_PATH}/SKILL.md`
const ZIP_URL = `${BASE}${LOOM_SKILL_ZIP_PATH}`
const ASSISTANT_KEY = 'loom-create-assistant'

/** A guide tab: the Claude app (upload the zip) or coding agents (install from the command line). */
type GuideId = 'claude' | 'agent'

const TABS: Array<{ id: GuideId; label: string }> = [
  { id: 'claude', label: 'Claude app' },
  { id: 'agent', label: 'Coding agents' },
]

function isGuide(value: unknown): value is GuideId {
  return value === 'claude' || value === 'agent'
}

/** The chosen tab: `?ai=` wins, then the last choice on this device, else the Claude app. */
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
  const [guideId, setGuideId] = useState<GuideId>(initialGuide)

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
            <h1>{guideId === 'claude' ? 'Create a Loom topic with the Claude app' : 'Create a Loom topic with a coding agent'}</h1>
            <p>
              Add the <code>{LOOM_SKILL_NAME}</code> skill once: it teaches the AI the Loom format, every section type and the rules. Then ask for
              any topic and open it in Loom Viewer as an interactive lesson.
            </p>
            <div className="create-switch" role="radiogroup" aria-label="Where to add the skill">
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

          {guideId === 'claude' ? <ClaudeAppGuide /> : <AgentGuide />}
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

/** A terminal command with its Copy button. */
function Command({ command, testId }: { command: string; testId: string }) {
  return (
    <div className="create-command">
      <pre data-testid={testId}>{command}</pre>
      <CopyButton text={command} label="Copy" testId={`${testId}-copy`} />
    </div>
  )
}

function ViewSkillLink() {
  return (
    <p className="create-small">
      <a href={SKILL_URL} target="_blank" rel="noreferrer">View the skill <ExternalLink size={12} /></a>
    </p>
  )
}

/** Steps for the Claude app (claude.ai, desktop, Cowork): upload the zip, ask, open, fix. */
function ClaudeAppGuide() {
  return (
    <>
      <Step n={1} title="Add the Loom skill (once)">
        <ol className="create-list">
          <li>
            Download the skill. Keep the file zipped.
            <div className="create-actions">
              <a className="create-button create-button--primary" href={ZIP_URL} download data-testid="create-download-skill">
                <Download size={16} /> Download {LOOM_SKILL_NAME}.zip
              </a>
            </div>
          </li>
          <li>
            In Claude (claude.ai or the desktop app), find <strong>Skills</strong>: under <strong>Customize</strong>, or{' '}
            <strong>Settings → Capabilities</strong> in older versions. Code execution (file creation) must be on for skills to run.{' '}
            <a href="https://claude.ai" target="_blank" rel="noreferrer">Open Claude <ExternalLink size={12} /></a>
          </li>
          <li>Choose <strong>Upload skill</strong> (or <strong>+ → Upload a skill</strong>) and pick the zip. Leave it switched on.</li>
        </ol>
        <ViewSkillLink />
        <p className="create-tip">
          On a phone you can download the zip, but upload it from a computer. Once added, the skill works in the Claude app on every device.
        </p>
      </Step>

      <Step n={2} title="Ask for a topic">
        <p>Start a new chat and say what you want to learn or teach. Claude picks up the skill by itself. For example:</p>
        <ExampleRequests />
      </Step>

      <Step n={3} title="Open it in Loom Viewer">
        <p>
          Claude gives you the topic as one <code>&lt;topic-id&gt;.loom.oui</code> file. Download it, open Loom Viewer and use{' '}
          <strong>Open file</strong>, or copy its text and use <strong>Paste text</strong>.
        </p>
        <div className="create-actions">
          <a className="create-button create-button--primary" href={VIEWER_URL} data-testid="create-open-viewer"><Eye size={16} /> Open Loom Viewer</a>
        </div>
      </Step>

      <Step n={4} title="Fix and improve">
        <p>
          If Viewer shows errors, press <strong>Copy errors for your AI chat</strong> and paste them into the same chat. Ask for changes the
          same way (<em>"make the quiz harder"</em>, <em>"add a flowchart"</em>), then open the new file in Viewer.
        </p>
        <p className="create-tip">When the Loom skill is updated, download the zip again and upload it in place of the old one.</p>
      </Step>
    </>
  )
}

/** Steps for coding agents (Claude Code, opencode, Codex, Cursor, …): `npx skills add`, ask, open, fix. */
function AgentGuide() {
  return (
    <>
      <Step n={1} title="Install the Loom skill (once)">
        <p>
          Run this in a terminal (it needs Node.js 22 or later). It asks which of your agents should get the skill, such as Claude Code or
          opencode, and installs it for your user, so it works in every folder.
        </p>
        <Command command={SKILL_ADD_COMMAND} testId="create-skill-add" />
        <p>To update it later:</p>
        <Command command={SKILL_UPDATE_COMMAND} testId="create-skill-update" />
        <p className="create-small">
          The skill comes from <a href={`https://github.com/${LOOM_REPO}`} target="_blank" rel="noreferrer">{LOOM_REPO} <ExternalLink size={12} /></a>{' '}
          via the <a href="https://skills.sh" target="_blank" rel="noreferrer">skills CLI <ExternalLink size={12} /></a>.
        </p>
        <ViewSkillLink />
        <p className="create-tip">
          <strong>Working in the Interactive Loom repository?</strong> The skill is already in <code>.claude/skills/</code>; skip this step.
        </p>
      </Step>

      <Step n={2} title="Ask for a topic">
        <p>Start a new agent session in any folder (new, so it loads the skill) and say what you want to learn or teach. For example:</p>
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
          (<em>"make the quiz harder"</em>, <em>"add a flowchart"</em>). The agent edits the files; press <strong>Refresh</strong> in Viewer.
        </p>
      </Step>
    </>
  )
}
