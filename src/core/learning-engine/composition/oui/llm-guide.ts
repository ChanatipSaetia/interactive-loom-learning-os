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
/** File name of the full prompt (also bundled by the Viewer tutor). */
export const LOOM_PROMPT_FILE_NAME = 'loom-authoring-prompt.md'

/** Agent skills: entry points plus bundled references (focused folders for the topic writer). */
export const LOOM_SKILL_NAME = 'loom-topic-writer'
/** Published skill folder, relative to the app base. */
export const LOOM_SKILL_PATH = `llm/skills/${LOOM_SKILL_NAME}`
/** Published zip of the skill folder (the folder at its root), for uploading to the Claude app. */
export const LOOM_SKILL_ZIP_PATH = `llm/skills/${LOOM_SKILL_NAME}.zip`
/** The authoring prompt inside the skill folder. */
export const LOOM_SKILL_REFERENCE = `references/${LOOM_PROMPT_FILE_NAME}`

/** The learner skills (slice 6): tutoring with the Loom MCP App, or with Loom Viewer. */
export const LOOM_TUTOR_APP_SKILL = 'loom-tutor-app'
export const LOOM_TUTOR_VIEWER_SKILL = 'loom-tutor-viewer'
/** Every published skill, the writer first. */
export const LOOM_SKILL_NAMES = [LOOM_SKILL_NAME, LOOM_TUTOR_APP_SKILL, LOOM_TUTOR_VIEWER_SKILL] as const

/** A published skill's folder and zip, relative to the app base. */
export const skillPath = (name: string) => `llm/skills/${name}`
export const skillZipPath = (name: string) => `llm/skills/${name}.zip`

/** Installs a skill for every user-level agent the person picks (skills CLI, https://skills.sh). */
export const skillAddCommand = (name: string) => `npx skills add ${LOOM_REPO} --skill ${name} -g`
export const SKILL_ADD_COMMAND = skillAddCommand(LOOM_SKILL_NAME)
/** Fetches the latest version of installed skills. */
export const SKILL_UPDATE_COMMAND = 'npx skills update -g'

/** Example first messages for a new chat or session. */
export const EXAMPLE_REQUESTS = [
  'Write a beginner Loom topic about HTTP caching, about 6 sections.',
  'Make a Loom topic that teaches how a sourdough starter works, for home bakers.',
  'Turn these notes into a Loom topic with a flowchart and a quiz: <paste your notes>',
]
