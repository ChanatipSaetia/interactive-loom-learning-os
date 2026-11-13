# Loom in your AI chat: install and use

Loom turns what you want to learn into short interactive topics. With the **Loom MCP server** connected, your AI chat writes a topic, checks it, and shows it right in the conversation: a card with **▶ Play** that plays it as a narrated presentation, or **Read** to work through it by hand. Your topics and progress stay in your own drive, grouped by subject (domain).

This page covers every way to set it up and use it. The design is in [grill-log-adaptive-learning.md](../grill-log-adaptive-learning.md) (decisions 180–219).

- [Choose a way](#choose-a-way)
- [Hosted connector (Claude on the web, phone and desktop)](#hosted-connector)
- [Local server (chat apps and agents on your computer)](#local-server)
  - [Get the server](#get-the-server) · [Options](#server-options) · [Claude Desktop](#claude-desktop) · [VS Code](#vs-code-github-copilot) · [Claude Code](#claude-code) · [opencode](#opencode) · [Goose](#goose) · [Continue](#continue) · [DeepSeek Harness](#deepseek-harness-dsh) · [Other clients](#other-clients)
- [Skills (optional)](#skills)
- [Using it](#using-it)
- [Your Loom folder](#your-loom-folder)
- [Loom Viewer](#loom-viewer)
- [Troubleshooting](#troubleshooting)
- [For developers](#for-developers)

## Choose a way

| Way | For | Shows the player in the chat | Needs |
|---|---|---|---|
| **Hosted connector** | Claude on the web, phone and desktop; other chats that add MCP servers by URL | Yes, where the chat supports MCP Apps | Nothing to install |
| **Local server** | Claude Desktop, VS Code, Claude Code, opencode, Goose, Continue, DeepSeek Harness, … | Where the client supports MCP Apps (Claude Desktop, VS Code, Goose; dsh with an MCP Apps plugin) | Node.js and one file |
| **Skills only** | Any chat without MCP (the Claude app, ChatGPT, coding agents) | No: topics open in Loom Viewer | Upload or install a skill |
| **Loom Viewer only** | Opening a topic someone sent you, or your Loom folder | — | A browser |

The two servers offer the same core tools. The local server adds the full topic check, edits by changed lines, and reading your synced Loom folder directly:

| Tool | Hosted | Local | What it does |
|---|---|---|---|
| `read_reference` | ✓ | ✓ | Start at index.md, then follow relevant workflow, capability, component, tutoring or storage links |
| `get_topic_context` | ✓ | ✓ | Progressively inspect explicitly supplied current source files |
| `validate_topic_plan` | ✓ | ✓ | Validate page compositions and objective/evidence references |
| `show_topic` | ✓ | ✓ | Shows a topic in the chat (or answers with a Viewer link) |
| `show_library` / `show_domain` | ✓ | ✓ | Your domains, or one domain with what is done and up next |
| `validate_topic` | | ✓ | Checks a topic before it is shown |
| `edit_topic` | | ✓ | Changes a shown topic by sending only the changed statements |
| `list_topics` / `open_topic` / `learner_summary` | | ✓ | Topics and progress kept in the memory folder |

<a id="hosted-connector"></a>
## Hosted connector (Claude on the web, phone and desktop)

The hosted server runs on Cloudflare Workers and stores nothing.

1. In Claude, open **Settings → Connectors → Add custom connector**.
2. Enter `https://loom-mcp.loom-learning.workers.dev/mcp` and save. It appears as your Loom connector.
3. In a chat, turn the connector on from the tools menu (**+** or the sliders icon).
4. To keep topics and progress, also turn on **Google Drive** (or OneDrive) in the same menu. Claude saves them to the `Loom/` folder in your drive.

Start a **new chat** after the server is updated: a chat keeps the tool list it started with.

Other chats that add an MCP server by URL (ChatGPT's developer mode, Microsoft 365 Copilot, Mistral Le Chat, Cursor, …) use the same address. Only chats that support MCP Apps show the player; the others get a link that opens the topic in Loom Viewer.

<a id="local-server"></a>
## Local server (chat apps and agents on your computer)

The local server runs on your computer. Point its memory folder at the `Loom` folder that Google Drive for desktop (or OneDrive, Dropbox) syncs, and it reads and writes the same domains, topics and progress as Claude on your phone.

<a id="get-the-server"></a>
### Get the server

You need **Node.js 20 or newer** (DeepSeek Harness itself needs `^22.19.0` or `>=24.0.0`).

**Download (recommended).** Every deploy of the hosted server also publishes the local server as one file:

Windows (PowerShell):

```powershell
# Node.js (skipped if already installed)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements }

New-Item -ItemType Directory -Force C:\loom | Out-Null
Invoke-WebRequest https://loom-mcp.loom-learning.workers.dev/loom-mcp.mjs -OutFile C:\loom\loom-mcp.mjs
```

macOS and Linux:

```bash
mkdir -p ~/loom
curl -fsSL https://loom-mcp.loom-learning.workers.dev/loom-mcp.mjs -o ~/loom/loom-mcp.mjs
```

Run the same command again to update.

**Build from source** (to change Loom, or to pin a version):

```bash
git clone https://github.com/ChanatipSaetia/interactive-loom-learning-os.git
cd interactive-loom-learning-os
npm ci
npm run build:mcp          # writes dist-mcp/loom-mcp.mjs
```

**Check it runs** (Ctrl+C to stop):

```bash
node ~/loom/loom-mcp.mjs --http 3001 --memory "/path/to/My Drive/Loom"
# Loom MCP server on http://localhost:3001/mcp
```

Chat apps start it themselves with `--stdio`, as in the configurations below.

<a id="server-options"></a>
### Options

| Option | Meaning |
|---|---|
| `--stdio` | Talk to the chat app over stdin/stdout (what chat apps use) |
| `--http [port]` | Streamable HTTP on localhost (default 3001), for testing and for tunnels |
| `--memory <folder>` | Where topics and progress are kept; point it at your synced `Loom` folder. Default `~/.loom` (or `LOOM_MEMORY_DIR`) |
| `--no-memory` | Keep nothing |
| `LOOM_APP_URL` (environment) | Optional hosted-player override. By default the local server embeds its matching player CSS and JavaScript and uses system fonts, without fetching player assets from Cloudflare or Google Fonts. |

Memory folder paths:

- **Windows:** Google Drive for desktop is usually `G:\My Drive\Loom`. In YAML write it as `G:/My Drive/Loom` or `'G:\My Drive\Loom'`, never in double quotes (YAML reads `\M` as an escape).
- **macOS:** `~/Library/CloudStorage/GoogleDrive-<you>@gmail.com/My Drive/Loom` (or the path Finder shows).
- With Drive set to **Stream files**, the first read downloads the files, so the first library can take a moment; **Mirror files** is faster.

The examples below use `C:/loom/loom-mcp.mjs` and `G:/My Drive/Loom`; change both to yours (on macOS and Linux, for example `/Users/you/loom/loom-mcp.mjs`).

<a id="claude-desktop"></a>
### Claude Desktop

**Settings → Developer → Edit Config** (`claude_desktop_config.json`), then quit and reopen Claude:

```json
{
  "mcpServers": {
    "loom": {
      "command": "node",
      "args": ["C:/loom/loom-mcp.mjs", "--stdio", "--memory", "G:/My Drive/Loom"]
    }
  }
}
```

<a id="vs-code-github-copilot"></a>
### VS Code (GitHub Copilot)

`.vscode/mcp.json` in a folder, or **MCP: Add Server** for your user settings:

```json
{
  "servers": {
    "loom": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/loom/loom-mcp.mjs", "--stdio", "--memory", "G:/My Drive/Loom"]
    }
  }
}
```

<a id="claude-code"></a>
### Claude Code

```bash
claude mcp add loom -- node C:/loom/loom-mcp.mjs --stdio --memory "G:/My Drive/Loom"
```

Claude Code runs in a terminal, so `show_topic` answers with a link that opens the topic in Loom Viewer.

<a id="opencode"></a>
### opencode

`opencode.json`:

```json
{
  "mcp": {
    "loom": {
      "type": "local",
      "command": ["node", "C:/loom/loom-mcp.mjs", "--stdio", "--memory", "G:/My Drive/Loom"],
      "enabled": true
    }
  }
}
```

<a id="goose"></a>
### Goose

`~/.config/goose/config.yaml` (Windows: `%APPDATA%\Block\goose\config\config.yaml`), or `goose configure` → Add Extension → Command-line Extension. Goose shows the player in the chat.

```yaml
extensions:
  loom:
    enabled: true
    type: stdio
    name: loom
    cmd: node
    args:
      - C:/loom/loom-mcp.mjs
      - --stdio
      - --memory
      - G:/My Drive/Loom
    timeout: 300
```

<a id="continue"></a>
### Continue

`~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: Loom
    command: node
    args:
      - C:/loom/loom-mcp.mjs
      - --stdio
      - --memory
      - G:/My Drive/Loom
```

<a id="deepseek-harness-dsh"></a>
### DeepSeek Harness (dsh)

dsh adds MCP servers as `insert` entries in a profile's patch file (`~/.dsh/profiles/<name>/cordis.patch.yml`, or `~/.dsh/cordis.patch.yml` for every profile). It watches the file, so saving connects the server. Use **one** of the two entries below, not both, or every Loom tool appears twice.

**With an MCP Apps plugin (shows the player in dsh).** Install an MCP Apps plugin first, for example `npx @deepseek-ai/dsh plugin --profile web add @sugarforever/dsh-mcp-apps`, then:

```yaml
- insert:
    - id: mcp-apps-loom
      name: '@sugarforever/dsh-mcp-apps'
      config:
        serverName: loom
        transport: stdio
        command: node
        args: ['C:/loom/loom-mcp.mjs', '--stdio', '--memory', 'G:/My Drive/Loom']
        failOnStartupError: true
```

- `failOnStartupError: true` shows an error when Loom cannot start, instead of failing silently (for example when `config` is indented one level too shallow, which leaves it empty).
- Leave out `toolCallTimeoutMs`: it belongs to `@deepseek-ai/dsh-mcp-client`, and this plugin's README does not list it. Loom's tools answer in a second or two.
- If `plugin add` fails with *"declares no dsh.bundle"*, the published plugin and your dsh version do not match. Try installing it from GitHub (`… add github:sugarforever/dsh-mcp-apps`), or another MCP Apps plugin for dsh (openma-ai, katticot, eziyuhz); with another plugin, change `name` to its package and check its README for the config keys.

**With dsh's own MCP client (no player; topics open in Loom Viewer):**

```yaml
- insert:
    - id: mcp-loom
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: loom
        transport: stdio
        command: node
        args:
          - C:/loom/loom-mcp.mjs
          - --stdio
          - --memory
          - G:/My Drive/Loom
        toolCallTimeoutMs: 120000
        failOnStartupError: true
```

The tools appear as `mcp__loom__show_topic`, `mcp__loom__read_reference` and so on.

A small local model can find writing a whole topic hard. The local server helps: `validate_topic` names each error and `edit_topic` fixes it a few lines at a time. If topics keep failing, raise the model's reasoning effort, or write topics with a stronger model and tutor with the local one.

<a id="other-clients"></a>
### Other clients

Any MCP client that starts a stdio server takes the same three things:

- **Command:** `node`
- **Arguments:** `C:/loom/loom-mcp.mjs --stdio --memory "G:/My Drive/Loom"`
- **Environment (optional):** `LOOM_APP_URL=…` to load the player from elsewhere

Clients that only connect by URL can reach a local server through `--http 3001` and a tunnel (Cloudflare Tunnel, ngrok), working while the computer is on.

<a id="skills"></a>
## Skills (optional)

With the connector, you need no skill: the server tells every chat to start at `read_reference({path:"index.md"})` and follow intent-specific references. Skills help chats without the server, or chats that should follow the routine without being told.

| Skill | For |
|---|---|
| `loom-topic-writer` | Writing, extending and fixing topics (authors, coding agents) |
| `loom-tutor-app` | Tutoring with the Loom MCP App: short topics, progress in your drive, your library |
| `loom-tutor-viewer` | Tutoring in any chat: the chat writes each topic as one file for Loom Viewer |

- **Claude app:** download the zip from the **Create with AI** page (`/create.html` on the Loom site), then **Settings → Capabilities (or Customize) → Skills → Upload skill**. Code execution must be on. Upload again to update.
- **Coding agents** (Claude Code, opencode, Codex, Cursor, …):

  ```bash
  npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-tutor-app -g
  npx skills update -g
  ```

- **ChatGPT, Microsoft 365 Copilot and others:** attach the skill's reference files as accessible knowledge as well as its entry point; `loom-topic-writer/SKILL.md` routes to focused references rather than containing the whole specification. Then paste the skill's `SKILL.md` (served at `/llm/skills/<name>/SKILL.md`) as the instructions of a custom GPT, project or agent.

## Using it

Mention Loom in your message so the chat picks the right tools:

| You say | What happens |
|---|---|
| "Teach me the four Chinese tones with Loom." | A **short topic** on one idea (1–3 sections), shown as a card |
| "Give me a full Loom lesson on HTTP caching." | A full lesson: intro, several sections, a closing quiz |
| "Where am I in Chinese?" | `show_domain`: topics in order with what is done, in progress or to review, and the topic up next |
| "Show my Loom library." | `show_library`: one card per domain |
| "What should I learn next in Chinese?" | The chat plans from that domain's progress and shows the next topic |
| "Make question 2 easier." | The chat changes only that part (`edit_topic` on the local server) |

In the player:

- **▶ Play** presents the topic beat by beat with narration and captions; **Read** shows it to work through. **Full screen** gives it the whole window.
- **Theme** changes the look for the session (Liquid Glass follows the chat's light or dark mode).
- **Save my progress** hands the chat today's progress note to save to your drive; approve the save in the chat.
- **Ask** (in Present) opens Read with **Pick** on: point at parts of the topic, type a question, and **Send** posts it into the chat with what you pointed at.
- **Viewer** opens the topic in Loom Viewer; if the chat does not open the link, it stays under the bar with **Copy link**.
- On a domain page, **Open** plays a topic and **Next topic** asks the chat to plan the next one.

Narration uses the browser's voice. It works in desktop browsers and iOS; Android's in-app web views have no speech, so there the captions show and **Open in Viewer** (in Chrome) speaks.

## Your Loom folder

Topics and progress live in `Loom/` at the top of your drive (My Drive, not a shared drive), one folder per domain:

```
Loom/
  index.oui                              Library([DomainRef("chinese"), …])
  <domain-id>/
    domain.oui                           Domain(title, description, [TopicRef(…)], goal)
    topics/<topic-id>.loom.oui
    progress/<topic-id>-YYYY-MM-DD.md
```

The chat follows the rules in `read_reference({path:"storage/index.md"})` (the same text is in [storage-guide.ts](../src/core/learning-engine/composition/oui/storage-guide.ts)): after showing a topic in an established domain, it saves the exact topic to Drive and updates `domain.oui` unless you opted out. Local MCP memory alone does not count as a Drive save. It confirms new domains, replaces rather than duplicates, saves plain text, and reports when a connector cannot write. Topics and notes saved before domains existed (flat `Loom/topics/` and `Loom/progress/`) are moved into domains once you agree: ask *"Reorganise my Loom folder into domains following the storage references."*

## Loom Viewer

Loom Viewer (`/viewer.html` on the Loom site) opens topics without any chat:

- **Open file** or **Paste text**: a `.loom.oui` topic, a single section, or a `.zip` from Loom Studio. A link from the chat opens straight into Present.

**Keep the exact lesson:** the MCP player has **Download lesson** on its card and in expanded Read/Present navigation. Supporting chat hosts download `<topic-id>.loom.oui` through the MCP Apps file API. The file contains the exact source supplied to the player, including narration and domain markers. If the host lacks downloads or denies a request, use **Copy lesson source** and save it as a plain-text `.loom.oui` file. The host may ask you to confirm a download; the app reports a request, not a confirmed Drive save.

To show it again, attach that file and ask the assistant to read it and pass its complete source unchanged to `show_topic`, or open it directly in Loom Viewer. The hosted Worker stores no topics. If the original file is unavailable, the assistant should ask for it instead of recreating the lesson from its title or summary. A chat without MCP Apps can provide the exact source using its own file-attachment feature; attachment reading and writing depend on that client.
- **Open folder**: a topic folder, or your **`Loom` folder** (Google Drive for desktop on Chrome or Edge) for the library and domain pages, with status, Up next and **Copy request for your AI chat**. A topic opened from a domain gets **Save progress**, which writes the note into the folder.
- **Read / Present**: use the header controls on wide screens, or open **… → Read / Present** on compact screens. Long domain breadcrumbs use an ellipsis while retaining the full name in their tooltip and accessible label.
- **Copy progress** copies today's note to paste into your chat; **Back up** and **Restore** keep this browser's learning record.

## Troubleshooting

| Problem | Fix |
|---|---|
| The chat answers in text instead of showing a card | Mention Loom ("show it with Loom"); check the connector is on for this chat |
| New tools (such as `show_domain`) are missing | Start a new chat, or turn the connector off and on |
| No player, only a link | The chat does not support MCP Apps: open the link in Loom Viewer |
| The player stays blank | Remove `LOOM_APP_URL` to use the local server's bundled player, or the hosted endpoint's default assets. Rebuild or download the local server again if its embedded player is outdated. |
| "Where am I in …" finds nothing | Your folder is still in the old flat layout: ask the chat to reorganise it into domains |
| No narration | On iPhone, check the silent switch and press Play (speech starts from the tap); on Android, use Open in Viewer in Chrome |
| Moving through Read | Scroll through the full topic. Read stays inline until you choose Full screen. |
| dsh: *"declares no dsh.bundle"* | See [DeepSeek Harness](#deepseek-harness-dsh) |
| YAML path errors on Windows | Write `G:/My Drive/Loom`, not `"G:\My Drive\Loom"` |
| `node` not found after installing it | Open a new terminal window |

## For developers

| Command | What it does |
|---|---|
| `npm run build:mcp` | Builds the local server (`dist-mcp/loom-mcp.mjs`) and the app |
| `npm run mcp:host` | A minimal MCP Apps host on localhost (http://localhost:8090/), with the local server and the app; `?library=1`, `?domain=chinese`, `?topic=<id>`, `?server=<url>` |
| `npm run mcp:check` | Drives the test host in Chromium and saves screenshots |
| `npm run build:worker` | Builds the site at `/`, the Worker and the downloadable `loom-mcp.mjs` |
| `npm run worker:dev` | Runs the Worker locally (Wrangler, port 8787) |

The whole site and hosted server deploy together to Cloudflare Workers on pushes to `master`, or manually through `.github/workflows/deploy-mcp-worker.yml`. The workflow uses the `cloudflare` GitHub environment and its `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. Allow `master` in that environment's deployment branch rules. For deployment without a manual approval, configure the environment without required reviewers; repository files cannot change those settings. The deployment summary links to the site root and `/mcp`. GitHub Pages deployment is retired. Code: `src/mcp/` (server, Worker, memory folder), `src/mcp-app/` (the app), `src/viewer/library.ts` and `LibraryView.tsx` (library and domain pages). After changing a component, the authoring prompt or a skill, run `npm run oui:schema`.


Reading mode in the MCP app displays the whole topic in a continuous scrolling view. Full screen is optional on phones and desktops; returning to inline keeps the topic open.

Reading scroll gestures stay inside the MCP app, including at the top and bottom of the topic; gestures outside its frame can scroll the surrounding chat normally. Diagrams and form controls retain their own gestures.

The serverless AI workflow additions, conditional storage/validation APIs and compatibility boundaries are documented in [AI workflow contracts](ai-experience/workflows.md). Run `npm run evaluate:offline` for deterministic, synthetic context/validation/progress/handoff checks; see [evaluation methodology](ai-experience/evaluation.md) for measurements and external-model limitations.

The hosted endpoint exposes exactly six tools: `read_reference`, `get_topic_context`, `validate_topic_plan`, `show_topic`, `show_library`, and `show_domain`. The four former guide/catalog tools have been removed; reconnect clients to refresh their tool lists. MCP resources and `read_reference` serve the same linked reference tree. Local compiler, editing and learner-storage tools remain conditional.
