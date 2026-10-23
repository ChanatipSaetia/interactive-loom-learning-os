/**
 * Shared text for writing Loom topics with the `loom-topic-writer` agent
 * skill: published URLs, the skill's paths, its install commands and example
 * requests. Dependency-free so the "Create with AI" page (create.html) can
 * import it without the OpenUI compiler; the authoring prompt
 * (authoring-prompt.ts) reuses the URLs.
 */

/** Where the GitHub Pages build serves the app (vite `base` on CI). */
export const LOOM_PAGES_URL = 'https://chanatipsaetia.github.io/interactive-loom-learning-os/'
/** GitHub repository (`owner/repo`); `npx skills add` finds the skill in its `.claude/skills/`. */
export const LOOM_REPO = 'ChanatipSaetia/interactive-loom-learning-os'

/** Published authoring prompt, relative to the app base. */
export const LOOM_PROMPT_PATH = 'llm/loom-authoring-prompt.md'
/** File name of the prompt (also the skill's reference). */
export const LOOM_PROMPT_FILE_NAME = 'loom-authoring-prompt.md'

/** Agent skill (Claude app, Claude Code, opencode, …): `<name>/SKILL.md` plus the prompt as a reference. */
export const LOOM_SKILL_NAME = 'loom-topic-writer'
/** Published skill folder, relative to the app base. */
export const LOOM_SKILL_PATH = `llm/skills/${LOOM_SKILL_NAME}`
/** Published zip of the skill folder (the folder at its root), for uploading to the Claude app. */
export const LOOM_SKILL_ZIP_PATH = `llm/skills/${LOOM_SKILL_NAME}.zip`
/** The authoring prompt inside the skill folder. */
export const LOOM_SKILL_REFERENCE = `references/${LOOM_PROMPT_FILE_NAME}`

/** Installs the skill for every user-level agent the person picks (skills CLI, https://skills.sh). */
export const SKILL_ADD_COMMAND = `npx skills add ${LOOM_REPO} --skill ${LOOM_SKILL_NAME} -g`
/** Fetches the latest version of installed skills. */
export const SKILL_UPDATE_COMMAND = 'npx skills update -g'

/** Example first messages for a new chat or session. */
export const EXAMPLE_REQUESTS = [
  'Write a beginner Loom topic about HTTP caching, about 6 sections.',
  'Make a Loom topic that teaches how a sourdough starter works, for home bakers.',
  'Turn these notes into a Loom topic with a flowchart and a quiz: <paste your notes>',
]
