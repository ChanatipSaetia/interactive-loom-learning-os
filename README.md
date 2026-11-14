# Interactive Loom Learning OS

Loom turns a learning goal into an interactive topic: an ordered set of pages
that combine explanations, diagrams, examples and activities. Learn in **Read**
mode at your own pace, or watch a narrated, hands-free **Present** mode in the
browser or an AI chat that supports MCP Apps.

Topics are plain-text [OpenUI Lang](https://openui.com/docs/openui-lang) (`.oui`)
files. Each page is a compositional learning unit built from one component
catalog. Text, tables, charts, controls and prebuilt learning activities are peer
choices, selected by what helps the learner understand or do something.

**[Open Loom](https://loom-mcp.loom-learning.workers.dev/)** ·
**[Viewer](https://loom-mcp.loom-learning.workers.dev/viewer.html)** ·
**[Studio](https://loom-mcp.loom-learning.workers.dev/studio.html)** ·
**[Create with AI](https://loom-mcp.loom-learning.workers.dev/create.html)**

## Start learning or authoring

### Connect an AI chat

Add this hosted MCP endpoint to a compatible client:

```text
https://loom-mcp.loom-learning.workers.dev/mcp
```

Then ask, for example:

> Create a Loom topic about how to use Svelte and how it compares with React.

Clients with MCP Apps can show the player inside the conversation. Other clients
can open the result in Loom Viewer. The Cloudflare Worker is stateless: showing a
topic does not save it. Topics and progress can be saved separately through an
authorized drive connector or a local synced folder.

See [MCP setup](docs/mcp-setup.md) for client configurations, local-server options,
storage and troubleshooting. Start a new chat after a server update to refresh
cached tool metadata.

### Use a writer skill

For coding agents:

```bash
npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-topic-writer -g
```

For clients that accept uploaded skills, download the
[writer skill ZIP](https://loom-mcp.loom-learning.workers.dev/llm/skills/loom-topic-writer.zip).
The [Create with AI page](https://loom-mcp.loom-learning.workers.dev/create.html)
explains installation. Open the resulting topic in Viewer or import it into Studio.

### Run locally

Use Node.js 22 LTS, matching the deployment workflow:

```bash
npm ci
npm run dev
```

Open `http://localhost:5173` for the learning app, `/viewer.html` to read a topic,
`/studio.html` to author one, or `/create.html` for skill installation.

To build and run the local MCP server:

```bash
npm run build:mcp
node dist-mcp/loom-mcp.mjs --stdio --memory "/path/to/My Drive/Loom"
```

Configure your MCP client to launch that command. The local server embeds its
player assets; external topic images and the optional hosted Viewer link may
still need network access. It adds compiler validation, editing and learner-memory
capabilities to the hosted tools. See [setup instructions](docs/mcp-setup.md) for
HTTP mode and the downloadable standalone server.

## The learning experience

| Surface | Purpose |
|---|---|
| **Learning app** | Browse repository topics and hex campaign maps. |
| **Viewer** | Open a `.loom.oui`, ZIP, pasted source, topic folder or Loom library; learn in Read or Present with an AI tutor. |
| **Studio** | Edit a topic with source, visual forms, live preview, Pick annotations and an AI assistant that proposes reviewable edits. |
| **MCP App** | Play a topic and browse a supplied library inside a compatible chat. |

Read supports inspection and authored learner interaction. Present guides the
same content through automatic scenes and narration, using separate demonstration
state. Demonstrated quiz answers, card flips and slider movements do not establish
learner mastery. Evidence comes from meaningful responses interpreted against the
authored learning task.

## Choose components by learning purpose

Every focused component reference explains what it can **introduce**, what a
learner can **explore**, what responses provide **evidence**, and its **limits**.
Prebuilt activities package useful behavior; no component mix or lesson sequence
is mandatory.

| Learning purpose | Candidates and guidance |
|---|---|
| Explain and orient | `TextContent`, code, cards and `Intro` develop connected explanations and examples. |
| Compare and evaluate | `Table` gives a compact overview; `TradeoffSandbox` explains alternatives, shared criteria, strengths and consequences. Context, scores and recommendations are optional. |
| Teach a procedure | `Steps`, `Bullets` and `Flowchart` support instructions, checklists and meaningful step connections. `ReflectionSequence` can practise a taught order. |
| Organize kinds and relationships | `TaxonomyBrowser` introduces categories and distinctions; `ConceptMap` explains labelled connections; `PillarLayer` explains foundations and dependencies. |
| Introduce or recall concepts | `Flashcards` teaches one focused concept per card, including on first encounter. Examples and dialogue can clarify meaning. |
| Explain experience and timing | `UserJourney` follows a person's goals and responses; `Timeline` shows measured duration, overlap and waiting. |
| Explore models and choices | `FormulaSandbox` explores authored formulas, `DecisionTree` explains explicit rules, and `Scenario` teaches through decisions and consequences. |
| Interpret quantitative information | Charts show amounts, trends, shares or associations; `BreakdownTree` explains measurable parts or conditional probabilities. |
| Explain visually | Images and galleries teach recognition and concrete examples; `Svg` explains spatial structure, anatomy, mechanisms or labelled analogies. |
| Apply and explain | `Quiz` offers grounded questions and answer-specific feedback; `ReflectionTemplate` scaffolds reasoning with supplied concepts. |
| Compose an exploration | Layouts organize the activity; controls connect page-local inputs to meaningful authored outputs and feedback. |

### Charts and SVG

Choose a chart for the relationship it exposes: bars for amounts, lines or areas
for meaningful ordered measurements, shares for a defensible whole, scatter plots
for associations, and radar charts for comparable criteria. Preserve units, scales
and data provenance. Use supplied or verified data, or clearly label illustrative
values; do not invent benchmarks. An association does not establish causation.

Use labelled SVG when positions, parts or geometry help explain the subject.
Keep labels and contrast readable, explain schematic or not-to-scale proportions,
and use supported shape IDs for narration highlights. A drawing or code block
does not execute the system it depicts. Inspect dense charts, tables and figures
in narrow and desktop layouts and in both Read and Present.

Start with [page and selection guidance](docs/sections/page.md). Installed writer
skills provide a [purpose index](.claude/skills/loom-topic-writer/references/planning/component-purposes.md)
and [per-component contracts](.claude/skills/loom-topic-writer/references/components/).
MCP serves the same guidance through linked references, one relevant file at a time.

### Images inside an MCP chat

A reachable HTTPS URL can still be blocked by the chat host's resource policy.
Before adding an image, read `contracts/images.md` and `runtime.md` through
`read_reference`; the latter reports the configured `deployment.imagePolicy`.
The default hosted app does not declare arbitrary image CDNs. The bundled local
player declares `data:` resources and no remote origins. Loom does not upload
image attachments or create public image URLs. Verify the source in the target
chat, including Read and Present; Viewer loading alone is not that check.

See [image delivery constraints](docs/ai-experience/mcp-images.md) for source
selection, inline-data size, SVG alternatives and failure handling.

### Reference links for learners

Include useful, clearly labelled links to official documentation, original sources,
image credits or further reading beside the relevant explanation. Explain what the
learner can find there and keep the core lesson self-contained. Use supplied or
checked URLs; internal plan evidence references do not automatically appear in the
page. For images, distinguish the renderable image URL from its source/detail page.
Read `contracts/learner-references.md` through MCP or the writer skill's
`references/core/learner-references.md` for authoring and host-navigation guidance.

## Author a topic

A topic folder contains a manifest, Page-root content files and optional narration
files. The AI workflow authors narration for each page when creating a narrated topic.

```text
public/content/<topic-id>/
  topic.oui
  sections/
    overview.oui
    overview.narrate.oui
    comparison.oui
    comparison.narrate.oui
```

A complete minimal portable topic looks like this:

```oui
// @loom-topic greeting
// === topic.oui ===
root = Topic("A greeting", "Language", "Read one greeting.", [SectionRef("hello")])
// === sections/hello.oui ===
root = Page("Hello", TextContent("Hello is a greeting."))
// === sections/hello.narrate.oui ===
root = Narration([NarrationStep("p1", "Read the greeting.")])
```

Save the bundle as `greeting.loom.oui`, or save each virtual file separately in a
topic folder. Every file has one named root: `Topic` for the manifest, `Page` for
content, and `Narration` for its script. Each page composes one main learning
activity with supporting components. Internal presentation beats stay within that
page; authors do not select a section type or a separate component library.

For exact syntax, signatures, narration and migration, read the
[Page contract](docs/sections/page.md) and the focused component references.
`LessonText` is retired; prose uses `TextContent`. Convert older exports explicitly:

```bash
npm run oui:migrate -- path/to/topic
npm run oui:migrate -- --write path/to/topic
```

The first command reports needed changes; the second writes them. Review migration
diagnostics, particularly nested retired wrappers and narration targets.

## Progressive MCP workflow

The hosted server exposes seven tools:

| Tool | Purpose |
|---|---|
| `recommend_components` | Compare bounded representation candidates by knowledge structure, learner action and constraints. |
| `read_reference` | Read the entry point, then relevant workflow, capability, component, tutoring or storage references. |
| `get_topic_context` | Inspect explicitly supplied current files, narrowing to relevant statements and dependencies. |
| `validate_topic_plan` | Check the plan's components, objectives and evidence references; report readiness advisories. |
| `show_topic` | Review a new topic against its plan and present accepted source for player compilation. |
| `show_library` | Show the learner's library from authorized source files. |
| `show_domain` | Show one domain and its topics from authorized source files. |

Start with `read_reference({"path":"index.md"})`, or read the MCP resource
`loom://references/index.md`. Follow relevant links through eight stages:
**understand → discover → plan → validate-plan → references → generate → verify → deliver**.
Read plausible alternatives before planning, then fetch exact contracts for the
selected components. Small edits can read and validate only the affected source.

New topics use `show_topic({oui, plan})`. Reachable source components must match the
plan, required review fields must be supplied, and advisory warnings must be
resolved or specifically justified where permitted. Reopening existing source uses
`intent: "reopen"`. Hosted source review is not compiler, layout or teaching-quality
verification: the player compiles the topic, and visual inspection remains a separate
check. Showing a topic and saving it are separate actions.

## Development

Built with TypeScript, React, Vite, TailwindCSS, anime.js, Motion and OpenUI.

| Command | Purpose |
|---|---|
| `npm run dev` / `npm run studio` | Start the site or open Studio in development. |
| `npm run typecheck` / `npm run test` / `npm run lint` | Type checking, unit tests and lint. |
| `npm run evaluate:offline` | Synthetic workflow and retrieval-budget evaluations; these do not measure external-model teaching quality. |
| `npm run build` | Build the site and MCP App. |
| `npm run build:mcp` | Build the player and standalone local MCP server. |
| `npm run build:worker` / `npm run worker:dev` | Build the hosted site, Worker and downloadable local server; run the Worker locally. |
| `npm run check:worker` | Smoke-test the built MCP endpoint in real local Cloudflare workerd. |
| `npm run oui:schema` | Regenerate canonical prompts, schemas, component references and packaged skills. |
| `npm run openui:gen` | Refresh the shared library's upstream contract snapshot and Loom extensions. |
| `npm run hexmap:validate` / `npm run hexmap:schema` | Validate campaign maps and regenerate their schema. |
| `npm run mcp:host` / `npm run mcp:check` | Run the local MCP Apps host and browser checks. |

The [deployment workflow](.github/workflows/deploy-mcp-worker.yml) builds and deploys
pushes to `master` using the configured Cloudflare environment. It serves the site,
`/mcp`, player assets and downloadable `loom-mcp.mjs` together.

```text
src/core/learning-engine/    learning components, OUI composition, compiler and validation
src/core/supporting/         authoring editor, presentation and learner progress
src/core/ui-system/          themes, shared UI and sensory feedback
src/viewer/                  Viewer, library and domain views
src/studio/                  Studio and its AI-assisted editing flow
src/create/                  writer-skill setup
src/mcp/                     shared server, local CLI and Cloudflare Worker
src/mcp-app/                 player embedded in supported chats
public/content/              authored OUI topics
public/llm/                  generated contracts, skills and ZIP packages
public/hexmaps/              campaign maps
docs/                        setup, authoring and architecture guides
tests/                       unit, evaluation, build and MCP host checks
```

## Further reading

- [MCP installation and usage](docs/mcp-setup.md)
- [Authored pages, component selection and migration](docs/sections/page.md)
- [Explained comparisons with TradeoffSandbox](docs/sections/tradeoff-sandbox.md)
- [Full generated authoring reference](public/llm/loom-authoring-prompt.md), for lookup when broader context is needed
- [Hex campaign maps](docs/creating-hexmaps.md)
- [Architecture](docs/agents/domain.md) and [agent instructions](AGENTS.md)
- [Present mode design](grill-log-presenting-mode.md) and [MCP App design](grill-log-adaptive-learning.md)

The older OKF format remains documented in [creating topics](docs/creating-topics.md).
The deprecated [standalone CDN library](docs/cdn-library.md) targets that older
format; current authoring uses OUI pages and Viewer.

## License

MIT
