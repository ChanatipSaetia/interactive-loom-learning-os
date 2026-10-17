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

/** Agent skill for coding agents (Claude Code, opencode): `<name>/SKILL.md` plus the prompt as a reference. */
export const LOOM_SKILL_NAME = 'loom-topic-writer'
/** Published skill folder, relative to the app base. */
export const LOOM_SKILL_PATH = `llm/skills/${LOOM_SKILL_NAME}`
/** The authoring prompt inside the skill folder. */
export const LOOM_SKILL_REFERENCE = `references/${LOOM_PROMPT_FILE_NAME}`

/** Where each coding agent looks for user-level skills. */
export const SKILL_TOOLS = [
  { id: 'claude-code', label: 'Claude Code', dir: `~/.claude/skills/${LOOM_SKILL_NAME}`, note: 'opencode reads this folder too' },
  { id: 'opencode', label: 'opencode', dir: `~/.config/opencode/skills/${LOOM_SKILL_NAME}`, note: 'only opencode reads this folder' },
] as const

/** Shell command (macOS, Linux, WSL) that downloads the published skill into `dir`. */
export function skillInstallCommand(dir: string, base = LOOM_PAGES_URL): string {
  const url = `${base}${LOOM_SKILL_PATH}`
  return `mkdir -p ${dir}/references && curl -fsSL ${url}/SKILL.md -o ${dir}/SKILL.md && curl -fsSL ${url}/${LOOM_SKILL_REFERENCE} -o ${dir}/${LOOM_SKILL_REFERENCE}`
}

/**
 * Markdown to paste into Claude Code or opencode: the agent installs the
 * skill itself (works on any OS, since the agent picks the download tool).
 */
export function skillInstallPrompt(base = LOOM_PAGES_URL): string {
  const url = `${base}${LOOM_SKILL_PATH}`
  const [claudeCode, opencode] = SKILL_TOOLS
  return `# Install the Loom topic writer skill

Install the \`${LOOM_SKILL_NAME}\` agent skill for me. It teaches you to write Interactive Loom learning topics (OpenUI Lang \`.oui\` files).

1. Pick the skill folder for the agent you are:
   - Claude Code: \`${claudeCode.dir}\` (opencode reads this folder too)
   - opencode: \`${opencode.dir}\`
   On Windows, \`~\` is the user profile folder (\`%USERPROFILE%\`).
2. Download these two files into that folder, keeping the paths (replace existing files to update):
   - ${url}/SKILL.md → \`SKILL.md\`
   - ${url}/${LOOM_SKILL_REFERENCE} → \`${LOOM_SKILL_REFERENCE}\`
3. Check that \`SKILL.md\` starts with \`---\` and \`name: ${LOOM_SKILL_NAME}\`, and that the reference file is about 40 KB of Markdown, not an HTML error page.
4. Tell me where you installed it, and whether I need to restart you or start a new session before the skill shows up.

On macOS, Linux or WSL this one command does steps 1–2 for Claude Code:

\`\`\`sh
${skillInstallCommand(claudeCode.dir, base)}
\`\`\`

After that I can ask, for example: "Write a Loom topic about HTTP caching".
`
}

/** Example first messages for a new chat. */
export const EXAMPLE_REQUESTS = [
  'Write a beginner Loom topic about HTTP caching, about 6 sections.',
  'Make a Loom topic that teaches how a sourdough starter works, for home bakers.',
  'Turn these notes into a Loom topic with a flowchart and a quiz: <paste your notes>',
]

// --- Built-in AI assistant (grill-log-ai-assistant.md) --------------------------

/**
 * Model servers for the AI assistant in Loom Viewer and Loom Studio, which
 * call an OpenAI-compatible API straight from the browser. Base URLs match
 * the assistant's presets (`authoring-editor/assistant/presets.ts`, checked
 * by unit tests); `origin` is the page the person opens Viewer or Studio on.
 */
export interface ModelServerGuide {
  /** The assistant preset with the same base URL. */
  id: 'ollama' | 'lmstudio' | 'llamacpp' | 'openrouter'
  label: string
  baseUrl: string
  /** Runs on the person's own computer (or network). */
  local: boolean
  needsKey: boolean
  /** Setup steps, worded for this page's origin. */
  steps(origin: string): string[]
  /** Terminal command to start the server, if it has one. */
  command?(origin: string): string
}

export const MODEL_SERVERS: ModelServerGuide[] = [
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    local: true,
    needsKey: false,
    steps: (origin) => [
      'Install Ollama from ollama.com and pull a model, for example: ollama pull qwen3:8b',
      `Ollama only answers pages on localhost unless told otherwise. Quit it, then start it with OLLAMA_ORIGINS set to ${origin} (command below). On macOS with the app: launchctl setenv OLLAMA_ORIGINS "${origin}", then restart Ollama.`,
      'To reach Ollama from another device on your network, also set OLLAMA_HOST=0.0.0.0 and use http://<computer-ip>:11434/v1 as the base URL.',
    ],
    command: (origin) => `OLLAMA_ORIGINS=${origin} ollama serve`,
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    local: true,
    needsKey: false,
    steps: () => [
      'Install LM Studio from lmstudio.ai and download a model.',
      'Open the Developer tab, load the model and start the server.',
      'In the server settings turn on "Enable CORS" (and "Serve on Local Network" to reach it from another device).',
    ],
  },
  {
    id: 'llamacpp',
    label: 'llama.cpp',
    baseUrl: 'http://localhost:8080/v1',
    local: true,
    needsKey: false,
    steps: () => [
      'Start llama-server with a GGUF model (command below). It accepts requests from web pages by default.',
      'To reach it from another device on your network, add --host 0.0.0.0 and use http://<computer-ip>:8080/v1 as the base URL.',
    ],
    command: () => 'llama-server -m model.gguf --port 8080',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    local: false,
    needsKey: true,
    steps: () => [
      'Create an API key at openrouter.ai/keys.',
      'Paste it into the API key field. It stays in this browser: forgotten when the tab closes unless you tick "Remember key on this device", and sent only to openrouter.ai.',
    ],
  },
]

/**
 * Why a model on your own network may not answer the published (https)
 * pages, and what to do instead.
 */
export const LOCAL_MODEL_NOTE =
  'The published Viewer and Studio are served over https. http://localhost always works. For a model on another computer of your network (http://192.168.x.x, a Tailscale 100.x.x.x address or <name>.local), Chrome asks to let the site access devices on your local network: allow it. Other browsers block that; run Studio on your own machine with npm run studio, or give the server an https address (for example a tunnel).'
