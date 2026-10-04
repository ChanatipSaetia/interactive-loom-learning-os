/**
 * Contents of the generated LLM files (scripts/gen-oui-schema.ts), keyed by
 * path from the repository root. They live in `public/`, so the GitHub Pages
 * build serves them next to the app. Shared with the unit test that keeps the
 * committed files fresh.
 */
import { LOOM_PAGES_URL, OPENUI_LANG_DOCS_URL, OPENUI_REACT_UI_DOCS_URL, getLoomAuthoringPrompt } from './authoring-prompt'
import { getLoomOUIJSONSchema } from './library'

const PROMPT_PATH = 'llm/loom-authoring-prompt.md'
const SCHEMA_PATH = 'llm/loom-oui.schema.json'

/** `llms.txt` (https://llmstxt.org) index pointing LLM tools at the files. */
function llmsTxt(): string {
  return `# Interactive Loom

> Interactive learning app. A topic is a folder of OpenUI Lang (\`.oui\`) files: \`topic.oui\` plus one \`sections/<name>.oui\` per section. An LLM can write a whole topic as one \`.loom.oui\` file or a folder of \`.oui\` files, and the user opens it in Loom Viewer.

## Authoring

- [Loom authoring prompt](${LOOM_PAGES_URL}${PROMPT_PATH}): system prompt for writing a topic: layout, output formats, every component and prop, rules and an example.
- [Loom OpenUI JSON Schema](${LOOM_PAGES_URL}${SCHEMA_PATH}): JSON Schema of every component's props, with descriptions.

## OpenUI

- [OpenUI Lang specification](${OPENUI_LANG_DOCS_URL}): the language every \`.oui\` file is written in.
- [OpenUI react-ui components](${OPENUI_REACT_UI_DOCS_URL}): the standard component library used by \`// @openui\` sections.

## Tools

- [Loom Viewer](${LOOM_PAGES_URL}viewer.html): opens a \`.loom.oui\` file, a \`.zip\` or a topic folder, read-only.
- [Loom Studio](${LOOM_PAGES_URL}studio.html): edits a topic folder with code, form and live preview.
`
}

export function ouiSchemaFiles(): Record<string, string> {
  return {
    [`public/${PROMPT_PATH}`]: getLoomAuthoringPrompt(),
    [`public/${SCHEMA_PATH}`]: `${JSON.stringify(getLoomOUIJSONSchema(), null, 2)}\n`,
    'public/llms.txt': llmsTxt(),
  }
}
