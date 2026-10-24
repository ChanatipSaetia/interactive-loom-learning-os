/**
 * The Loom MCP server (decisions 180–188 in grill-log-adaptive-learning.md):
 * the tools a chat's model calls and the `ui://` shell of the Loom MCP App.
 * The same server runs locally over stdio and, later, behind a serverless
 * HTTP endpoint; `cli.ts` picks the transport.
 *
 * The shell only loads the app from `appUrl` (GitHub Pages, under a versioned
 * path, decision 182); parsing, validation and rendering run in the app.
 */
import { McpServer } from '@modelcontextprotocol/server'
import { getUiCapability, registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { getAuthoringGuide, guideSectionTypes } from '../core/learning-engine/composition/oui/authoring-guide'
import { readTopicText } from '../core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic, loadErrorReport, topicErrorReport } from '../viewer/compileTopic'
import { topicLinkUrl } from '../viewer/topic-link'
import { isLearnerEvent, summarize, summaryText, type LearnerEvent } from '../core/supporting/learner-progress/memory/events'

/** Where the published app lives; each server release names the app version it was built for. */
export const DEFAULT_APP_URL = 'https://chanatipsaetia.github.io/interactive-loom-learning-os/mcp-app/v1/'
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
  listTopics(): Promise<string[]>
  readTopic(id: string): Promise<string | null>
}

export interface LoomServerOptions {
  /** Base URL of the app's `app.js` and `app.css`, ending in `/`. */
  appUrl?: string
  /** Where the learner's events and topics are kept; none on a hosted endpoint without sign-in. */
  store?: LearnerStore
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

export interface TopicCheck {
  ok: boolean
  topicId?: string
  title?: string
  sections: string[]
  /** The fix request for the model, or null when the topic has no errors. */
  report: string | null
}

/** Read and validate `.loom.oui` text with the same steps as Loom Viewer (decision 184). */
export function checkTopic(oui: string): TopicCheck {
  let topics
  try {
    topics = readTopicText(oui)
  } catch (e) {
    return { ok: false, sections: [], report: loadErrorReport(e instanceof Error ? e.message : String(e)) }
  }
  const topic = compileViewerTopic(topics[0])
  const report = topicErrorReport(topic)
  return {
    ok: report === null,
    topicId: topic.topicId,
    title: topic.manifest?.title,
    sections: topic.sections.map((s) => s.name),
    report,
  }
}

const GUIDE_TOOL_DESCRIPTION = `How to write a Loom learning topic (.loom.oui text) for show_topic. Call it before writing a topic: first with no section types to get the rules and the list of section types, then again with the section types the topic will use (e.g. ["intro", "flashcards", "quiz", "scenario"]) to get their components. ["all"] returns everything.`

const SHOW_TOOL_DESCRIPTION = `Show a Loom learning topic in the chat, ready to play in Present mode or to read. Pass the whole topic as one .loom.oui text: the first line \`// @loom-topic <topic-id>\`, then each file after a \`// === <path> ===\` line (topic.oui first). Write it with get_authoring_guide, and check it with validate_topic first when that tool is available.`

const VALIDATE_TOOL_DESCRIPTION = `Check a Loom topic (.loom.oui text) the way Loom Viewer does, before showing it. Answers "valid" or the errors to fix; fix only what they point at and check again.`

export function createLoomServer(options: LoomServerOptions = {}): McpServer {
  const appUrl = options.appUrl ?? DEFAULT_APP_URL
  const store = options.store
  const appOrigin = new URL(appUrl).origin
  const server = new McpServer({ name: 'loom', version: '0.1.0' }, { capabilities: { tools: {}, resources: {} } })

  registerAppResource(server, 'Loom topic player', APP_URI, {
    description: 'Plays a Loom topic in Present mode or shows it to read.',
  }, async () => ({
    contents: [{
      uri: APP_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: appShell(appUrl),
      _meta: { ui: { csp: { resourceDomains: [appOrigin, ...FONT_ORIGINS], connectDomains: [appOrigin] }, prefersBorder: true } },
    }],
  }))

  server.registerTool('get_authoring_guide', {
    title: 'Loom authoring guide',
    description: GUIDE_TOOL_DESCRIPTION,
    inputSchema: z.object({
      sections: z.array(z.string()).optional().describe(`Section types the topic will use: ${guideSectionTypes().map((t) => t.type).join(', ')}, or "all".`),
    }),
    annotations: { readOnlyHint: true },
  }, async ({ sections }) => ({ content: [{ type: 'text', text: getAuthoringGuide(sections) }] }))

  server.registerTool('validate_topic', {
    title: 'Check a Loom topic',
    description: VALIDATE_TOOL_DESCRIPTION,
    inputSchema: z.object({ oui: z.string().describe('The whole topic as .loom.oui text.') }),
    annotations: { readOnlyHint: true },
  }, async ({ oui }) => {
    const check = checkTopic(oui)
    return { content: [{ type: 'text', text: check.ok ? `valid: "${check.title}" with ${check.sections.length} sections` : check.report! }] }
  })

  registerAppTool(server, 'show_topic', {
    title: 'Show a Loom topic',
    description: SHOW_TOOL_DESCRIPTION,
    inputSchema: z.object({
      oui: z.string().describe('The whole topic as .loom.oui text.'),
      mode: z.enum(['present', 'read']).optional().describe('Open in Present (default) or Read.'),
    }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ oui }) => {
    const check = checkTopic(oui)
    // Topics shown are kept, so a later chat can open them again (story T3)
    if (store && check.topicId && check.topicId !== 'pasted') await store.saveTopic({ id: check.topicId, oui }).catch(() => {})
    const shown = check.title ? `Showing "${check.title}" (${check.sections.length} sections). The learner can press Play.` : 'Showing the topic.'
    let text = check.ok ? shown : `${shown}\n\nIt has errors; the learner sees them in the app:\n\n${check.report}`
    // A chat that cannot show the app gets a link that opens the topic in Viewer (decision 179)
    const showsApps = getUiCapability(server.server.getClientCapabilities())?.mimeTypes?.includes(RESOURCE_MIME_TYPE)
    if (!showsApps) {
      const link = await topicLinkUrl(viewerUrlFor(appUrl), oui)
      text += link
        ? `\n\nThis chat may not show Loom's player. Give the learner this link, which opens the topic in Loom Viewer, ready to play: ${link}`
        : '\n\nThis chat may not show Loom\'s player, and the topic is too long for a link: the learner can paste it into Loom Viewer.'
    }
    return { content: [{ type: 'text', text }] }
  })

  if (store) registerMemoryTools(server, store)
  return server
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

  server.registerTool('learner_summary', {
    title: "The learner's progress",
    description: 'What the learner has seen and answered in each Loom topic, and which answers were last wrong. Use it to suggest what to learn or review next.',
    inputSchema: z.object({ topic: z.string().optional().describe('One topic ID; all topics when left out.') }),
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => {
    const summaries = summarize(await store.readEvents()).filter((s) => !topic || s.topic === topic)
    return { content: [{ type: 'text', text: summaryText(summaries) }] }
  })
}
