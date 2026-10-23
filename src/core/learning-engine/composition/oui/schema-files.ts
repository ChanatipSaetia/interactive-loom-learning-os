/**
 * Contents of the generated LLM files (scripts/gen-oui-schema.ts), keyed by
 * path from the repository root. They live in `public/`, so the GitHub Pages
 * build serves them next to the app. Shared with the unit test that keeps the
 * committed files fresh.
 */
import { LOOM_PAGES_URL, OPENUI_LANG_DOCS_URL, OPENUI_REACT_UI_DOCS_URL, getLoomAuthoringPrompt } from './authoring-prompt'
import { LOOM_PROMPT_PATH, LOOM_SKILL_NAME, LOOM_SKILL_PATH, LOOM_SKILL_REFERENCE, LOOM_SKILL_ZIP_PATH } from './llm-guide'
import { getLoomSkill } from './skill'
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
- [Loom agent skill](${LOOM_PAGES_URL}${LOOM_SKILL_PATH}/SKILL.md): \`${LOOM_SKILL_NAME}\` skill for the Claude app and coding agents (Claude Code, opencode, …); its reference \`${LOOM_SKILL_REFERENCE}\` is the authoring prompt. Also as a [zip](${LOOM_PAGES_URL}${LOOM_SKILL_ZIP_PATH}) for uploading to the Claude app.

## OpenUI

- [OpenUI Lang specification](${OPENUI_LANG_DOCS_URL}): the language every \`.oui\` file is written in.
- [OpenUI react-ui components](${OPENUI_REACT_UI_DOCS_URL}): the standard component library used by \`// @openui\` sections.

## Tools

- [Create with AI](${LOOM_PAGES_URL}create.html): add the skill to the Claude app (zip upload) or to coding agents (\`npx skills add\`), step by step.
- [Loom Viewer](${LOOM_PAGES_URL}viewer.html): opens a \`.loom.oui\` file, a \`.zip\` or a topic folder, read-only.
- [Loom Studio](${LOOM_PAGES_URL}studio.html): edits a topic folder with code, form and live preview.
`
}

/** The skill folder's files, keyed by path inside the folder. */
function skillFiles(prompt: string): Record<string, string> {
  return { 'SKILL.md': getLoomSkill(), [LOOM_SKILL_REFERENCE]: prompt }
}

/**
 * Files of the published skill zip (`LOOM_SKILL_ZIP_PATH`), keyed by path
 * inside it: the skill folder sits at the root, as the Claude app's skill
 * upload expects. scripts/gen-oui-schema.ts zips them.
 */
export function skillZipFiles(): Record<string, string> {
  const files = skillFiles(getLoomAuthoringPrompt())
  return Object.fromEntries(Object.entries(files).map(([name, text]) => [`${LOOM_SKILL_NAME}/${name}`, text]))
}

export function ouiSchemaFiles(): Record<string, string> {
  const prompt = getLoomAuthoringPrompt()
  const files: Record<string, string> = {
    [`public/${PROMPT_PATH}`]: prompt,
    [`public/${SCHEMA_PATH}`]: `${JSON.stringify(getLoomOUIJSONSchema(), null, 2)}\n`,
    'public/llms.txt': llmsTxt(),
  }
  // Published for download, and the repo's own copy for agents working here.
  for (const dir of [`public/${LOOM_SKILL_PATH}`, `.claude/skills/${LOOM_SKILL_NAME}`]) {
    for (const [name, text] of Object.entries(skillFiles(prompt))) files[`${dir}/${name}`] = text
  }
  return files
}
