/**
 * Agent skill (https://agentskills.io format) for coding agents such as
 * Claude Code and opencode: `SKILL.md` with the workflow, and the full
 * authoring prompt as `references/loom-authoring-prompt.md`, read on demand.
 * `npm run oui:schema` publishes it under `public/llm/skills/` and keeps the
 * repo's own copy in `.claude/skills/` (Claude Code and opencode both read it).
 */
import { LOOM_PAGES_URL, LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE } from './llm-guide'

export const LOOM_SKILL_DESCRIPTION =
  'Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables and charts. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, fix errors reported by Loom Viewer or Loom Studio, or act on places and comments copied from their Pick mode.'

export function getLoomSkill(): string {
  return `---
name: ${LOOM_SKILL_NAME}
description: ${JSON.stringify(LOOM_SKILL_DESCRIPTION)}
---

# Loom Topic Writer

Interactive Loom turns OpenUI Lang (\`.oui\`) files into interactive lessons. \`${LOOM_SKILL_REFERENCE}\` is the full specification: topic layout, output formats, every component and prop, standard OpenUI sections (tables and charts) and the authoring rules.

## Before writing

1. Read \`${LOOM_SKILL_REFERENCE}\` in full. Do not write a section from memory; every component is positional and the signatures there are the only valid ones.
2. If the request is vague, ask at most two short questions (who the learner is, roughly how many sections). Otherwise start.
3. Read any source material the user points at (notes, docs, code) and teach only what it supports. Use real, specific facts and figures.

## Where to write

Always write a **topic folder**, one file per program, using the "Folder of .oui files" format from the reference (not the single \`.loom.oui\` file it defaults to for chats):

\`\`\`
<topic-id>/
  topic.oui            root = Topic(...) with one SectionRef per section, in reading order
  sections/
    intro.oui          root = Intro(...)
    <name>.oui         one section per file, no // === marker lines
    <name>.narrate.oui the narrator's script for that section in Present mode, one step per beat (see "Narration Files" in the reference)
\`\`\`

- **Inside the Interactive Loom repository** (it has \`public/content/\` and \`src/core/learning-engine/\`): create the folder at \`public/content/<topic-id>/\`.
- **The user names a folder**: create \`<topic-id>/\` inside it, or write straight into it if it is already a topic folder (it has \`topic.oui\`).
- **Anywhere else**: create \`<topic-id>/\` in the current directory.
- **Editing an existing topic**: change only the files involved and keep \`topic.oui\`'s \`SectionRef\` list in step with the section files. Renaming a section means renaming its file and its \`SectionRef\`.
- Write a single \`<topic-id>.loom.oui\` file only when the user asks for one file; if they give you an existing \`.loom.oui\` file to change, edit that file.

## Check before you finish

- Every \`SectionRef("<name>")\` has a \`sections/<name>.oui\` file and every section file is listed once.
- Each file has exactly one \`root =\` statement, written first; every other statement is reachable from \`root\`.
- Arguments are positional; pass \`null\` to skip an optional argument before a later one.
- IDs are unique within their section and every ID reference (\`next\`, \`root\`, \`solution\`, \`continuesAs\`, …) points at an existing ID.
- Flowchart steps follow EVENT → POLICY → COMMAND → system → EVENT, and every actor and system is used by a step.
- Every flowchart step whose events go to another actor or system sets \`sendsTo\` (the Step / BranchOption argument after \`description\`); the Sequence and System Architecture views draw only declared messages.
- System \`kind\` says what it is (aggregate, service, database or external); events that move a StateMachine into a new state set \`enters\`; \`data\` names what an event carries when it matters; \`async\` marks fire-and-forget steps.
- Each quiz question has exactly one correct choice and only tests what an earlier section teaches.
- Section types are mixed; tables and charts are standard OpenUI sections with literal data.
- Every section has a narration file \`sections/<name>.narrate.oui\` next to it, not listed in \`topic.oui\`: one \`NarrationStep\` per beat, each naming a beat ID of that section type (the table in "Narration Files"), captions in the topic's language, and every target naming a statement of that section file. Changing a section's items (questions, cards, paragraphs, steps) changes its beats, so update its narration file too. Renaming a section renames its narration file too.

## Pointers and comments from Loom Studio and Loom Viewer

People point at parts of a topic with **Pick** in Loom Studio or Loom Viewer and paste what it copies. Each pointer is one line:

\`\`\`
kafka/sections/quiz-basics.oui:14 #q2.choices[1].explanation
\`\`\`

- \`kafka\` is the topic ID and \`sections/quiz-basics.oui\` the file inside the topic folder. Find the folder that holds \`kafka/topic.oui\` (in the Interactive Loom repository: \`public/content/kafka/\`).
- \`:14\` is only a hint. The anchor after \`#\` is authoritative: \`q2\` is the statement \`q2 = …\`, and the rest follows its props by name and list positions (0-based) into inline components, using the prop names from the signatures in the reference. \`#root\` means the whole file. If the line does not hold the statement, search the file for \`q2 =\`.
- \`(unsaved)\` means the person has unsaved edits in Studio, so the file on disk may not have that statement yet; if it is missing, ask them to save.
- \`(in kafka.loom.oui)\` means the topic is in that single file: look for it in the workspace. \`(from pasted text)\` means there is no file; ask the person for the topic text.

What to do depends on the first line:

- **\`Comments on the Loom topic "<id>":\`** then a list. An indented note under a pointer is a change request for that place: make it, keep everything else unchanged, and follow the checks below. Pointers without a note are context.
- **\`Answer about the Loom topic "<id>" (do not change any files):\`** then a list and a question. Answer the question from the files; do not edit anything.
- **Pointer lines on their own** are mentions inside the person's own message: read those places and do what the message asks.

## Validate

- **Inside the Interactive Loom repository**: run \`npx vitest run tests/unit/content\` (compiles and validates every topic under \`public/content/\`) and fix every failure.
- **Elsewhere**: tell the user to open the topic folder in Loom Viewer (${LOOM_PAGES_URL}viewer.html) with **Open folder**, or in Loom Studio (${LOOM_PAGES_URL}studio.html) to edit it with a live preview. Its **Copy errors for your AI chat** button gives a fix request; when the user pastes one, fix only what it points at and keep everything else unchanged.

Finish with one or two lines: the topic folder you wrote and how to open it (Loom Viewer's **Open folder**, or \`npm run dev\` in the repository).
`
}
