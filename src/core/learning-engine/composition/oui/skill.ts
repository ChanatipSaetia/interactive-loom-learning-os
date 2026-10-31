/** Short entry point; detailed guidance is generated into references/ by skill-references.ts. */
import { SECTION_MENTAL_MODELS } from './mental-model-guide'
import { LOOM_SKILL_NAME } from './llm-guide'

export const LOOM_SKILL_DESCRIPTION =
  'Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables, charts and SVG drawings. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, fix errors reported by Loom Viewer or Loom Studio, or act on places and comments copied from their Pick mode.'

export function getLoomSkill(): string {
  return `---
name: ${LOOM_SKILL_NAME}
description: ${JSON.stringify(LOOM_SKILL_DESCRIPTION)}
---

# Loom Topic Writer

Write, extend or repair Interactive Loom lessons as OpenUI Lang (.oui) content. Loom renders the UI; this skill authors topic, section and narration files.

## Reading order

Paths below are relative to this skill folder. Read the linked files, not only this entry point. Load only the references relevant to the task; do not read every section spec.

1. Read the user's source material. Establish the learner and goal; ask at most two short questions only when needed.
2. Choose sections from the table below. Read [mental models](references/planning/mental-models.md) for selection cues, flowchart views and chart choices, and [visual planning](references/planning/visuals.md) before planning a new lesson. Proactively illustrate time, quantities, structure or mechanisms when they teach the idea.
3. Before writing any OUI, read [syntax](references/core/syntax.md), [topic and shared components](references/core/components.md), [authoring rules](references/core/rules.md), [output location](references/workflow/output.md) and [file formats](references/core/formats.md). The workflow's folder default takes precedence over generic chat output examples. Use exact positional signatures; never invent arguments or write from memory.
4. Read the reference for each selected section below. It contains that type's exact components, field descriptions and presentation beats. For Present, also read [narration](references/core/narration.md). Write a narration file for every section and cover every beat.
5. Write the files, then follow [validation and delivery](references/workflow/validation.md). A complete [topic example](references/examples/topic.md) is available when needed; adapt to the learner rather than copying its lesson structure.

## Choose the mental model

| Learning goal | Section reference |
|---|---|
${SECTION_MENTAL_MODELS.map(({ type, model }) => `| ${model} | [${type}](references/sections/${type}.md) |`).join('\n')}

Flashcards teach definitions and meaning as well as recall. Tradeoff Sandbox presents options and compares their suitability as well as gains and costs. Select only what helps this topic; the table is not a mandatory sequence.

## Editing existing content

Read the current topic and affected section references first. Change only what the request needs. Keep SectionRef names, file names, IDs and narration in sync. For Studio/Viewer pointers or comments, read [Pick and comments](references/workflow/pick.md); respect requests to answer without editing.

Standard OpenUI references are split into [layouts](references/openui/layouts.md), [tables and charts](references/openui/charts.md), [SVG drawings](references/openui/drawings.md), and [time, shares and utilization](references/openui/time-usage.md). Read only the visual families you use, after the OpenUI section reference.
`
}
