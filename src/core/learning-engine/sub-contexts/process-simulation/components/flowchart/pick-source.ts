/**
 * Where a drawn flowchart node or line came from, for Loom Studio / Viewer
 * Pick mode (grill-log-pick-and-comment.md, decisions 48 and 51).
 * `deriveSchema` builds new entities with generated IDs (`pol_<step>`,
 * `cmd_<step>`, `evt_<event>`, `engine2` for a system's second use), so this
 * maps those IDs back to the OpenUI element and prop that declared them:
 * actors and systems to their declaring statement (every copy, every view),
 * policies and commands to their step's prop, events to the inline `Event`.
 */
import type { FlowchartRelation } from './types'
import type { BranchOption, FlowStep, LinearStep } from './abstract-flow/types'
import type { PickAnchorAttributes, PickAnchorFn } from '../../../../../ui-system/pick-anchor'

export interface PickSource {
  components: readonly string[]
  id: string
  prop?: string | number
}

const STEP = ['Step', 'BranchOption'] as const
const PARTICIPANT = ['Actor', 'System'] as const

type Handler = LinearStep | BranchOption

const idOf = (value: unknown): string =>
  typeof value === 'string' ? value : ((value as { id?: string } | undefined)?.id ?? '')

/** Linear steps and branch options: everything with a policy, command and events. */
function handlers(steps: readonly FlowStep[]): Handler[] {
  return steps.flatMap((s): Handler[] => ('branches' in s && Array.isArray(s.branches) ? s.branches : [s as LinearStep]))
}

const branches = (steps: readonly FlowStep[]) =>
  steps.filter((s): s is Extract<FlowStep, { branches: unknown }> => 'branches' in s && Array.isArray(s.branches))

/** The step (or option) that produces event `eventId`, with the event's index. */
function producer(steps: readonly FlowStep[], eventId: string): { step: Handler; index: number } | undefined {
  for (const step of handlers(steps)) {
    const index = (step.resultEvents ?? []).findIndex((e) => e.id === eventId)
    if (index >= 0) return { step, index }
  }
  return undefined
}

/** Candidate sources for an entity, best first. */
export function entityPickSources(entityId: string, steps: readonly FlowStep[] = []): PickSource[] {
  const prefixed = /^(pol|cmd|evt)_(.+)$/.exec(entityId)
  if (prefixed) {
    const [, kind, id] = prefixed
    if (kind === 'pol') return [{ components: STEP, id, prop: 'policy' }]
    if (kind === 'cmd') return [{ components: STEP, id, prop: 'command' }]
    // A branch can fork on an event no step declares; then point at the branch.
    const fork = branches(steps).find((b) => b.event === id)
    return [{ components: ['Event'], id }, ...(fork ? [{ components: ['Branch'], id: fork.id, prop: 'event' }] : [])]
  }
  // Actors and systems; a later use in another step is `<id>2`, `<id>3`, …
  const base = entityId.replace(/\d+$/, '')
  return [{ components: PARTICIPANT, id: entityId }, ...(base && base !== entityId ? [{ components: PARTICIPANT, id: base }] : [])]
}

/** Candidate sources for a relation drawn in Event Storming, best first. */
export function relationPickSources(rel: FlowchartRelation, steps: readonly FlowStep[] = []): PickSource[] {
  const from = /^(pol|cmd|evt)_(.+)$/.exec(rel.from)
  const to = /^(pol|cmd|evt)_(.+)$/.exec(rel.to)
  const step = (id: string, prop: string): PickSource => ({ components: STEP, id, prop })

  if (rel.sendsTo && from?.[1] === 'evt') {
    const made = producer(steps, from[2])
    return made ? [step(made.step.id, 'sendsTo')] : []
  }
  if (!from && to?.[1] === 'pol') return [step(to[2], 'initiatedBy')]
  if (from?.[1] === 'pol' && to?.[1] === 'cmd') return [step(from[2], 'command')]
  if (from?.[1] === 'cmd' && rel.handledBy) return [step(from[2], 'handledBy')]
  if (to?.[1] === 'evt' && from?.[1] !== 'evt') {
    const made = producer(steps, to[2])
    return made ? [step(made.step.id, `events[${made.index}]`)] : []
  }
  if (from?.[1] === 'evt' && to) {
    // A fork's event fans out to each option's policy.
    const option = branches(steps).find((b) => b.event === from[2])?.branches.find((o) => `pol_${o.id}` === rel.to)
    if (option) return [{ components: ['BranchOption'], id: option.id }]
    const made = producer(steps, from[2])
    return made ? [step(made.step.id, 'continuesAs')] : []
  }
  if (!from && !to) {
    // Handler → delegate.
    const delegate = rel.to.replace(/\d+$/, '')
    const owner = handlers(steps).find((s) => [rel.to, delegate].includes(idOf(s.delegatesTo)))
    return owner ? [step(owner.id, 'delegatesTo')] : []
  }
  return []
}

/** Data attributes for the first source the open file declares. */
export function pickFirst(pick: PickAnchorFn, sources: PickSource[]): PickAnchorAttributes {
  for (const source of sources) {
    const attributes = pick.byId(source.components, source.id, source.prop)
    if (attributes['data-oui-anchor']) return attributes
  }
  return {}
}
