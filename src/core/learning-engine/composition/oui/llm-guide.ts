/**
 * Shared text for writing Loom topics with an LLM chat (Claude or Gemini):
 * published URLs, per-assistant setup wording, the instructions to paste and
 * example requests. Dependency-free so the "Create with AI" page
 * (create.html) can import it without the OpenUI compiler; the authoring
 * prompt (authoring-prompt.ts) reuses the URLs.
 */

/** Where the GitHub Pages build serves the app (vite `base` on CI). */
export const LOOM_PAGES_URL = 'https://chanatipsaetia.github.io/interactive-loom-learning-os/'

/** Published authoring prompt, relative to the app base. */
export const LOOM_PROMPT_PATH = 'llm/loom-authoring-prompt.md'
/** File name suggested when the prompt is downloaded or shared. */
export const LOOM_PROMPT_FILE_NAME = 'loom-authoring-prompt.md'

/** Suggested name for the Claude Project / Gemini Gem. */
export const LOOM_ASSISTANT_NAME = 'Loom Topic Writer'

export type AssistantId = 'claude' | 'gemini'

/** How each chat app names the pieces of the setup. */
export interface AssistantGuide {
  id: AssistantId
  label: string
  url: string
  /** The reusable setup ("Project", "Gem"). */
  workspace: string
  /** Where the long-lived prompt file goes ("knowledge"). */
  knowledge: string
  /** Where the side-panel document lives ("artifact", "Canvas"). */
  document: string
  /** Steps to create the workspace, before adding the prompt and instructions. */
  createStep: string
}

export const ASSISTANTS: Record<AssistantId, AssistantGuide> = {
  claude: {
    id: 'claude',
    label: 'Claude',
    url: 'https://claude.ai',
    workspace: 'Project',
    knowledge: 'project knowledge',
    document: 'artifact',
    createStep: `Open claude.ai or the Claude app, go to Projects and create a project named ${LOOM_ASSISTANT_NAME}.`,
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com',
    workspace: 'Gem',
    knowledge: 'Gem knowledge',
    document: 'Canvas',
    createStep: `Open gemini.google.com, go to Gems (Explore Gems / Gem manager) and create a new Gem named ${LOOM_ASSISTANT_NAME}.`,
  },
}

/** Instructions to paste into the Claude Project or Gemini Gem (the prompt file goes in its knowledge). */
export function assistantInstructions(id: AssistantId): string {
  const { workspace, document } = ASSISTANTS[id]
  return `You write learning topics for Interactive Loom. The file ${LOOM_PROMPT_FILE_NAME} in this ${workspace}'s knowledge is the full specification. Follow its Topic Layout, Output Formats, component signatures, Standard OpenUI Sections and Loom Authoring Rules exactly.

How to work with me:
- If my request is vague, ask at most two short questions first (who the learner is, and roughly how many sections). Otherwise write the topic straight away.
- Put the whole topic in ONE ${document} as a single .loom.oui file: the first line is \`// @loom-topic <topic-id>\`, then every file after a \`// === <path> ===\` marker line. Do not repeat the topic as inline code in the chat.
- When I ask for changes, update that same ${document} so it always holds the complete, current topic.
- When I paste errors from Loom Viewer, fix only what they point at and keep everything else unchanged.
- After the ${document}, write one line: "Copy it and paste it into Loom Viewer (Paste text): ${LOOM_PAGES_URL}viewer.html"
`
}

/** Example first messages for a new chat. */
export const EXAMPLE_REQUESTS = [
  'Write a beginner Loom topic about HTTP caching, about 6 sections.',
  'Make a Loom topic that teaches how a sourdough starter works, for home bakers.',
  'Turn these notes into a Loom topic with a flowchart and a quiz: <paste your notes>',
]
