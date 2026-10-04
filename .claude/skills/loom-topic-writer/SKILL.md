---
name: loom-topic-writer
description: "Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables and charts. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, or fix errors reported by Loom Viewer or Loom Studio."
---

# Loom Topic Writer

Interactive Loom turns OpenUI Lang (`.oui`) files into interactive lessons. `references/loom-authoring-prompt.md` is the full specification: topic layout, output formats, every component and prop, standard OpenUI sections (tables and charts) and the authoring rules.

## Before writing

1. Read `references/loom-authoring-prompt.md` in full. Do not write a section from memory; every component is positional and the signatures there are the only valid ones.
2. If the request is vague, ask at most two short questions (who the learner is, roughly how many sections). Otherwise start.
3. Read any source material the user points at (notes, docs, code) and teach only what it supports. Use real, specific facts and figures.

## Where to write

Always write a **topic folder**, one file per program, using the "Folder of .oui files" format from the reference (not the single `.loom.oui` file it defaults to for chats):

```
<topic-id>/
  topic.oui            root = Topic(...) with one SectionRef per section, in reading order
  sections/
    intro.oui          root = Intro(...)
    <name>.oui         one section per file, no // === marker lines
```

- **Inside the Interactive Loom repository** (it has `public/content/` and `src/core/learning-engine/`): create the folder at `public/content/<topic-id>/`.
- **The user names a folder**: create `<topic-id>/` inside it, or write straight into it if it is already a topic folder (it has `topic.oui`).
- **Anywhere else**: create `<topic-id>/` in the current directory.
- **Editing an existing topic**: change only the files involved and keep `topic.oui`'s `SectionRef` list in step with the section files. Renaming a section means renaming its file and its `SectionRef`.
- Write a single `<topic-id>.loom.oui` file only when the user asks for one file; if they give you an existing `.loom.oui` file to change, edit that file.

## Check before you finish

- Every `SectionRef("<name>")` has a `sections/<name>.oui` file and every section file is listed once.
- Each file has exactly one `root =` statement, written first; every other statement is reachable from `root`.
- Arguments are positional; pass `null` to skip an optional argument before a later one.
- IDs are unique within their section and every ID reference (`next`, `root`, `solution`, `continuesAs`, …) points at an existing ID.
- Flowchart steps follow EVENT → POLICY → COMMAND → system → EVENT, and every actor and system is used by a step.
- Each quiz question has exactly one correct choice and only tests what an earlier section teaches.
- Section types are mixed; tables and charts are standard OpenUI sections with literal data.

## Validate

- **Inside the Interactive Loom repository**: run `npx vitest run tests/unit/content` (compiles and validates every topic under `public/content/`) and fix every failure.
- **Elsewhere**: tell the user to open the topic folder in Loom Viewer (https://chanatipsaetia.github.io/interactive-loom-learning-os/viewer.html) with **Open folder**, or in Loom Studio (https://chanatipsaetia.github.io/interactive-loom-learning-os/studio.html) to edit it with a live preview. Its **Copy errors for your AI chat** button gives a fix request; when the user pastes one, fix only what it points at and keep everything else unchanged.

Finish with one or two lines: the topic folder you wrote and how to open it (Loom Viewer's **Open folder**, or `npm run dev` in the repository).
