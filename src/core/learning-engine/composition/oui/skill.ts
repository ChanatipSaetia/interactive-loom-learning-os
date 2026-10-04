/**
 * Agent skill (https://agentskills.io format) for coding agents such as
 * Claude Code and opencode: `SKILL.md` with the workflow, and the full
 * authoring prompt as `references/loom-authoring-prompt.md`, read on demand.
 * `npm run oui:schema` publishes it under `public/llm/skills/` and keeps the
 * repo's own copy in `.claude/skills/` (Claude Code and opencode both read it).
 */
import { LOOM_PAGES_URL, LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE } from './llm-guide'

export const LOOM_SKILL_DESCRIPTION =
  'Write, extend or fix Interactive Loom learning topics: OpenUI Lang files (topic.oui plus sections/<name>.oui, or one <topic-id>.loom.oui file) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables and charts. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, or fix errors reported by Loom Viewer or Loom Studio.'

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

- **Inside the Interactive Loom repository** (it has \`public/content/\` and \`src/core/learning-engine/\`): write a folder \`public/content/<topic-id>/\` with \`topic.oui\` and one \`sections/<name>.oui\` per section. Editing an existing topic: change only the files involved and keep \`topic.oui\`'s \`SectionRef\` list in step with the section files.
- **The user names a folder or a file**: write there, as a topic folder or a single \`<topic-id>.loom.oui\` file.
- **Anywhere else**: write one \`<topic-id>.loom.oui\` file in the current directory (first line \`// @loom-topic <topic-id>\`, each file after a \`// === <path> ===\` marker line).

## Check before you finish

- Every \`SectionRef("<name>")\` has a \`sections/<name>.oui\` file and every section file is listed once.
- Each file has exactly one \`root =\` statement, written first; every other statement is reachable from \`root\`.
- Arguments are positional; pass \`null\` to skip an optional argument before a later one.
- IDs are unique within their section and every ID reference (\`next\`, \`root\`, \`solution\`, \`continuesAs\`, …) points at an existing ID.
- Flowchart steps follow EVENT → POLICY → COMMAND → system → EVENT, and every actor and system is used by a step.
- Each quiz question has exactly one correct choice and only tests what an earlier section teaches.
- Section types are mixed; tables and charts are standard OpenUI sections with literal data.

## Validate

- **Inside the Interactive Loom repository**: run \`npx vitest run tests/unit/content\` (compiles and validates every topic under \`public/content/\`) and fix every failure.
- **Elsewhere**: tell the user to open the file or folder in Loom Viewer (${LOOM_PAGES_URL}viewer.html). Its **Copy errors for your AI chat** button gives a fix request; when the user pastes one, fix only what it points at and keep everything else unchanged.

Finish with one or two lines: the files you wrote and how to open them (Loom Viewer, or \`npm run dev\` in the repository).
`
}
