import type { TimelineSectionData, TimelineGroup } from './timeline'

export const TIMELINE_GEOMETRY = { width: 1200, left: 300, right: 40, top: 80, row: 84 } as const
export const timelineTime = (value: number) => new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(value)

/** Split labels by words, keeping the same geometry in Read and Present. */
export function timelineLabel(text: string, limit = 24): string[] {
  const lines: string[] = []
  for (const word of text.split(/\s+/)) {
    if (!lines.length || lines[lines.length - 1].length + word.length + 1 > limit) lines.push(word)
    else lines[lines.length - 1] += ` ${word}`
  }
  return lines
}

/** One task per row, earliest start first. Equal starts keep authored order and align horizontally. */
export function layoutTimeline(data: TimelineSectionData, compact = false, endTime?: number) {
  const { width, left, right, top, row } = compact ? { ...TIMELINE_GEOMETRY, width: 720, left: 240, row: 108 } : TIMELINE_GEOMETRY
  const end = endTime ?? Math.max(0, ...data.activities.map((a) => a.start + a.duration))
  const x = (time: number) => left + (time / (end || 1)) * (width - left - right)
  let nextY = top
  const placed = data.activities.map((activity, index) => ({ activity, index }))
    .sort((a, b) => a.activity.start - b.activity.start || a.index - b.index)
    .map(({ activity }) => {
      const lines = timelineLabel(activity.title, compact ? 14 : 24)
      const height = Math.max(row, lines.length * (compact ? 32 : 24) + (compact ? 44 : 40))
      const y = nextY
      nextY += height
      return { activity, lane: data.lanes.find((l) => l.id === activity.lane), x: x(activity.start), y, height, barY: y + (compact ? 30 : 24), width: x(activity.start + activity.duration) - x(activity.start), lines }
    })
  return { end, x, placed, width, left, right, compact, height: nextY + 24 }
}

/** Authored explanation order, otherwise shared start times keep simultaneous work together. */
export function timelineGroups(data: TimelineSectionData): TimelineGroup[] {
  if (data.groups.length) return data.groups
  return [...new Set(data.activities.map((a) => a.start))].sort((a, b) => a - b).map((start, i) => ({
    id: `start-${i + 1}`, title: `${timelineTime(start)} ${data.unit}`,
    activities: data.activities.filter((a) => a.start === start).map((a) => a.id),
  }))
}
