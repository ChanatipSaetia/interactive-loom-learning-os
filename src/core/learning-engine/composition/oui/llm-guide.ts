/**
 * Shared text for writing Loom topics with an LLM chat (Claude, Gemini or
 * Microsoft 365 Copilot):
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
/** The same prompt as plain text, for assistants whose knowledge upload does not take .md. */
export const LOOM_PROMPT_TEXT_FILE_NAME = 'loom-authoring-prompt.txt'

/** Suggested name for the Claude Project / Gemini Gem / Copilot agent. */
export const LOOM_ASSISTANT_NAME = 'Loom Topic Writer'

export type AssistantId = 'claude' | 'gemini' | 'copilot'

/** How each chat app names the pieces of the setup. */
export interface AssistantGuide {
  id: AssistantId
  label: string
  url: string
  /** The reusable setup ("Project", "Gem", "agent"). */
  workspace: string
  /** Where the long-lived prompt file goes ("knowledge"). */
  knowledge: string
  /** Where the topic is written ("artifact", "Canvas", "code block"). */
  document: string
  /** True when the assistant edits that document in place; otherwise it writes the whole topic again. */
  editsInPlace: boolean
  /** Name of the prompt file to upload as knowledge. */
  promptFileName: string
  /** Optional requirement shown with the setup steps (e.g. which account is needed). */
  note?: string
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
    editsInPlace: true,
    promptFileName: LOOM_PROMPT_FILE_NAME,
    createStep: `Open claude.ai or the Claude app, go to Projects and create a project named ${LOOM_ASSISTANT_NAME}.`,
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com',
    workspace: 'Gem',
    knowledge: 'Gem knowledge',
    document: 'Canvas',
    editsInPlace: true,
    promptFileName: LOOM_PROMPT_FILE_NAME,
    createStep: `Open gemini.google.com, go to Gems (Explore Gems / Gem manager) and create a new Gem named ${LOOM_ASSISTANT_NAME}.`,
  },
  copilot: {
    id: 'copilot',
    label: 'Copilot',
    url: 'https://m365.cloud.microsoft/chat',
    workspace: 'agent',
    knowledge: 'agent knowledge',
    document: 'code block',
    editsInPlace: false,
    promptFileName: LOOM_PROMPT_TEXT_FILE_NAME,
    note: 'Copilot agents need a Microsoft 365 work or school account. Agent knowledge takes .txt but not .md files, so download the prompt as .txt.',
    createStep: `Open Microsoft 365 Copilot Chat, choose Create agent, open the Configure tab and name the agent ${LOOM_ASSISTANT_NAME}.`,
  },
}

/** Instructions to paste into the Claude Project, Gemini Gem or Copilot agent (the prompt file goes in its knowledge). */
export function assistantInstructions(id: AssistantId): string {
  const { workspace, document, editsInPlace, promptFileName } = ASSISTANTS[id]
  const changes = editsInPlace
    ? `update that same ${document} so it always holds the complete, current topic.`
    : `answer with the complete, updated topic in one new ${document}, never only the changed part.`
  return `You write learning topics for Interactive Loom. The file ${promptFileName} in this ${workspace}'s knowledge is the full specification. Follow its Topic Layout, Output Formats, component signatures, Standard OpenUI Sections and Loom Authoring Rules exactly.

How to work with me:
- If my request is vague, ask at most two short questions first (who the learner is, and roughly how many sections). Otherwise write the topic straight away.
- Put the whole topic in ONE ${document} as a single .loom.oui file: the first line is \`// @loom-topic <topic-id>\`, then every file after a \`// === <path> ===\` marker line.${editsInPlace ? ' Do not repeat the topic as inline code in the chat.' : ''}
- When I ask for changes, ${changes}
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
