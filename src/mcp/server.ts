import { AdvisoryResolution, reviewDelivery } from './delivery-review'
import { readReference, REFERENCE_ROOT } from '../core/learning-engine/composition/oui/reference-navigation'
/**
 * The Loom MCP server (decisions 180–188 in grill-log-adaptive-learning.md):
 * the tools a chat's model calls and the `ui://` shell of the Loom MCP App.
 * The same server runs locally over stdio (`cli.ts`) and on Cloudflare Workers
 * as the hosted endpoint (`worker.ts`, slice 5).
 *
 * The shell only loads the app from `appUrl` (GitHub Pages, under a versioned
 * path, decision 182, or the Worker's own assets); parsing, validation and
 * rendering run in the app. The hosted endpoint passes topics through
 * unchecked (decision 184); the local server checks them with `check`.
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server'
import { getUiCapability, registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { measureTool, type AuthoringStage, type ToolMeasurement } from './measurement'
import { TopicContextInput, resolveTopicContext } from '../core/supporting/authoring-editor/assistant/context-graph'
import { validateTopicPlan, topicPlanReview } from '../core/learning-engine/composition/oui/topic-plan'
import { LearningRecordSchema, LearningRepositoryError, type LearningRepository } from '../core/supporting/learner-progress/memory/repository'
import { createLearningCheckpoint } from '../core/supporting/learner-progress/memory/checkpoint'
import { LOOM_SERVER_INSTRUCTIONS } from '../core/learning-engine/composition/oui/tutor-skills'
import { topicLinkUrl } from '../viewer/topic-link'
import { isLearnerEvent, summarize, summaryText, type LearnerEvent } from '../core/supporting/learner-progress/memory/events'
import type { TopicCheck, checkSection } from './check'

/** Where the published app lives; each server release names the app version it was built for. */
// The hosted endpoint serves the app with each release (decision 219); GitHub Pages builds only `master`
export const DEFAULT_APP_URL = 'https://loom-mcp.loom-learning.workers.dev/mcp-app/v1/'
export const APP_URI = 'ui://loom/app-v1.html'
/** The app's stylesheet loads Loom's fonts from Google Fonts. */
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']

export interface SavedTopic {
  id: string
  oui: string
}

/**
 * The learner's own storage, when the server has one (decision 186): the
 * local server's memory folder (`memory-folder.ts`). Without one, the server
 * keeps nothing and the app offers Open in Viewer.
 */
export interface LearnerStore {
  device: string
  appendEvents(events: LearnerEvent[]): Promise<void>
  readEvents(): Promise<LearnerEvent[]>
  saveTopic(topic: SavedTopic): Promise<void>
  /** Saved topic IDs, all or one domain's. */
  listTopics(domain?: string): Promise<string[]>
  readTopic(id: string): Promise<string | null>
  /** Progress notes saved by chats on other devices (`progress/*.md`, decisions 198–199), newest first. */
  readNotes?(): Promise<ProgressNoteFile[]>
  /**
   * The Loom folder's files for show_library / show_domain (decision 216): paths relative to the
   * folder, or to `<domain>/` when one is given; `.oui`, `.loom.oui` and `.md` only.
   */
  readLoomFiles?(domain?: string): Promise<Record<string, string>>
}

export interface ProgressNoteFile {
  name: string
  text: string
}

export interface LoomServerOptions {
  /** Base URL of the app's `app.js` and `app.css`, ending in `/`. */
  appUrl?: string
  /** Self-contained player HTML, supplied only by the local server build. */
  appHtml?: string
  /** Where the learner's events and topics are kept; none on a hosted endpoint without sign-in. */
  store?: LearnerStore
  /** Request-scoped repository built from verified authentication; never configured on the public Worker. */
  repository?: LearningRepository
  /** The full topic check, which adds `validate_topic`; left out on the hosted endpoint. */
  check?: (oui: string, plan?: unknown) => TopicCheck
  checkSection?: typeof checkSection
  /** Safe aggregate observer only; never log model arguments/results. */
  onMeasurement?: (measurement: ToolMeasurement) => void
}

/** Loom Viewer, next to the app on the same site (`<site>/mcp-app/v1/` → `<site>/viewer.html`). */
export function viewerUrlFor(appUrl: string): string {
  return new URL('../../viewer.html', appUrl).href
}

/** The HTML the chat app renders: it only loads the app's script and styles. */
export function appShell(appUrl: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loom</title><link rel="stylesheet" href="${appUrl}app.css"></head>
<body><div id="root"></div><script type="module" src="${appUrl}app.js"></script></body></html>`
}

const SHOW_TOOL_DESCRIPTION = `Show a Loom topic after delivery review. New topics require a plan; intent: reopen is for an existing exact source. Planned root components must be implemented, and missing fields repaired. Design warnings need specific advisoryResolutions bound to the planVersion returned by validate_topic_plan. Source review is not compilation or teaching-quality verification. Pass the whole topic as one .loom.oui text: the first line \`// @loom-topic <topic-id>\`, then each file after a \`// === <path> ===\` line (topic.oui first). To show a lesson again, retrieve its complete original source from an authorized file/attachment and pass it unchanged; never regenerate from a title or summary. If unavailable, ask for the saved .loom.oui file. The hosted Worker stores no topics. For a new lesson, follow read_reference from index.md, discover relevant capabilities, validate_topic_plan and read selected component contracts before writing. Resolve readiness warnings or explain proceeding; pass plan here and to validate_topic when available. Compilation alone does not establish representation readiness. To change a topic shown before, use edit_topic when that tool is available: it takes only the changed statements. After showing a topic in an established domain, save the exact topic to the learner's drive and update domain.oui following storage references unless the learner opted out. Showing the app is not a Drive save.`

const VALIDATE_TOOL_DESCRIPTION = `Check a Loom topic (.loom.oui text) the way Loom Viewer does, before showing it. Answers "valid" or the errors to fix; fix only what they point at and check again.`

function reviewSuppliedPlan(plan: unknown) {
  const valid = validateTopicPlan(plan).length === 0
  return topicPlanReview(plan, valid)
}

export function createLoomServer(options: LoomServerOptions = {}): McpServer {
  const appUrl = options.appUrl ?? DEFAULT_APP_URL
  const { store, check: checkTopic } = options
  const measured = <T>(tool: string, stage: AuthoringStage, input: unknown, run: () => Promise<T>) => measureTool(tool, stage, input, run, options.onMeasurement)
  const appOrigin = new URL(appUrl).origin
  // The routine reaches every chat that connects, with or without the loom-tutor-app skill (decision 218)
  const server = new McpServer({ name: 'loom', version: '0.1.0' }, { capabilities: { tools: {}, resources: {} }, instructions: LOOM_SERVER_INSTRUCTIONS })

  registerAppResource(server, 'Loom topic player', APP_URI, {
    description: 'Plays a Loom topic in Present mode or shows it to read.',
  }, async () => ({
    contents: [{
      uri: APP_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: options.appHtml ?? appShell(appUrl),
      _meta: { ui: { csp: options.appHtml
        ? { resourceDomains: ['data:'], connectDomains: [] }
        : { resourceDomains: [appOrigin, ...FONT_ORIGINS], connectDomains: [appOrigin] }, prefersBorder: true } },
    }],
  }))

  const read = (path: string) => ({ ...readReference(path), deployment: { storageAvailable: Boolean(store || options.repository), serverValidationAvailable: Boolean(checkTopic), sectionValidationAvailable: Boolean(options.checkSection) } })

  server.registerResource('loom-authoring-entry', `${REFERENCE_ROOT}index.md`, { mimeType: 'application/json', description: 'Start progressive authoring navigation here; read linked references only as needed.' }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(read('index.md')) }] }))
  server.registerResource('loom-authoring-reference', new ResourceTemplate(`${REFERENCE_ROOT}{+path}`, { list: undefined }), { description: 'One linked authoring reference; no recursive expansion.' }, async (uri) => {
    const result = read(uri.href)
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(result) }] }
  })
  server.registerTool('read_reference', {
    description: 'Progressive reference navigation. Omit path to start at index.md. Accepts relative paths or full loom://references/ URIs. Follow returned next[].path or next[].uri one linked file at a time; do not guess filenames or crawl all references.',
    inputSchema: z.object({ path: z.string().max(1024).default('index.md').describe('Relative reference path (index.md, workflow/understand.md, components/index.md) or full loom://references/ URI. Omit for index.md; follow returned next links.') }),
    annotations: { readOnlyHint: true },
  }, async ({ path }) => measured('read_reference', 'discovery', { path }, async () => {
    const result = read(path)
    return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result, ...('error' in result ? { isError: true } : {}) }
  }))

  server.registerTool('get_topic_context', {
    title: 'Focused topic context',
    description: 'Resolve bounded statement dependencies from current source files explicitly supplied by your authorized connector or editor buffers. No fetching, filesystem access or conversation state. roots are file#statement addresses; omit for an overview. Hash is a change hint, not an authorization or concurrency token.',
    inputSchema: TopicContextInput,
    annotations: { readOnlyHint: true },
  }, async (input) => measured('get_topic_context', 'context', input, async () => ({ content: [{ type: 'text', text: JSON.stringify(resolveTopicContext(input)) }] })))

  server.registerTool('validate_topic_plan', {
    title: 'Validate a Loom topic plan',
    description: 'Check structural coverage and representations; inspect separate advisory experience readiness, resolve warnings or justify proceeding before generating OUI.',
    inputSchema: z.object({ plan: z.unknown().describe("Version 1 TopicPlan; malformed inputs return structured diagnostics.") }),
    annotations: { readOnlyHint: true },
  }, async ({ plan }) => measured('validate_topic_plan', 'planning', { plan }, async () => {
    const diagnostics = validateTopicPlan(plan)
    return { content: [{ type: 'text', text: JSON.stringify({ valid: diagnostics.length === 0, diagnostics, ...topicPlanReview(plan, diagnostics.length === 0) }) }] }
  }))

  if (options.checkSection) server.registerTool('validate_section', {
    title: 'Validate one section or narration file',
    description: 'Full local/browser compiler diagnostics for targeted repair. Hosted MCP leaves compilation to the app. Narration checks need the current sectionSource.',
    inputSchema: z.object({ source: z.string().max(131072), file: z.string().regex(/^sections\/[\w-]+(?:\.narrate)?\.oui$/), sectionSource: z.string().max(131072).optional() }),
    annotations: { readOnlyHint: true },
  }, async ({ source, file, sectionSource }) => measured('validate_section', 'validation', { source, file, sectionSource }, async () => ({ content: [{ type: 'text', text: JSON.stringify(options.checkSection!(source, file, sectionSource)) }] })))

  if (checkTopic) server.registerTool('validate_topic', {
    title: 'Check a Loom topic',
    description: VALIDATE_TOOL_DESCRIPTION,
    inputSchema: z.object({
      oui: z.string().describe('The whole topic as .loom.oui text.'),
      plan: z.unknown().optional().describe('Optional TopicPlan for advisory comparison with compiled representations; separate from OUI validity and layout.'),
    }),
    annotations: { readOnlyHint: true },
  }, async ({ oui, plan }) => measured('validate_topic', 'validation', { oui, plan }, async () => {
    const check = checkTopic(oui, plan)
    const text = check.ok ? `valid: "${check.title}" with ${check.sections.length} sections` : check.report!
    // Preserve the exact legacy text response when no plan was requested. An injected
    // legacy checker may ignore the new argument; never claim that it ran alignment.
    if (plan === undefined) return { content: [{ type: 'text', text }] }
    const planAlignment = check.planAlignment ?? { schemaVersion: 1, status: 'unverified', diagnostics: [], teachingQuality: 'not-evaluated', layout: 'not-measured' }
    return { content: [{ type: 'text', text: JSON.stringify({ valid: check.ok, validation: text, planAlignment, ...reviewSuppliedPlan(plan) }) }] }
  }))

  registerAppTool(server, 'show_topic', {
    title: 'Show a Loom topic',
    description: SHOW_TOOL_DESCRIPTION,
    inputSchema: z.object({
      oui: z.string().describe('The whole topic as .loom.oui text.'),
      mode: z.enum(['present', 'read']).optional().describe('Open in Present (default) or Read.'),
      intent: z.enum(['create', 'reopen']).default('create'),
      advisoryResolutions: z.array(AdvisoryResolution).max(100).default([]),
      plan: z.unknown().optional().describe('Required for create; optional for exact-source reopen. Source/plan alignment is checked before delivery; the player still compiles it.'),
      viewerLink: z.boolean().optional().describe('Also answer with a link that opens the topic in Loom Viewer, for a chat that shows no Loom player.'),
    }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ oui, viewerLink, plan, mode, intent, advisoryResolutions }) => measured('show_topic', 'delivery', { oui, viewerLink, plan, mode, intent }, async () => {
    const delivery = intent === 'create' || plan !== undefined ? reviewDelivery(oui, plan, advisoryResolutions) : undefined
    if (delivery?.deliveryReview.status === 'blocked') {
      const first = [...delivery.deliveryReview.errors, ...(delivery.sourceReview?.diagnostics ?? []), ...delivery.deliveryReview.unresolvedAdvisories].slice(0, 3)
      const details = first.map((d) => `${d.code} at ${'path' in d ? d.path : d.file}`).join('; ')
      return { isError: true, content: [{ type: 'text', text: `Topic delivery blocked. Plan readiness: ${delivery.experienceReadiness.status}. ${details}. ${delivery.deliveryReview.next}` }], structuredContent: delivery }
    }
    const check = checkTopic?.(oui, plan)
    if (intent === 'create' && check && !check.ok) return { isError: true, content: [{ type: 'text', text: check.report ?? 'Topic compilation failed.' }], structuredContent: { ...delivery, deliveryReview: { ...delivery!.deliveryReview, status: 'blocked', sourceValidity: 'invalid' } } }
    const accepted = { ...(delivery ?? {}), deliveryReview: delivery ? { ...delivery.deliveryReview, sourceValidity: check?.ok ? 'valid' : 'not-compiled' } : { status: 'reopened', sourceValidity: check ? check.ok ? 'valid' : 'invalid' : 'not-compiled', layout: 'not-measured', teachingQuality: 'not-evaluated' } }
    const appSource = { loomTopic: { oui, plan, mode: mode ?? 'present' } }
    // Topics shown are kept, so a later chat can open them again (story T3)
    if (store && check?.ok && check.topicId && check.topicId !== 'pasted') await store.saveTopic({ id: check.topicId, oui }).catch(() => {})
    let text: string
    if (!check) text = intent === 'reopen' ? 'Showing existing topic. The player must compile it; layout and teaching quality remain unverified.' : 'Source accepted for player checks. The app must compile the topic and narration; layout and teaching quality remain unverified.'
    else {
      const shown = check.title ? `Showing "${check.title}" (${check.sections.length} sections). The learner can press Play.` : 'Showing the topic.'
      text = check.ok ? shown : `${shown}\n\nIt has errors; the learner sees them in the app:\n\n${check.report}`
    }
    // A chat that cannot show the app gets a link that opens the topic in Viewer (decision 179). The
    // hosted endpoint answers 2025-era requests statelessly and never sees the chat's capabilities:
    // it leaves the 8 KB link out unless the model asks for it.
    const capabilities = server.server.getClientCapabilities()
    const showsApps = getUiCapability(capabilities)?.mimeTypes?.includes(RESOURCE_MIME_TYPE)
    if (!viewerLink && !capabilities) {
      text += '\n\nIf the learner sees no Loom player in the chat, call show_topic again with viewerLink: true for a link that opens the topic in Loom Viewer.'
    } else if (viewerLink || !showsApps) {
      const link = await topicLinkUrl(viewerUrlFor(appUrl), oui)
      text += link
        ? `\n\nThis chat may not show Loom's player. Give the learner this link, which opens the topic in Loom Viewer, ready to play: ${link}`
        : '\n\nThis chat may not show Loom\'s player, and the topic is too long for a link: the learner can paste it into Loom Viewer.'
    }
    if (!check || check.ok) text += '\n\nNext: if this topic belongs to an established domain, save the exact topic to the learner\'s Drive and update domain.oui following storage references, unless the learner opted out. Local server memory does not by itself confirm a Drive save. If the connector cannot write, say it is not saved and provide the exact file. To reopen, reuse original source; if missing, ask for the saved .loom.oui file instead of regenerating.'
    if (plan === undefined) {
      text += '\n\nRepresentation readiness not reviewed: no TopicPlan supplied. For new lessons, discover capabilities and call validate_topic_plan.'
      return { content: [{ type: 'text', text }], structuredContent: accepted, _meta: appSource }
    }
    const review = reviewSuppliedPlan(plan)
    const count = review.advisoryDiagnostics.length
    const references = review.advisoryDiagnostics.slice(0, 2).map((d) => `${d.code} at ${d.path}`).join('; ')
    if (delivery && delivery.deliveryReview.resolvedAdvisoryCount) text += `\n\n${count} design advisories explicitly resolved for ${delivery.planVersion}. Teaching quality is not evaluated.`
    else text += `\n\nPlan readiness: ${review.experienceReadiness.status}${count ? ` (${count} advisories): ${references}. Resolve relevant warnings with validate_topic_plan or justify proceeding.` : '. Teaching quality is not evaluated.'}`
    // Bounded delivery context; the existing plan validator returns the full review.
    return { content: [{ type: 'text', text }], _meta: appSource, structuredContent: {
      ...accepted,
      experienceReadiness: review.experienceReadiness,
      advisoryDiagnostics: review.advisoryDiagnostics.slice(0, 3), advisoryCount: count,
      omittedAdvisoryCount: Math.max(0, count - 3),
    } }
  }))

  if (options.repository) {
    const repository = options.repository
    const answer = async (operation: () => Promise<unknown>) => {
      try { return { content: [{ type: 'text' as const, text: JSON.stringify(await operation()) }] } }
      catch (error) {
        const code = error instanceof LearningRepositoryError ? error.code : 'STORAGE_ERROR'
        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ code }) }] }
      }
    }
    server.registerTool('read_learning_record', {
      description: 'Read the authenticated learner’s durable OUI, provenance, events and derived checkpoint. Available only with an explicitly authenticated storage adapter.',
      inputSchema: z.object({ topicId: z.string().regex(/^[\w-]+$/).max(120) }).strict(),
      annotations: { readOnlyHint: true },
    }, async ({ topicId }) => measured('read_learning_record', 'persistence', { topicId }, () => answer(() => repository.read(topicId))))
    server.registerTool('write_learning_record', {
      description: 'Versioned write for the authenticated learner. Use the version returned by read_learning_record, or null to create. Conflicts require rereading; never silently overwrite.',
      inputSchema: z.object({ record: LearningRecordSchema, expectedVersion: z.string().max(200).nullable() }).strict(),
    }, async ({ record, expectedVersion }) => measured('write_learning_record', 'persistence', { record, expectedVersion }, () => answer(() => repository.write(record, expectedVersion))))
  }

  registerLibraryTools(server, store)
  if (store) registerMemoryTools(server, store)
  return server
}

/** One file of the learner's Loom folder, as the chat passes it to show_library / show_domain. */
const LoomFile = z.object({
  path: z.string().describe('Path inside the folder named in the tool description, e.g. "domain.oui", "topics/punch-basics.loom.oui", "progress/punch-basics-2026-10-24.md".'),
  text: z.string().describe("The file's text. For a topic, its header lines and its topic.oui part are enough."),
})

const LIBRARY_TOOL_DESCRIPTION = `Show the learner's Loom library in the chat: one card per domain with its goal and how far they are. Call it when the learner asks to see their library, their domains or everything they are learning. Pass files from their drive's Loom/ folder (see storage references), paths relative to Loom/: index.oui, each <domain-id>/domain.oui, each topic's header and topic.oui part as <domain-id>/topics/<topic-id>.loom.oui, and the latest progress note per topic as <domain-id>/progress/<file>.md. The Loom server on the learner's computer reads its own folder: call it there with no files.`

const DOMAIN_TOOL_DESCRIPTION = `Show one of the learner's Loom domains in the chat: its topics in learning order, what is done, in progress or to review, and the topic up next. Call it only when the learner asks about a specific domain ("where am I in Chinese?", "show my fight animation topics"). Pass the domain ID and files from Loom/<domain-id>/ in their drive (see storage references), paths relative to that folder: domain.oui, each topic's header and topic.oui part as topics/<topic-id>.loom.oui (the whole topic is not needed), and the latest progress note per topic as progress/<file>.md. The Loom server on the learner's computer reads its own folder: call it there with only the domain.`

/** A topic cut to its header lines and its topic.oui part: all a library or domain page needs. */
export function topicHead(text: string): string {
  const out: string[] = []
  let inTopic = false
  for (const line of text.split('\n')) {
    const marker = /^\/\/\s*===\s*(.+?)\s*===\s*$/.exec(line)
    if (marker) {
      if (inTopic) break
      inTopic = marker[1] === 'topic.oui'
    }
    out.push(line)
  }
  return `${out.join('\n').trimEnd()}\n`
}

/** At most this many files per page: a domain's plan, topics and notes fit well within it. */
const MAX_FILES = 300

/**
 * show_library and show_domain (decision 216): the app draws the library or domain page (as Loom
 * Viewer does) from the folder's files. The hosted endpoint passes on the files the chat read from
 * the drive; the local server reads its memory folder. The app works out the statuses.
 */
function registerLibraryTools(server: McpServer, store?: LearnerStore) {
  const files = async (given: Array<{ path: string; text: string }> | undefined, domain?: string) => {
    // Paths may come with Loom/ (and the domain's folder) in front: keep them relative to the page's folder
    const relative = (path: string) => {
      const inLoom = path.replace(/^\/+/, '').replace(/^Loom\//, '')
      return domain && inLoom.startsWith(`${domain}/`) ? inLoom.slice(domain.length + 1) : inLoom
    }
    if (given?.length) return Object.fromEntries(given.slice(0, MAX_FILES).map((f) => [relative(f.path), f.path.endsWith('.loom.oui') ? topicHead(f.text) : f.text]))
    if (!store?.readLoomFiles) return null
    const read = await store.readLoomFiles(domain)
    return Object.fromEntries(Object.entries(read).slice(0, MAX_FILES).map(([path, text]) => [path, path.endsWith('.loom.oui') ? topicHead(text) : text]))
  }
  const missing = (what: string) => ({
    content: [{ type: 'text' as const, text: `No files to show. Read ${what} from the learner's drive (see storage references) and pass them as files.` }],
    isError: true,
  })

  registerAppTool(server, 'show_library', {
    title: "Show the learner's Loom library",
    description: LIBRARY_TOOL_DESCRIPTION,
    inputSchema: z.object({ files: z.array(LoomFile).optional().describe('Files of the Loom/ folder; leave out on the server on the learner\'s computer.') }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ files: given }) => {
    const folder = await files(given)
    if (!folder || !('index.oui' in folder || Object.keys(folder).some((p) => p.endsWith('/domain.oui')))) return missing('Loom/index.oui and the domains\' domain.oui files')
    const domains = Object.keys(folder).filter((p) => /^[^/]+\/domain\.oui$/.test(p)).length
    return {
      content: [{ type: 'text', text: `Showing the learner's Loom library (${domains} domains). The learner can open a domain from it.` }],
      structuredContent: { loom: { kind: 'library', name: 'Loom', files: folder } },
    }
  })

  registerAppTool(server, 'show_domain', {
    title: 'Show a Loom domain',
    description: DOMAIN_TOOL_DESCRIPTION,
    inputSchema: z.object({
      domain: z.string().describe('The domain ID (its folder name under Loom/).'),
      files: z.array(LoomFile).optional().describe("Files of Loom/<domain-id>/; leave out on the server on the learner's computer."),
    }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ domain, files: given }) => {
    const folder = await files(given, domain)
    if (!folder || !('domain.oui' in folder)) return missing(`Loom/${domain}/domain.oui, its topics and its progress notes`)
    const topics = Object.keys(folder).filter((p) => p.startsWith('topics/')).length
    return {
      content: [{ type: 'text', text: `Showing the domain "${domain}" (${topics} topic files). The app tells you where the learner stands.` }],
      structuredContent: { loom: { kind: 'domain', name: domain, files: folder } },
    }
  })
}

const OPEN_TOOL_DESCRIPTION = 'Show a Loom topic the learner saw before, by its ID (see list_topics), ready to play again.'

/** Tools that need the learner's storage (decisions 183, 186). */
function registerMemoryTools(server: McpServer, store: LearnerStore) {
  // Only the app calls it, with what the learner saw and answered; the model never sees it
  registerAppTool(server, 'record_events', {
    title: 'Record learning events',
    description: 'Keeps what the learner saw and answered in their memory folder. Called by the Loom app.',
    inputSchema: z.object({ events: z.array(z.record(z.string(), z.unknown())) }),
    _meta: { ui: { resourceUri: APP_URI, visibility: ['app'] } },
  }, async ({ events }) => {
    const valid = (events as unknown[]).filter(isLearnerEvent)
    await store.appendEvents(valid)
    return { content: [{ type: 'text', text: `kept ${valid.length} of ${events.length} events` }] }
  })

  server.registerTool('list_topics', {
    title: 'List saved Loom topics',
    description: 'The Loom topics shown to this learner before, by ID, with what the learner did in each.',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  }, async () => {
    const [ids, events] = await Promise.all([store.listTopics(), store.readEvents()])
    if (ids.length === 0) return { content: [{ type: 'text', text: 'No saved topics yet.' }] }
    const byTopic = new Map(summarize(events).map((s) => [s.topic, s]))
    const lines = ids.map((id) => {
      const s = byTopic.get(id)
      return s ? `- ${id}: ${s.seen} parts seen, ${s.correct} of ${s.answered} answers right, last on ${s.last.slice(0, 10)}` : `- ${id}: not started`
    })
    return { content: [{ type: 'text', text: lines.join('\n') }] }
  })

  registerAppTool(server, 'open_topic', {
    title: 'Open a saved Loom topic',
    description: OPEN_TOOL_DESCRIPTION,
    inputSchema: z.object({ id: z.string().describe('Topic ID from list_topics.') }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ id }) => {
    const oui = await store.readTopic(id)
    if (!oui) return { content: [{ type: 'text', text: `No saved topic "${id}". Call list_topics for the IDs.` }], isError: true }
    return { content: [{ type: 'text', text: `Showing the saved topic "${id}". The learner can press Play.` }], structuredContent: { oui } }
  })

  server.registerTool('get_learning_checkpoint', {
    title: 'Portable learning checkpoint',
    description: 'Get a deterministic compact progress checkpoint for a saved topic. Available when learner storage is connected.',
    inputSchema: z.object({ topic: z.string() }),
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => {
    const events = await store.readEvents()
    return { content: [{ type: 'text', text: JSON.stringify(createLearningCheckpoint(topic, events)) }] }
  })

  server.registerTool('learner_summary', {
    title: "The learner's progress",
    description: "What the learner has seen and answered in each Loom topic, and which answers were last wrong. Use it to suggest what to learn or review next; pass the domain to plan within one domain (see storage references).",
    inputSchema: z.object({
      topic: z.string().optional().describe('One topic ID; all topics when left out.'),
      domain: z.string().optional().describe("One domain ID: only that domain's topics and progress notes."),
    }),
    annotations: { readOnlyHint: true },
  }, async ({ topic, domain }) => {
    const [events, notes, inDomain] = await Promise.all([store.readEvents(), store.readNotes?.() ?? [], domain ? store.listTopics(domain) : null])
    const summaries = summarize(events).filter((s) => (!topic || s.topic === topic) && (!inDomain || inDomain.includes(s.topic)))
    // Sessions from the phone or the web arrive as notes the chat saved to <domain>/progress/ (slice 6)
    const fromNotes = notes
      .filter((n) => (!topic || noteField(n.text, 'topic') === topic) && (!domain || noteField(n.text, 'domain') === domain))
      .slice(0, MAX_NOTES)
    const text = fromNotes.length === 0
      ? summaryText(summaries)
      : `${summaries.length ? summaryText(summaries) : 'No learning recorded on this computer yet.'}\n\nProgress notes saved from other devices (newest first):\n\n${fromNotes.map((n) => `--- ${n.name} ---\n${n.text.trim()}`).join('\n\n')}`
    return { content: [{ type: 'text', text }] }
  })
}

/** Notes read into one summary; older ones add little the newer ones do not say. */
const MAX_NOTES = 5

/** A line of a progress note's front matter (`topic:`, `domain:`). */
function noteField(text: string, field: 'topic' | 'domain'): string | undefined {
  return new RegExp(`^${field}:\\s*(\\S+)\\s*$`, 'm').exec(text)?.[1]
}
