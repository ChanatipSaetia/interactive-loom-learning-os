/**
 * Contents of the generated LLM files (scripts/gen-oui-schema.ts), keyed by
 * path from the repository root. They live in `public/`, so the GitHub Pages
 * build serves them next to the app. Shared with the unit test that keeps the
 * committed files fresh.
 */
import { LOOM_PAGES_URL, OPENUI_LANG_DOCS_URL, OPENUI_REACT_UI_DOCS_URL, getLoomAuthoringPrompt } from './authoring-prompt'
import {
  LOOM_PROMPT_PATH,
  LOOM_SKILL_NAME,
  LOOM_SKILL_NAMES,
  LOOM_SKILL_PATH,
  LOOM_SKILL_REFERENCE,
  LOOM_SKILL_ZIP_PATH,
  LOOM_TUTOR_APP_SKILL,
  LOOM_TUTOR_VIEWER_SKILL,
  skillPath,
  skillZipPath,
} from './llm-guide'
import { getLoomSkill } from './skill'
import { getWriterSkillReferences } from './skill-references'
import { getTutorAppSkill, getTutorViewerSkill } from './tutor-skills'
import { getLoomOUIJSONSchema } from './library'

const PROMPT_PATH = LOOM_PROMPT_PATH
const SCHEMA_PATH = 'llm/loom-oui.schema.json'

/** `llms.txt` (https://llmstxt.org) index pointing LLM tools at the files. */
function llmsTxt(): string {
  return `# Interactive Loom

> Interactive learning app. A topic is a folder of OpenUI Lang (\`.oui\`) files: \`topic.oui\` plus one \`sections/<name>.oui\` per section, and optionally \`sections/<name>.narrate.oui\` narration for Present mode. An LLM can write a whole topic as one \`.loom.oui\` file or a folder of \`.oui\` files, and the user opens it in Loom Viewer.

## Authoring

- [Loom authoring prompt](${LOOM_PAGES_URL}${PROMPT_PATH}): system prompt for writing a topic: layout, output formats, every component and prop, rules and an example.
- [Loom OpenUI JSON Schema](${LOOM_PAGES_URL}${SCHEMA_PATH}): JSON Schema of every component's props, with descriptions.
- [Loom agent skill](${LOOM_PAGES_URL}${LOOM_SKILL_PATH}/SKILL.md): \`${LOOM_SKILL_NAME}\` skill for the Claude app and coding agents (Claude Code, opencode, …); its \`references/\` folder contains focused core, planning, section and visual guides. Also as a [zip](${LOOM_PAGES_URL}${LOOM_SKILL_ZIP_PATH}) for uploading to the Claude app.

## Learning

- [Loom tutor skill, with the Loom MCP App](${LOOM_PAGES_URL}${skillPath(LOOM_TUTOR_APP_SKILL)}/SKILL.md): \`${LOOM_TUTOR_APP_SKILL}\` plans, writes and plays each next topic inside the chat, and keeps topics and progress notes in the learner's drive ([zip](${LOOM_PAGES_URL}${skillZipPath(LOOM_TUTOR_APP_SKILL)})).
- [Loom tutor skill, with Loom Viewer](${LOOM_PAGES_URL}${skillPath(LOOM_TUTOR_VIEWER_SKILL)}/SKILL.md): \`${LOOM_TUTOR_VIEWER_SKILL}\` does the same for chats without the app; the learner opens each topic in Loom Viewer and pastes back its progress notes ([zip](${LOOM_PAGES_URL}${skillZipPath(LOOM_TUTOR_VIEWER_SKILL)})).

## OpenUI

- [OpenUI Lang specification](${OPENUI_LANG_DOCS_URL}): the language every \`.oui\` file is written in.
- [OpenUI react-ui components](${OPENUI_REACT_UI_DOCS_URL}): the standard component library used by \`// @openui\` sections.

## Tools

- [Create with AI](${LOOM_PAGES_URL}create.html): add the skill to the Claude app (zip upload) or to coding agents (\`npx skills add\`), step by step.
- [Loom Viewer](${LOOM_PAGES_URL}viewer.html): opens a \`.loom.oui\` file, a \`.zip\` or a topic folder, read-only.
- [Loom Studio](${LOOM_PAGES_URL}studio.html): edits a topic folder with code, form and live preview.
`
}

/**
 * A skill folder's files, keyed by path inside the folder. The writer and the
 * Viewer tutor carry authoring guidance (focused references for the writer); the app tutor gets it from the
 * Loom MCP server (decision 202).
 */
function skillFiles(name: string, prompt: string): Record<string, string> {
  if (name === LOOM_TUTOR_APP_SKILL) return { 'SKILL.md': getTutorAppSkill() }
  if (name === LOOM_TUTOR_VIEWER_SKILL) return { 'SKILL.md': getTutorViewerSkill(), [LOOM_SKILL_REFERENCE]: prompt }
  return { 'SKILL.md': getLoomSkill(), ...getWriterSkillReferences() }
}

/**
 * Files of a published skill zip (`skillZipPath(name)`), keyed by path
 * inside it: the skill folder sits at the root, as the Claude app's skill
 * upload expects. scripts/gen-oui-schema.ts zips them.
 */
export function skillZipFiles(name: string = LOOM_SKILL_NAME): Record<string, string> {
  const files = skillFiles(name, getLoomAuthoringPrompt())
  return Object.fromEntries(Object.entries(files).map(([file, text]) => [`${name}/${file}`, text]))
}

export function ouiSchemaFiles(): Record<string, string> {
  const prompt = getLoomAuthoringPrompt()
  const files: Record<string, string> = {
    [`public/${PROMPT_PATH}`]: prompt,
    [`public/${SCHEMA_PATH}`]: `${JSON.stringify(getLoomOUIJSONSchema(), null, 2)}\n`,
    'public/llms.txt': llmsTxt(),
  }
  // Published for download, and the repo's own copy for agents working here.
  for (const skill of LOOM_SKILL_NAMES) {
    for (const dir of [`public/${skillPath(skill)}`, `.claude/skills/${skill}`]) {
      for (const [name, text] of Object.entries(skillFiles(skill, prompt))) files[`${dir}/${name}`] = text
    }
  }
  return files
}
