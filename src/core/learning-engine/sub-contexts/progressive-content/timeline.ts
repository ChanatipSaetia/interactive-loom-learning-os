import { z } from 'zod'
import type { ValidationDiagnostic } from '../../validation/types'

const id = z.string().trim().min(1)
export const TIMELINE_COLORS = ['blue', 'teal', 'green', 'mauve', 'peach', 'sky', 'yellow', 'pink', 'lavender'] as const
export const TimelineLaneSchema = z.object({ id, title: z.string().min(1), color: z.enum(TIMELINE_COLORS).optional() })
export const TimelineActivitySchema = z.object({
  id, title: z.string().min(1), lane: id,
  start: z.number().finite().min(0), duration: z.number().finite().min(0),
  description: z.string().optional(), depends_on: z.array(id).optional(),
})
export const TimelineGroupSchema = z.object({
  id, title: z.string().min(1), activities: z.array(id).min(1), description: z.string().optional(),
})
export const TimelineSectionSchema = z.object({
  type: z.literal('timeline'), title: z.string().optional(), unit: z.string().trim().min(1).default('ms'),
  lanes: z.array(TimelineLaneSchema).min(1), activities: z.array(TimelineActivitySchema).min(1),
  groups: z.array(TimelineGroupSchema).default([]), description: z.string().optional(), takeaway: z.string().optional(),
})
export type TimelineSectionData = z.infer<typeof TimelineSectionSchema>
export type TimelineLane = z.infer<typeof TimelineLaneSchema>
export type TimelineActivity = z.infer<typeof TimelineActivitySchema>
export type TimelineGroup = z.infer<typeof TimelineGroupSchema>

/** Finish-to-start dependencies are explicit; overlap alone never invents a dependency. */
export function validateTimeline(data: TimelineSectionData): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const error = (field: string, message: string, fixHint: string) => diagnostics.push({ tier: 3, field, message, fixHint })
  for (const key of ['lanes', 'activities', 'groups'] as const) {
    const seen = new Set<string>()
    data[key].forEach((item, i) => {
      if (seen.has(item.id)) error(`${key}[${i}].id`, `Duplicate ${key} ID "${item.id}".`, 'Give each item a unique ID within its list.')
      seen.add(item.id)
    })
  }
  const lanes = new Set(data.lanes.map((l) => l.id))
  const activities = new Map(data.activities.map((a) => [a.id, a]))
  data.activities.forEach((a, i) => {
    if (!lanes.has(a.lane)) error(`activities[${i}].lane`, `Unknown timeline lane "${a.lane}".`, 'Use the ID of a declared TimelineLane.')
    if (!Number.isFinite(a.start + a.duration)) error(`activities[${i}].duration`, 'Activity end time exceeds the numeric range.', 'Use smaller finite start and duration values in a suitable unit.')
    for (const dependency of a.depends_on ?? []) {
      const source = activities.get(dependency)
      if (!source) error(`activities[${i}].depends_on`, `Unknown dependency "${dependency}".`, 'Use a declared activity ID.')
      else if (dependency === a.id) error(`activities[${i}].depends_on`, 'An activity cannot depend on itself.', 'Remove the self-dependency.')
      else if (source.start + source.duration > a.start) error(`activities[${i}].depends_on`, `"${a.title}" starts before "${source.title}" finishes.`, 'Move its start to or after the dependency end, or remove the finish-to-start dependency.')
    }
  })
  const visiting = new Set<string>(), visited = new Set<string>()
  const visit = (activity: string): boolean => {
    if (visiting.has(activity)) return true
    if (visited.has(activity)) return false
    visiting.add(activity)
    for (const dependency of activities.get(activity)?.depends_on ?? []) if (activities.has(dependency) && visit(dependency)) return true
    visiting.delete(activity); visited.add(activity)
    return false
  }
  if (data.activities.some((a) => visit(a.id))) error('activities', 'Timeline dependencies contain a cycle.', 'Make dependencies point to earlier completed work without circular waits.')
  const covered = new Set<string>()
  data.groups.forEach((group, i) => group.activities.forEach((activity) => {
    covered.add(activity)
    if (!activities.has(activity)) error(`groups[${i}].activities`, `Unknown grouped activity "${activity}".`, 'Use a declared activity ID.')
  }))
  if (data.groups.length && data.activities.some((a) => !covered.has(a.id))) error('groups', 'Presentation groups leave some activities unexplained.', 'Include every activity in at least one group, or omit groups to explain shared start times automatically.')
  return diagnostics
}
