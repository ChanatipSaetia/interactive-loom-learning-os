# Interactive Loom Learning OS

Interactive lessons from plain text. A Loom **topic** is a small folder of [OpenUI Lang](https://openui.com/docs/openui-lang) (`.oui`) files: animated flowcharts, trade-off sandboxes, scenarios, flashcards, quizzes, charts and drawings, each with a narration script. Loom plays a topic as a narrated, hands-free presentation (**Present**) or as a page to work through (**Read**), in the browser or right inside an AI chat.

Built with React, Vite, TailwindCSS, anime.js and Motion. Defaults to the Liquid Glass theme, dark or light to follow the system, over the Catppuccin Frappé palette.

---

## What's here

| | What it is | Where |
|---|---|---|
| **Loom in your AI chat** | An MCP server and MCP App: your chat writes a topic, checks it and plays it in the conversation, keeps topics and progress in your own drive, and shows your library and what is up next | [docs/mcp-setup.md](docs/mcp-setup.md) |
| **Loom Viewer** | Opens a `.loom.oui` topic, a `.zip`, pasted text, a topic folder, or your `Loom` folder (library and domain pages), read-only, with Present and an AI tutor | `viewer.html` |
| **Loom Studio** | Edits a topic folder with code, a visual form and a live preview, plus Pick and an AI assistant that proposes edits | `studio.html` (`npm run studio`) |
| **Create with AI** | Adds the Loom skills to the Claude app or to coding agents, step by step | `create.html` |
| **The learning app** | The catalog of topics in this repository, and hex campaign maps | `index.html` |

The site is published at **https://loom-mcp.loom-learning.workers.dev/** (from the working branch, with the MCP endpoint at `/mcp`) and **https://chanatipsaetia.github.io/interactive-loom-learning-os/** (from `master`).

---

## Quick start

**Learn in your AI chat (nothing to install).** In Claude, open **Settings → Connectors → Add custom connector**, enter `https://loom-mcp.loom-learning.workers.dev/mcp`, turn it on in a chat (with Google Drive to keep your progress), and ask *"Teach me something short about HTTP caching with Loom."*

**Use it from a chat app or agent on your computer.** Install Node.js, download the local server and add it to your client:

```bash
curl -fsSL https://loom-mcp.loom-learning.workers.dev/loom-mcp.mjs -o ~/loom/loom-mcp.mjs --create-dirs
# then in your client: node ~/loom/loom-mcp.mjs --stdio --memory "/path/to/My Drive/Loom"
```

Ready-to-paste settings for Claude Desktop, VS Code, Claude Code, opencode, Goose, Continue and DeepSeek Harness (dsh), Windows PowerShell commands, skills, and how to use every feature are in **[docs/mcp-setup.md](docs/mcp-setup.md)**.

**Write topics with any chat, no MCP.** Add the `loom-topic-writer` skill (Create with AI page, or `npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-topic-writer -g`), ask for a topic, and open the `.loom.oui` it gives you in Loom Viewer.

**Run the repository.**

```bash
npm ci
npm run dev          # the learning app at http://localhost:5173 (also /viewer.html, /studio.html, /create.html)
```

---

## Topics

Topics live in `public/content/<topic-id>/`:

```
public/content/http-caching/
  topic.oui                   root = Topic(title, category, description, [SectionRef("intro"), …])
  sections/
    intro.oui                 root = Intro(...)            one section per file
    directives.oui            root = TaxonomyBrowser(...)
    directives.narrate.oui    root = Narration(...)        what the narrator says in Present
    quiz.oui                  root = Quiz(...)
```

A whole topic can also be one `.loom.oui` file (a `// @loom-topic <id>` line, then each file after a `// === <path> ===` marker), which is what AI chats write and Studio exports. The full specification, with every component and its props, is the authoring prompt: [public/llm/loom-authoring-prompt.md](public/llm/loom-authoring-prompt.md) (also served at `/llm/loom-authoring-prompt.md`, with a JSON Schema and `llms.txt`); the `loom-topic-writer` skill in `.claude/skills/` carries it for AI agents working in this repository. Check topics with `npx vitest run tests/unit/content`.

### Section types

| Type | Component | What it is |
|---|---|---|
| `intro` | `Intro` | Topic opener: what it is, why it matters, a roadmap |
| `text` | `Text` | Paragraphs with inline markdown |
| `bullets` | `Bullets` | Bulleted or numbered checklist |
| `taxonomy-browser` | `TaxonomyBrowser` | Categories with scope, analogy and details |
| `image-gallery` | `ImageGallery` | Captioned images |
| `pillar-layer` | `PillarLayer` | Layer-stack map with dependencies |
| `flowchart` | `Flowchart` | Event Storming flowchart with architecture, swimlane, sequence, data-flow and state-machine views and guided journeys |
| `scenario` | `Scenario` | Branching "what would you do?" story |
| `tradeoff-sandbox` | `TradeoffSandbox` | Design choices that move metrics |
| `formula-sandbox` | `FormulaSandbox` | Sliders driving live formulas |
| `decision-tree` | `DecisionTree` | Questions leading to a recommendation |
| `reflection-sequence` | `ReflectionSequence` | Put steps in the right order |
| `reflection-template` | `ReflectionTemplate` | Complete sentences with chips |
| `quiz` | `Quiz` | Multiple-choice questions with hints and explanations |
| `flashcards` | `Flashcards` | Flip cards for key vocabulary |
| `concept-map` | `ConceptMap` | Graph of concepts and relations |
| `openui` | `// @openui` | Free layout from the standard OpenUI library: cards, tabs, tables, charts and `Svg` drawings |

Section design intent and recommended order: [docs/sections-reference.md](docs/sections-reference.md).

---

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Dev server for every page |
| `npm run studio` | Dev server opening Loom Studio |
| `npm run build` | Production build of the site and the MCP App |
| `npm run test` / `npm run typecheck` / `npm run lint` | Unit tests (Vitest), type check, lint |
| `npm run oui:schema` | Regenerates the authoring prompt, JSON Schema, `llms.txt` and the skills after a component or prompt change |
| `npm run openui:gen` | Regenerates Loom's additions to the standard OpenUI library |
| `npm run hexmap:validate` / `npm run hexmap:schema` | Checks hex campaign maps; regenerates their YAML schema |
| `npm run build:mcp` | Builds the local MCP server (`dist-mcp/loom-mcp.mjs`) |
| `npm run mcp:host` / `npm run mcp:check` | MCP Apps test host on localhost, and its browser checks |
| `npm run build:worker` / `npm run worker:dev` | Builds the hosted endpoint (site, Worker, downloadable server); runs it locally |

## Project structure

```
src/
  core/                     learning engine, section sub-contexts, OUI compiler, validation, UI system
    learning-engine/        sections by subdomain, OUI composition (prompts, skills, storage guide)
    supporting/             authoring editor (Pick, AI assistant), presentation (Present), learner progress
  viewer/                   Loom Viewer, with the library and domain pages (library.ts, LibraryView.tsx)
  studio/                   Loom Studio
  create/                   Create with AI page
  mcp/                      MCP server: server.ts, cli.ts (local), worker.ts (Cloudflare), memory-folder.ts
  mcp-app/                  The Loom MCP App shown inside chats
public/
  content/                  topics (OUI)
  llm/                      authoring prompt, JSON Schema, skills and their zips
  hexmaps/                  hex campaign maps
docs/                       guides (setup, topics, sections, hexmaps, architecture)
tests/
  unit/                     Vitest
  mcp-host/                 MCP Apps test host
```

## Docs and design logs

- [docs/mcp-setup.md](docs/mcp-setup.md): Loom in your AI chat, every way to install and use it
- [public/llm/loom-authoring-prompt.md](public/llm/loom-authoring-prompt.md): the topic format, every component and the authoring rules
- [docs/sections-reference.md](docs/sections-reference.md), [docs/event-storming-conventions.md](docs/event-storming-conventions.md): section design and flowchart conventions
- [docs/creating-topics.md](docs/creating-topics.md): the older OKF (YAML/Markdown) topic format in `public/okf/`
- [docs/creating-hexmaps.md](docs/creating-hexmaps.md): hex campaign maps
- [docs/agents/domain.md](docs/agents/domain.md) and [AGENTS.md](AGENTS.md): architecture and guidance for AI agents working here
- Design logs: [adaptive learning and the MCP App](grill-log-adaptive-learning.md), [Present mode](grill-log-presenting-mode.md), [AI assistant](grill-log-ai-assistant.md), [Pick and comment](grill-log-pick-and-comment.md), [OpenUI input](grill-log-openui-input.md), [learner memory](grill-log-learner-memory-review.md)

The standalone CDN library (`loom-learning-sections`, [docs/cdn-library.md](docs/cdn-library.md)) renders only the older OKF format and is deprecated (decision 194 in the adaptive-learning log); new work uses OUI topics and Loom Viewer.

## License

MIT
