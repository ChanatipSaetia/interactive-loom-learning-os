/** Workflow references for the installed topic-writer skill. */
import { LOOM_PAGES_URL } from './llm-guide'

export const WRITER_VISUAL_PLANNING = `# Plan how to show the concept

- Before writing, identify what the learner should be able to picture or explain. When a spatial relationship, mechanism, structure or abstract idea is easier to understand visually, include a labelled concept drawing with \`Svg\`; do not wait for the learner to ask for a picture.
- Choose the visual that teaches the idea: a schematic or before/after drawing for a mechanism, a Flowchart for a process with actors, a chart for quantities, or a ConceptMap for relationships. A useful drawing can be the main section of a short topic; do not add decorative pictures or force a diagram into every topic.
- Pair the drawing with a short explanation of what to notice and why it matters. Name important shapes with IDs and use narration to highlight them one at a time, connecting each visible part to the concept. Clearly label analogies and simplifications; never imply that a schematic is to scale.
- Design for a phone: a few large labelled parts, readable text, strong theme-aware contrast and no overlapping labels. Split a dense drawing into simpler views. Prefer static SVG with narration highlights; use motion only when it explains a change, avoiding blur, filters and decorative animation.
- Follow the reference's \`// @openui\` section format and \`Svg\` signature. Keep the drawing a named child of a Card or Stack so Present narration can target \`"drawing.shapeId"\`.`

export const WRITER_OUTPUT = `# Where to write

Always write a **topic folder**, one file per program, using the "Folder of .oui files" format from references/core/formats.md (not the single \`.loom.oui\` file it defaults to for chats):

\`\`\`
<topic-id>/
  topic.oui            root = Topic(...) with one SectionRef per section, in reading order
  sections/
    intro.oui          root = Intro(...)
    <name>.oui         one section per file, no // === marker lines
    <name>.narrate.oui the narrator's script for that section in Present mode, one or more steps per beat (see references/core/narration.md)
\`\`\`

- **Inside the Interactive Loom repository** (it has \`public/content/\` and \`src/core/learning-engine/\`): create the folder at \`public/content/<topic-id>/\`.
- **The user names a folder**: create \`<topic-id>/\` inside it, or write straight into it if it is already a topic folder (it has \`topic.oui\`).
- **Anywhere else**: create \`<topic-id>/\` in the current directory.
- **In a chat app without a project folder** (the Claude app, where files go to an outputs folder for the user to download): write one \`<topic-id>.loom.oui\` file there instead (the "Single .oui file" format in references/core/formats.md, saved as a file rather than a code block) and hand it to the user; Loom Viewer opens it with Open file or Paste text.
- **Editing an existing topic**: change only the files involved and keep \`topic.oui\`'s \`SectionRef\` list in step with the section files. Renaming a section means renaming its file and its \`SectionRef\`.
- Otherwise write a single \`<topic-id>.loom.oui\` file only when the user asks for one file; if they give you an existing \`.loom.oui\` file to change, edit that file.`

export const WRITER_PICK = `# Pointers and comments from Loom Studio and Loom Viewer

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
- **Pointer lines on their own** are mentions inside the person's own message: read those places and do what the message asks.`

export const WRITER_VALIDATION = `# Validate and deliver

- Every SectionRef has one matching section file, and every section file is listed once. Every file has one root, written first; all other statements are reachable from it.
- Use exact positional signatures, with null to skip an optional argument before a later one. Check unique IDs, references and each selected section's semantic rules.
- Teach the facts before assessing them. Mix section types only where they help the learning goal; use specific, grounded content and meaningful visuals.
- Every section has a matching narration file, not listed in topic.oui. Cover every actual beat using the IDs in its section reference; use resolvable targets and explanatory captions in the topic's language. Update narration whenever items or section names change.
- **Inside the Interactive Loom repository**: run \`npx vitest run tests/unit/content\` and fix every failure.
- **Elsewhere**: open the topic in Loom Viewer (${LOOM_PAGES_URL}viewer.html) or Loom Studio (${LOOM_PAGES_URL}studio.html). If you cannot open it, tell the user how. Its **Copy errors for your AI chat** button gives a fix request; fix the reported errors and refresh.
- Inspect Read and Present when a browser is available: check text size, hierarchy, overflow, each narration beat and its focus targets. Distinguish checks you ran from checks the user still needs to run.

Finish with one or two lines: the topic folder or file you wrote and how to open it (Viewer's **Open folder** / Open file, or \`npm run dev\` in the repository).
`
