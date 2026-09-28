/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yaml from 'js-yaml'
import { z } from 'zod'

import { KNOWN_SECTION_TYPES } from './gateway'
import type { ValidationDiagnostic, ValidationResult } from './types'

// ============================================================================
// Topic Brief — the design record of a topic (`public/okf/<topic>/brief.yaml`)
// ============================================================================
// The brief declares WHAT a topic contains: meta, 2–4 exploration tracks,
// sections in learning order, key-item milestones, the boss failure mode, and
// the teach points each section covers. `okf:new --from` scaffolds from it and
// `okf:validate` keeps the files on disk in sync with it.
//
//   validateTopicBrief(raw)            Tier 1–3 on the brief document alone
//   validateTopicAgainstBrief(brief…)  Tier 3 brief ↔ disk drift, metadata
//                                      sync, intro roadmap, assessment grounding
// ============================================================================

export const BRIEF_FILE = 'brief.yaml'

/** The capital hub section — always present, never declared in the brief. */
export const INTRO_SECTION = 'intro'

/** Section types whose items must carry `groundedIn` (AGENTS.md "Strict Assessment Grounding"). */
export const GROUNDED_SECTION_TYPES = new Set(['quiz', 'reflection-sequence'])

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const slug = (what: string) => z.string().regex(SLUG_RE, `${what} must be lowercase kebab-case (e.g. cache-directives)`)

const BRIEF_SECTION_TYPES = [...KNOWN_SECTION_TYPES].filter((t) => t !== INTRO_SECTION).sort() as [string, ...string[]]

// --- Schema ---

export const BriefTeachPointSchema = z.object({
  id: slug('teaches id'),
  point: z.string().min(1),
})

export const BriefSectionSchema = z.object({
  name: slug('Section name'),
  type: z.enum(BRIEF_SECTION_TYPES),
  title: z.string().min(1),
  keyItem: z.boolean().default(false),
  teaches: z.array(BriefTeachPointSchema).default([]),
})

export const BriefTrackSchema = z.object({
  id: slug('Track id'),
  title: z.string().min(1),
  sections: z.array(BriefSectionSchema).min(1),
})

export const TopicBriefSchema = z.object({
  id: slug('Topic id'),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  boss: z.object({
    title: z.string().min(1),
    failureMode: z.string().min(1),
  }),
  tracks: z
    .array(BriefTrackSchema)
    .min(2, 'A topic needs 2 to 4 exploration tracks radiating from the capital.')
    .max(4, 'A topic needs 2 to 4 exploration tracks radiating from the capital.'),
})

export type TopicBrief = z.output<typeof TopicBriefSchema>
export type BriefTrack = TopicBrief['tracks'][number]
export type BriefSection = BriefTrack['sections'][number]

// --- Queries ---

/** Every section folder the brief expects on disk, capital first, then tracks in order. */
export function briefSectionNames(brief: TopicBrief): string[] {
  return [INTRO_SECTION, ...brief.tracks.flatMap((t) => t.sections.map((s) => s.name))]
}

/** Find a section and its track. */
export function findBriefSection(brief: TopicBrief, name: string): { track: BriefTrack; section: BriefSection; index: number } | undefined {
  for (const track of brief.tracks) {
    const index = track.sections.findIndex((s) => s.name === name)
    if (index !== -1) return { track, section: track.sections[index], index }
  }
  return undefined
}

/**
 * Teach ids an assessment section may be grounded in: every teach point of the
 * sections that come before it in the same track.
 */
export function prerequisiteTeachIds(brief: TopicBrief, sectionName: string): string[] {
  const found = findBriefSection(brief, sectionName)
  if (!found) return []
  return found.track.sections.slice(0, found.index).flatMap((s) => s.teaches.map((t) => t.id))
}

// --- Tier 1–3: the brief document ---

export function validateTopicBrief(raw: string, file?: string): ValidationResult<TopicBrief | null> {
  const at = file ? { file } : {}

  let parsed: unknown
  try {
    parsed = yaml.load(raw)
  } catch (e: any) {
    return {
      status: 'error',
      payload: null,
      diagnostics: [{
        tier: 1,
        ...at,
        line: e?.mark?.line !== undefined ? e.mark.line + 1 : undefined,
        message: e?.reason || e?.message || 'Invalid YAML syntax in brief.',
        fixHint: 'Fix the YAML indentation and syntax.',
      }],
    }
  }

  const result = TopicBriefSchema.safeParse(parsed ?? {})
  if (!result.success) {
    return {
      status: 'error',
      payload: null,
      diagnostics: result.error.issues.map((issue) => {
        const field = issue.path.join('.')
        return {
          tier: 2 as const,
          ...at,
          field,
          message: issue.message,
          fixHint: `Correct '${field || '(root)'}' — see the brief reference in docs/creating-topics.md.`,
        }
      }),
    }
  }

  const brief = result.data
  const diagnostics = briefTier3(brief).map((d) => ({ ...at, ...d }))
  return { status: diagnostics.length > 0 ? 'error' : 'valid', payload: brief, diagnostics }
}

function briefTier3(brief: TopicBrief): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const dup = (field: string, message: string, fixHint: string) => diagnostics.push({ tier: 3, field, message, fixHint })

  const trackIds = new Set<string>()
  const sectionNames = new Set<string>()
  const teachIds = new Set<string>()

  brief.tracks.forEach((track, ti) => {
    if (trackIds.has(track.id)) dup(`tracks.${ti}.id`, `Duplicate track id "${track.id}".`, 'Give every track a unique id.')
    trackIds.add(track.id)

    track.sections.forEach((section, si) => {
      const field = `tracks.${ti}.sections.${si}`
      if (section.name === INTRO_SECTION) {
        dup(`${field}.name`, `Section name "${INTRO_SECTION}" is reserved for the capital hub.`, `Rename the section — okf:new adds the "${INTRO_SECTION}" section automatically.`)
      } else if (sectionNames.has(section.name)) {
        dup(`${field}.name`, `Duplicate section name "${section.name}".`, 'Section names are folder names — make each one unique across all tracks.')
      }
      sectionNames.add(section.name)

      section.teaches.forEach((teach, pi) => {
        if (teachIds.has(teach.id)) {
          dup(`${field}.teaches.${pi}.id`, `Duplicate teaches id "${teach.id}".`, 'Teach ids are referenced by groundedIn — make each one unique across the topic.')
        }
        teachIds.add(teach.id)
      })
    })
  })

  if (!brief.tracks.some((t) => t.sections.some((s) => s.keyItem))) {
    dup('tracks', 'No section is marked keyItem: true — the boss would have nothing to gate on.', 'Mark 2–4 mandatory milestone sections with keyItem: true.')
  }

  return diagnostics
}

// --- Tier 3: brief ↔ topic on disk ---

export interface TopicSectionOnDisk {
  /** Section folder name. */
  name: string
  /** `type` from section.md frontmatter, when it parsed. */
  type?: string
  /** Validated section payload; omit when the section failed validation. */
  data?: Record<string, any>
}

export interface TopicOnDisk {
  /** Repo-relative topic folder, e.g. `public/okf/http-caching` (used in diagnostics). */
  topicDir: string
  sections: TopicSectionOnDisk[]
  /** Raw `<topic>/index.yaml`, or undefined when missing. */
  indexYaml?: string
  /** Raw root `public/okf/index.md`. */
  rootIndexMd: string
  hexMapExists: boolean
}

export function validateTopicAgainstBrief(brief: TopicBrief, topic: TopicOnDisk): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const briefFile = `${topic.topicDir}/${BRIEF_FILE}`
  const expected = briefSectionNames(brief)
  const onDisk = new Map(topic.sections.map((s) => [s.name, s]))

  // Drift: every folder is in the brief, every brief section has a folder.
  for (const section of topic.sections) {
    if (!expected.includes(section.name)) {
      diagnostics.push({
        tier: 3,
        file: `${topic.topicDir}/sections/${section.name}`,
        message: `Section folder "${section.name}" is not declared in ${BRIEF_FILE}.`,
        fixHint: `Add it to a track in ${BRIEF_FILE}, or delete the folder.`,
      })
    }
  }
  for (const name of expected) {
    if (!onDisk.has(name)) {
      diagnostics.push({
        tier: 3,
        file: briefFile,
        message: `${BRIEF_FILE} declares section "${name}", but sections/${name}/ does not exist.`,
        fixHint: `Run \`npm run okf:new -- --from ${briefFile}\` to scaffold it, or remove it from the brief.`,
      })
    }
  }

  // Section types match the brief.
  for (const name of expected) {
    const disk = onDisk.get(name)
    const want = name === INTRO_SECTION ? INTRO_SECTION : findBriefSection(brief, name)?.section.type
    if (disk?.type && want && disk.type !== want) {
      diagnostics.push({
        tier: 3,
        file: `${topic.topicDir}/sections/${name}/section.md`,
        field: 'type',
        message: `Section "${name}" has type "${disk.type}", but ${BRIEF_FILE} declares "${want}".`,
        fixHint: `Make section.md and ${BRIEF_FILE} agree on the type.`,
      })
    }
  }

  diagnostics.push(...checkMetadata(brief, topic, briefFile))
  diagnostics.push(...checkIntroRoadmap(topic, expected))
  diagnostics.push(...checkGrounding(brief, topic))

  if (!topic.hexMapExists) {
    diagnostics.push({
      tier: 3,
      file: `public/hexmaps/${brief.id}.yaml`,
      message: `Topic "${brief.id}" has no hex campaign map.`,
      fixHint: `Run \`npm run okf:new -- --from ${briefFile}\` to generate one.`,
    })
  }

  return diagnostics
}

function checkMetadata(brief: TopicBrief, topic: TopicOnDisk, briefFile: string): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const indexYamlFile = `${topic.topicDir}/index.yaml`
  const resync = `Run \`npm run okf:new -- --from ${briefFile}\` to re-sync it from the brief.`

  let indexYaml: any
  try {
    indexYaml = topic.indexYaml === undefined ? undefined : yaml.load(topic.indexYaml)
  } catch {
    indexYaml = null
  }
  if (!indexYaml || typeof indexYaml !== 'object') {
    diagnostics.push({ tier: 3, file: indexYamlFile, message: 'index.yaml is missing or unreadable.', fixHint: resync })
  } else {
    if (indexYaml.category !== brief.category) {
      diagnostics.push({
        tier: 3,
        file: indexYamlFile,
        field: 'category',
        message: `index.yaml category "${indexYaml.category}" does not match ${BRIEF_FILE} category "${brief.category}".`,
        fixHint: resync,
      })
    }
    const tags = Array.isArray(indexYaml.tags) ? indexYaml.tags.map(String) : []
    const wanted = brief.tags.length ? brief.tags : [brief.id]
    if (tags.join(',') !== wanted.join(',')) {
      diagnostics.push({
        tier: 3,
        file: indexYamlFile,
        field: 'tags',
        message: `index.yaml tags [${tags.join(', ')}] do not match ${BRIEF_FILE} tags [${wanted.join(', ')}].`,
        fixHint: resync,
      })
    }
  }

  const heading = rootIndexHeadingOf(topic.rootIndexMd, brief.id)
  if (heading === undefined) {
    diagnostics.push({
      tier: 3,
      file: 'public/okf/index.md',
      message: `Topic "${brief.id}" is not registered in public/okf/index.md, so the app never shows it.`,
      fixHint: resync,
    })
  } else if (heading.toLowerCase() !== brief.category.toLowerCase()) {
    diagnostics.push({
      tier: 3,
      file: 'public/okf/index.md',
      message: `Topic "${brief.id}" is listed under "## ${heading}", but ${BRIEF_FILE} category is "${brief.category}".`,
      fixHint: `Move the entry under "## ${brief.category}" in public/okf/index.md.`,
    })
  }

  return diagnostics
}

/** The `## heading` the topic's link sits under in the root index.md; '' when above any heading; undefined when unregistered. */
export function rootIndexHeadingOf(rootIndexMd: string, topicId: string): string | undefined {
  let heading = ''
  for (const line of rootIndexMd.split('\n')) {
    if (line.startsWith('## ')) heading = line.slice(3).trim()
    else if (line.includes(`(${topicId}/index.md)`)) return heading
  }
  return undefined
}

function checkIntroRoadmap(topic: TopicOnDisk, expected: string[]): ValidationDiagnostic[] {
  const roadmap = topic.sections.find((s) => s.name === INTRO_SECTION)?.data?.roadmap
  if (!Array.isArray(roadmap)) return []
  return roadmap
    .map((step: any, i: number) => ({ step, i }))
    .filter(({ step }) => step?.sectionId && !expected.includes(step.sectionId))
    .map(({ step, i }) => ({
      tier: 3 as const,
      file: `${topic.topicDir}/sections/${INTRO_SECTION}`,
      field: `roadmap.${i}.sectionId`,
      message: `Intro roadmap points at section "${step.sectionId}", which is not in ${BRIEF_FILE}.`,
      fixHint: `Use one of: ${expected.filter((n) => n !== INTRO_SECTION).join(', ')}.`,
    }))
}

function checkGrounding(brief: TopicBrief, topic: TopicOnDisk): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []

  for (const track of brief.tracks) {
    for (const section of track.sections) {
      if (!GROUNDED_SECTION_TYPES.has(section.type)) continue
      const data = topic.sections.find((s) => s.name === section.name)?.data
      if (!data) continue

      const allowed = prerequisiteTeachIds(brief, section.name)
      const items: any[] = section.type === 'quiz' ? data.questions ?? [] : data.challenges ?? []
      const itemField = section.type === 'quiz' ? 'questions' : 'challenges'
      const file = `${topic.topicDir}/sections/${section.name}`
      const options = allowed.length ? allowed.join(', ') : '(none yet)'

      items.forEach((item, i) => {
        const label = item?.id ? `"${item.id}"` : `#${i + 1}`
        const field = `${itemField}.${i}.groundedIn`
        if (item?.groundedIn === undefined) {
          if (allowed.length === 0) return // grounding is opt-in until a prerequisite lists teaches
          diagnostics.push({
            tier: 3,
            file,
            field,
            message: `${section.type} item ${label} has no groundedIn.`,
            fixHint: `Set groundedIn to the teach point it assesses: ${options}.`,
          })
        } else if (!allowed.includes(item.groundedIn)) {
          diagnostics.push({
            tier: 3,
            file,
            field,
            message: `${section.type} item ${label} is grounded in "${item.groundedIn}", which no earlier section in track "${track.id}" teaches.`,
            fixHint: `Use one of: ${options}. Teach the concept first by adding it to an earlier section's teaches in ${BRIEF_FILE}.`,
          })
        }
      })
    }
  }

  return diagnostics
}
