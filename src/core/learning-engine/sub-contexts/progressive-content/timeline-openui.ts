import { z } from 'zod'
import { call, defineOUIComponent, defineOUISection, idOf, refOrId, refTo, sectionFields, sectionTail, sectionTailProps, type LoomOUIComponent } from '../openui-kernel'
import { TIMELINE_COLORS, type TimelineSectionData } from './timeline'

export const TimelineLane = defineOUIComponent({
  name: 'TimelineLane', description: 'A named participant or resource used as a task’s secondary label and color. Each task gets its own row.',
  props: z.object({ id: z.string(), title: z.string(), color: z.enum(TIMELINE_COLORS).optional() }),
  fields: { id: 'Lane ID, unique within the timeline.', title: 'Readable lane name.', color: 'Optional theme accent for the lane and its activities.' },
})
export const TimelineActivity = defineOUIComponent({
  name: 'TimelineActivity', description: 'Activity positioned by elapsed start time and duration; zero duration represents a milestone.',
  props: z.object({ id: z.string(), title: z.string(), lane: refOrId(TimelineLane), start: z.number().min(0), duration: z.number().min(0), description: z.string().optional(), dependsOn: z.array(z.string()).optional() }),
  fields: {
    id: 'Activity ID, unique within the timeline.', title: 'Short readable activity name.', lane: 'TimelineLane reference or ID.',
    start: 'Elapsed start time from zero, in the timeline unit.', duration: 'Duration in the same unit; zero is a milestone.',
    description: 'Optional explanation shown on selection in Read mode.', dependsOn: 'Optional activity IDs that must finish before this activity starts; draws dependency connectors.',
  },
  toData: (p) => ({ id: p.id, title: p.title, lane: idOf(p.lane), start: p.start, duration: p.duration, description: p.description, depends_on: p.dependsOn }),
})
export const TimelineGroup = defineOUIComponent({
  name: 'TimelineGroup', description: 'Activities explained together on one presentation beat, including parallel work or a join.',
  props: z.object({ id: z.string(), title: z.string(), activities: z.array(refOrId(TimelineActivity)), description: z.string().optional() }),
  fields: { id: 'Group ID, unique within the timeline.', title: 'Short stage name shown in Present.', activities: 'Activities to highlight together, as references or IDs; include parallel activities in one group.', description: 'Optional explanation of what this stage means.' },
  toData: (p) => ({ ...p, activities: p.activities.map(idOf) }),
})
export const Timeline: LoomOUIComponent = defineOUISection({
  name: 'Timeline', sectionType: 'timeline', description: 'Measured task timeline: one row per activity, sorted by start time, with duration-scaled bars, parallel work and finish-to-start dependencies. Present keeps the whole diagram visible while focusing authored groups.',
  props: z.object({ title: z.string(), lanes: z.array(TimelineLane.ref), activities: z.array(TimelineActivity.ref), groups: z.array(TimelineGroup.ref).optional(), unit: z.string().optional(), description: z.string().optional(), takeaway: z.string().optional(), ...sectionTailProps }),
  fields: { ...sectionFields, lanes: 'Participant or resource metadata for task labels and colors; task rows are ordered automatically by start time.', activities: 'Timed activities; bars use one shared scale across all lanes.', groups: 'Optional ordered presentation groups; cover every activity. Without groups, activities sharing a start time are explained together.', unit: 'Time unit for every start and duration; default "ms". Use a consistent unit.', description: 'Optional context, including whether timing is measured or illustrative.', takeaway: 'Optional conclusion shown on the final summary beat.' },
  toData: (p) => ({ type: 'timeline', title: p.title, lanes: p.lanes, activities: p.activities, groups: p.groups ?? [], unit: p.unit ?? 'ms', description: p.description, takeaway: p.takeaway }),
  fromData: (data: TimelineSectionData, meta) => call(Timeline, {
    title: meta.title || data.title || '', unit: data.unit, description: data.description, takeaway: data.takeaway,
    lanes: data.lanes.map((lane) => call(TimelineLane, lane, lane.id)),
    activities: data.activities.map((a) => call(TimelineActivity, { id: a.id, title: a.title, lane: refTo(TimelineLane, a.lane), start: a.start, duration: a.duration, description: a.description, dependsOn: a.depends_on }, a.id)),
    groups: data.groups.map((g) => call(TimelineGroup, { id: g.id, title: g.title, activities: g.activities.map((id) => refTo(TimelineActivity, id)), description: g.description }, g.id)),
    ...sectionTail(meta),
  }),
})
export const timelineOUIComponents = [Timeline, TimelineLane, TimelineActivity, TimelineGroup]
