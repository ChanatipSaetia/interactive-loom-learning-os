import { TOPIC_REPLAY_GUIDE } from './topic-replay'
import { getAuthoringWorkflow } from './authoring-workflow'
import { MENTAL_MODEL_GUIDE } from './mental-model-guide'
/**
 * The two learner skills (slice 6, decisions 201–202 in grill-log-adaptive-learning.md),
 * written from one source so their shared parts never drift apart:
 *
 * - `loom-tutor-app` for chats with the Loom MCP App: the server hands over
 *   the authoring guide, so the skill is only the routine, the folder layout
 *   and the progress note.
 * - `loom-tutor-viewer` for chats without it: the same routine, but the topic
 *   goes to Loom Viewer as one `.loom.oui` text, so it carries the authoring
 *   prompt as a reference, as `loom-topic-writer` does.
 *
 * `npm run oui:schema` publishes both next to the writer skill
 * (`schema-files.ts`). The note format matches `progressNote()` in
 * `learner-progress/memory/progress-note.ts`.
 */
import { TIME_USAGE_PLANNING_RULE } from './time-usage-authoring'
import { LOOM_PAGES_URL, LOOM_SKILL_REFERENCE, LOOM_TUTOR_APP_SKILL, LOOM_TUTOR_VIEWER_SKILL } from './llm-guide'
import { getStorageGuide } from './storage-guide'

export const TUTOR_APP_DESCRIPTION =
  'Tutor a learner with Interactive Loom inside the chat through the Loom MCP App: find their Loom folder in their cloud drive, read their progress notes, plan the next short topic on one idea (a full lesson only when asked) with callbacks to earlier ones, write it with get_authoring_guide, play it with show_topic, and save topics and progress notes to the drive. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or sends a Loom progress note to save.'

export const TUTOR_VIEWER_DESCRIPTION =
  'Tutor a learner with Interactive Loom when the chat has no Loom MCP App: find their Loom folder in their cloud drive, read the progress notes they paste from Loom Viewer, plan the next topic with callbacks to earlier ones, and write it as one .loom.oui text for them to open in Loom Viewer. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or pastes a Loom progress note.'

const FOLDER = `${TOPIC_REPLAY_GUIDE}

## The learner's Loom folder

Everything the learner keeps lives in one folder, \`Loom/\`, at the top of the cloud drive they use (My Drive in Google Drive, not a shared drive; OneDrive or SharePoint), reached with this chat's own drive connector. It is grouped by **domain**, one subject area each (fight animation, home networking), so each domain is planned from its own progress:

\`\`\`
Loom/
  index.oui                              the list of domains
  <domain-id>/
    domain.oui                           title, goal, topics in learning order
    topics/<topic-id>.loom.oui           one file per topic
    progress/<topic-id>-YYYY-MM-DD.md    one progress note per topic and day
\`\`\`

- These paths are a contract that Loom reads: use them exactly and never invent other folders.
- Look for \`Loom/\` at the start of a session. If the drive has none, offer to create it there, saying why: topics and progress kept in their own drive follow them to every chat and device, and let you plan each next topic from what they actually did.
- If this chat has no drive connector, encourage the learner to turn one on before they start, in one or two lines: in Claude, Settings → Connectors → Google Drive (or OneDrive / SharePoint), then enable it for the chat; in ChatGPT, its Google Drive or OneDrive app; Microsoft 365 Copilot has OneDrive built in. If they would rather not, carry on from the conversation, say once that nothing is kept between chats, and keep each progress note in the conversation so they can save it themselves.
- After showing a topic in an established domain, save it to the learner's drive immediately unless they opted out; do not wait for another request or ask for the same permission again. Confirm a new or ambiguous domain first. Offer each save rather than wait to be asked for progress notes, asking before saving unless already authorized. If the connector cannot write, say the topic is not saved and provide the exact file for manual saving. Never claim a save succeeded without a successful write.`

const NOTE = `## Progress notes

A note is the learner's record of one topic on one day. Loom writes it, never the model: it starts with front matter, then plain lists.

\`\`\`markdown
---
loom-progress: 1
domain: chinese
topic: chinese101-day1
date: 2026-10-24
---
# Loom progress: Chinese 101: Day 1

Played 4 of 6 sections; 5 of 7 questions right in the end.

## Sections
- [x] Greetings (\`greetings\`)
- [ ] Numbers (\`numbers\`)

## Answers
- \`sections/quiz.oui#q2\`: wrong, then right
- \`sections/quiz.oui#q5\`: wrong

## To review
- \`sections/quiz.oui#q5\`: last answer wrong
- Numbers (\`numbers\`): not played yet
\`\`\`

Items are named by file and ID inside the topic (\`sections/quiz.oui#q5\` is the statement \`q5 = …\` in that section of \`Loom/chinese/topics/chinese101-day1.loom.oui\`): open the topic to see what was asked. Save a note exactly as it came, at the path its message names (\`Loom/<domain-id>/progress/<topic>-<date>.md\`), replacing a note of the same name; when the message leaves the domain to you, put it in the topic's domain and add its \`domain:\` line.`

const PLAN_START = `1. Work in one domain: read its \`domain.oui\` (the learner's goal and the topics in order) and its \`progress/\` notes, the latest one per topic. Other domains' progress does not count unless the learner asks to connect them.
2. Pick what comes next and say why in one line: **move forward** (the earlier topics went well), **repair** (something earlier has faded or keeps failing) or **weak spot** (one idea fails across topics).`

/** A full lesson: the shape `loom-topic-writer` and the authoring guide describe. */
const FULL_LESSON = `Connect earlier knowledge when it supports this goal, rather than assigning a fixed share of callbacks. Weave an earlier word, step or formula into a new application instead of repeating the same explanation. Include recall or application questions when they provide useful evidence of learning.`

const TEACH_FIRST = 'Teach new ideas before testing them: every question tests only what an earlier section of the topic, or an earlier topic the learner has done, teaches.'

const SHOW_CONCEPT = 'When a drawing makes the concept easier to understand, include one without waiting for the learner to ask: a labelled Svg schematic for parts, space, a mechanism or a concrete analogy; use a Flowchart for a process, a chart for quantities or a ConceptMap for relationships. Pair it with a short explanation and narration that highlights the important parts one at a time. Label analogies and simplifications, keep labels readable on a phone, and prefer static shapes over decorative animation or filters. For Svg, request the `openui` section type from get_authoring_guide (or read Drawings in the reference). A picture should teach the idea, not decorate it.'

const NEXT_TOPIC = `## Planning the next topic

${PLAN_START}
3. ${FULL_LESSON}
4. ${TEACH_FIRST}
5. Keep it to one sitting, with no fixed section count or order. Select native sections and OpenUI by the learner action; use connected prose when it is the clearest explanation.
6. ${SHOW_CONCEPT}
7. ${TIME_USAGE_PLANNING_RULE}

${MENTAL_MODEL_GUIDE}`

/**
 * In a chat the topic plays right in the conversation, between messages, so a whole lesson at a time
 * is too much: the app skill writes short topics unless the learner asks for a full lesson.
 */
const NEXT_TOPIC_SHORT = `## Planning the next topic

${PLAN_START}
3. **Size it to the moment.** By default write a **short topic**: one idea the learner can take in within a few minutes. Choose the simplest faithful representation or complementary combination, with no fixed section count or order. Bullets can teach linear instructions; Flashcards can introduce definitions; use the other native sections or OpenUI when their capabilities add understanding. Include orientation or an assessment only when it serves this learning goal. Weave in one thing from an earlier topic when it fits, rather than a set share of callbacks. Then talk with the learner in the chat and offer the next short topic.
4. **Write a full lesson only when the learner asks for one** ("a full lesson", "the whole topic", "teach me everything about …", a course or a chapter): then plan complementary sections according to prerequisites, distinct learning contributions and assessment needs. ${FULL_LESSON}
5. ${TEACH_FIRST}
6. Keep each section focused and readable; complexity and interactivity need a learning purpose.
7. ${SHOW_CONCEPT}
8. ${TIME_USAGE_PLANNING_RULE}

${MENTAL_MODEL_GUIDE}`

const TUTOR = `## While the learner works

- Explain in the conversation when they ask, in the language they write in. Hint before giving an answer.
- Say what comes from the topic and what from your own knowledge.
- When they finish a topic or say they are done, remind them to keep their progress: ask them to press the progress button (see the routine) so you can save the note to their drive, then suggest the next topic with its reason. Do not let a session end with unsaved progress without saying so once.`

/**
 * What the Loom MCP server tells every chat when it connects (MCP server
 * instructions), so the routine reaches chats that never installed the skill.
 */
export const LOOM_SERVER_INSTRUCTIONS = `Loom turns learning goals into topics that play in the chat. Match scope to the request: a full lesson needs complementary learning contributions, while a quick explanation can stay focused. When the learner wants to learn or continue a subject with Loom, asks what to learn next, asks where they are in a subject, or sends a Loom progress note, call get_tutor_guide once and follow it: it is the tutoring routine (plan, write with get_authoring_guide, show with show_topic, keep topics and progress in their drive by get_storage_guide). After show_topic, save a topic in an established domain to the drive and update domain.oui unless the learner opted out; showing the app or keeping local memory does not by itself confirm a Drive save.

Reopening a lesson means reusing its complete original source unchanged, not regenerating. If it is unavailable, ask for the saved .loom.oui file.

${getAuthoringWorkflow('mcp')}`

/** The tutoring routine for chats with the Loom MCP App, served by get_tutor_guide: loom-tutor-app's own text. */
export function getTutorGuide(): string {
  return getTutorAppSkill().replace(/^---\n[\s\S]*?\n---\n+/, '')
}

export function getTutorAppSkill(): string {
  return `---
name: ${LOOM_TUTOR_APP_SKILL}
description: ${JSON.stringify(TUTOR_APP_DESCRIPTION)}
---

# Loom Tutor (Loom MCP App)

The learner learns with Interactive Loom inside this chat. The **Loom MCP App** plays each topic right in the conversation (▶ Play for Present mode, or Read), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive.

## The routine

1. **Find the folder.** Call \`get_storage_guide\` once: it is the contract for every path below. Find \`Loom/\` in the learner's drive, read \`Loom/index.oui\`, and settle which domain the learner is working on (ask when it is not clear, or propose a new one). Read that domain's \`domain.oui\` and \`progress/\`. If you find topics or notes in the old flat \`Loom/topics/\` or \`Loom/progress/\`, offer once to move them into domains ("Moving from the old layout" in the storage guide). When the Loom server's \`learner_summary\` tool is there (the server on the learner's computer), call it too with the domain: it also holds what the learner did on that computer.
${getAuthoringWorkflow('mcp')}

Include \`// @loom-domain <domain-id>\` as the second line when the domain is established. For a new topic, call \`get_authoring_guide\` with detail: focused for the selected contracts and compact core rules; reuse knownContractVersion only while the core remains available, and forceRefresh after compaction. Keep the topic short unless a full lesson was requested.

## Save topics and progress

- **Save immediately after showing.** When the topic belongs to an established domain, save the exact topic passed to \`show_topic\` as \`Loom/<domain-id>/topics/<topic-id>.loom.oui\` with the drive connector, with \`// @loom-domain <domain-id>\` as its second line, and add its \`TopicRef\` to the domain's \`domain.oui\` without duplicating an existing reference. Do not end the turn after showing the app: complete this Drive save unless the learner opted out. Local server memory alone does not confirm a Drive save; skip a duplicate write only when the same file and domain index are confirmed saved in the intended synced Drive folder. After a fix or edit, save the updated topic too. Report a successful save with its path; if writing fails or no writable connector is available, say it is not saved and provide the file for manual saving.
- **Save progress.** The app's **Save my progress** button sends a message with a progress note and the path to save it to: save it as it is, with no changes. If you cannot write files, say so and leave the note in the conversation.

When the learner asks where they are in one domain, show it with \`show_domain\`; when they ask for their library, \`show_library\` (see "Showing the learner where they are" in \`get_storage_guide\`). Never show them unasked. To play a topic again, read it from the domain's \`topics/\` and pass it to \`show_topic\` (or call \`open_topic\` when the server has it). Without the app (the chat shows no player), \`show_topic\` answers with a link that opens the topic in Loom Viewer: give the learner that link.

${FOLDER}

${NOTE}

${NEXT_TOPIC_SHORT}

${TUTOR}
`
}

export function getTutorViewerSkill(): string {
  return `---
name: ${LOOM_TUTOR_VIEWER_SKILL}
description: ${JSON.stringify(TUTOR_VIEWER_DESCRIPTION)}
---

# Loom Tutor (Loom Viewer)

The learner learns with Interactive Loom in **Loom Viewer** (${LOOM_PAGES_URL}viewer.html), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive. \`${LOOM_SKILL_REFERENCE}\` is the full specification of the topic format.

## The routine

1. **Find the folder.** Find \`Loom/\` in the learner's drive (see "Where Loom keeps the learner's topics and progress" below, the contract for every path), read \`Loom/index.oui\`, and settle which domain the learner is working on (ask when it is not clear, or propose a new one). Read that domain's \`domain.oui\` and \`progress/\`. If you find topics or notes in the old flat \`Loom/topics/\` or \`Loom/progress/\`, offer once to move them into domains ("Moving from the old layout" below).
2. **Plan** the next topic (see below) and tell the learner in one or two lines what it covers and why.
3. **Write** it: read \`${LOOM_SKILL_REFERENCE}\` in full first (every component is positional; the signatures there are the only valid ones), then write the whole topic as **one \`<topic-id>.loom.oui\` file** in the "Single .oui file" format, with a narration file for every section.
4. **Hand it over** as a file to download, or as one code block when the chat cannot make files. The learner opens it in Loom Viewer with **Open file**, or copies it and uses **Paste text**.
5. **Save** the topic as \`Loom/<domain-id>/topics/<topic-id>.loom.oui\` with the drive connector, with \`// @loom-domain <domain-id>\` as its second line, and add its \`TopicRef\` to the domain's \`domain.oui\`.
6. **Fix.** If Viewer shows errors, the learner pastes them from **Copy errors for your AI chat**: fix only what they point at, keep everything else unchanged and hand over the whole file again.
7. **Save progress.** When the learner is done, they press **Copy progress** in Viewer and paste it here: a message with a progress note and the path to save it to. Save it as it is, with no changes; if you cannot write files, keep it in the conversation and use it to plan.

${FOLDER}

${NOTE}

${getAuthoringWorkflow('files')}

${NEXT_TOPIC}

${TUTOR}

${getStorageGuide().replace(TOPIC_REPLAY_GUIDE, '').replace(/^#/gm, '##')}`
}
