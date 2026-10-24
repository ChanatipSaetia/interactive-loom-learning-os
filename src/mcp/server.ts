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
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { getAuthoringGuide, guideSectionTypes } from '../core/learning-engine/composition/oui/authoring-guide'
import { readTopicText } from '../core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic, loadErrorReport, topicErrorReport } from '../viewer/compileTopic'

/** Where the published app lives; each server release names the app version it was built for. */
export const DEFAULT_APP_URL = 'https://chanatipsaetia.github.io/interactive-loom-learning-os/mcp-app/v1/'
export const APP_URI = 'ui://loom/app-v1.html'
/** The app's stylesheet loads Loom's fonts from Google Fonts. */
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']

export interface LoomServerOptions {
  /** Base URL of the app's `app.js` and `app.css`, ending in `/`. */
  appUrl?: string
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
    const shown = check.title ? `Showing "${check.title}" (${check.sections.length} sections). The learner can press Play.` : 'Showing the topic.'
    return { content: [{ type: 'text', text: check.ok ? shown : `${shown}\n\nIt has errors; the learner sees them in the app:\n\n${check.report}` }] }
  })

  return server
}
