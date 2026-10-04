/**
 * Links between the three standalone Loom pages — Create with AI
 * (create.html), Loom Viewer (viewer.html) and Loom Studio (studio.html) —
 * each with a tooltip that says what the page is for. The current page is
 * marked, not linked.
 */
import { useId } from 'react'
import { Eye, PenLine, Sparkles, type LucideIcon } from 'lucide-react'
import './loom-tools-nav.css'

export type LoomToolId = 'create' | 'viewer' | 'studio'

export interface LoomTool {
  id: LoomToolId
  label: string
  /** Short label shown in the nav. */
  short: string
  file: string
  /** What the page is for, shown in its tooltip. */
  description: string
  icon: LucideIcon
}

export const LOOM_TOOLS: LoomTool[] = [
  {
    id: 'create',
    label: 'Create with AI',
    short: 'Create',
    file: 'create.html',
    description: 'Get the Loom prompt and set up Claude or Gemini to write a topic for you.',
    icon: Sparkles,
  },
  {
    id: 'viewer',
    label: 'Loom Viewer',
    short: 'Viewer',
    file: 'viewer.html',
    description: 'Open a .loom.oui file, a .zip, a topic folder or pasted text as an interactive lesson. Read-only.',
    icon: Eye,
  },
  {
    id: 'studio',
    label: 'Loom Studio',
    short: 'Studio',
    file: 'studio.html',
    description: 'Edit a topic folder on your computer with code, a form and a live preview. Needs Chrome or Edge.',
    icon: PenLine,
  },
]

const BASE = import.meta.env.BASE_URL ?? '/'

export function LoomToolsNav({ current, newTab = false, className }: {
  current: LoomToolId
  /** Open the other pages in a new tab (keeps unsaved work on this page). */
  newTab?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <nav className={`loom-tools${className ? ` ${className}` : ''}`} aria-label="Loom pages" data-testid="loom-tools-nav">
      {LOOM_TOOLS.map((tool) => {
        const Icon = tool.icon
        const tipId = `${id}-${tool.id}`
        const content = (
          <>
            <Icon size={15} />
            <span className="loom-tools-label">{tool.short}</span>
            <span className="loom-tools-tip" role="tooltip" id={tipId}>
              <strong>{tool.label}</strong>
              {tool.id === current ? ' (this page)' : ''}: {tool.description}
            </span>
          </>
        )
        return tool.id === current
          ? (
            <span key={tool.id} className="loom-tools-item is-current" aria-current="page" aria-describedby={tipId} tabIndex={0} data-testid={`loom-tools-${tool.id}`}>
              {content}
            </span>
          )
          : (
            <a
              key={tool.id}
              className="loom-tools-item"
              href={`${BASE}${tool.file}`}
              aria-label={tool.label}
              aria-describedby={tipId}
              {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
              data-testid={`loom-tools-${tool.id}`}
            >
              {content}
            </a>
          )
      })}
    </nav>
  )
}
