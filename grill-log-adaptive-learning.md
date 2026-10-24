# Grill Log — Adaptive Learning: Callbacks, Skill Maps & AI Chat Integration

Status: **Concept — decisions 161–193 drafted, nothing implemented. Implementation slices and preparation list agreed; the owner is preparing accounts and settings. Implementation happens on branch `claude/loom-mcp-app`, starting with slice 0.**

## Goal

Let a learner keep improving across **many topics per domain** (for example Chinese, Blender 3D,
retail stock management and pricing) without a separate review chore and without a server.
Review is woven into each new topic; the system knows which skills the learner has and suggests,
or has an AI write, the next topic. Starting must be quick: a learner should get from a normal AI chat (Claude, Gemini, …) into
Loom Viewer and Present mode with little or no setup.

## Baseline

- Learner memory without a server is designed in
  [grill-log-learner-memory-review.md](grill-log-learner-memory-review.md) (decisions 143–152:
  `LearnerMemoryPort`, append-only event log, IndexedDB, synced folder, Google Drive).
- That log's review journey (decisions 153–160: warm-up, Today, Recap) is **set aside** by this
  log. The learner found separate review sessions boring, and the hex campaign a drag; Present
  mode gave the best focus.
- Topics are written by AI chats today through the `loom-topic-writer` skill (Claude app, coding
  agents) or the published prompt `public/llm/loom-authoring-prompt.md`; the answer comes back as
  a `.loom.oui` file or a folder of `.oui` files that Loom Viewer opens.
- The CDN library (`libs/loom-sections.tsx`, `loom-learning-sections` on jsDelivr) renders sections
  from OKF JSON, not from `.loom.oui` text. Viewer opens files and pasted text, not a URL.

## Decisions

Numbering continues from [grill-log-learner-memory-review.md](grill-log-learner-memory-review.md).

### Review woven into new topics

| # | Question | Decision |
|---|---|---|
| 161 | Separate review or not | **No separate review process. Every new topic is also a review of earlier ones** (a spiral curriculum, as a good language textbook reuses greetings and numbers in the shopping lesson). Sets aside decisions 153–160. |
| 162 | How old knowledge comes back | **As callbacks**, in three places: an **opening check** (2–3 quick recall questions on what the topic builds on), **woven in** (old knowledge as an ingredient of new content: an old word in a new dialogue, an old modelling step in a new workflow, an old formula with new numbers), and a **mixed final check** (the closing quiz mixes new and old questions). Woven-in callbacks are preferred. |
| 163 | How much | **About 20–30% of a topic is callbacks, 70–80% new.** More turns the new topic into a review. |
| 164 | Marking callbacks | **A callback item names what it recalls** (`recalls: "chinese/day1#greetingHello"`), so its result updates the old skill as well as the new topic. |
| 165 | Ordering rule | **The Golden Ordering Rule extends across topics:** a topic may rely on knowledge from earlier topics only when the learner has it, or when the topic recalls it explicitly. |
| 166 | Shorts | **Optional snacks between topics, not the review process.** A swipeable feed of single items, mainly for fast-fading facts (vocabulary) when the learner does not open a new topic for a while. Each short is shaped **hook → tension → payoff** (*What would you do?*, *What happens next?*, *Watch this*, *Spot the mistake*, quick hits, mini lessons). Whether the feed is worth building is checked first with a throwaway prototype of hand-written shorts. |

### Item profiles

| # | Question | Decision |
|---|---|---|
| 167 | Kinds of knowledge | **Three item profiles: fact, concept, skill.** A profile belongs to an **item**, never to a domain: every domain mixes all three (Chinese: vocabulary = fact, grammar patterns = concept, building sentences and dialogue = skill). |
| 168 | What a profile decides | **How an item comes back, as a callback or a short.** Fact: used inside new content, both directions for language (recognise and produce); quick hit as a short. Concept: asked from a new angle, connected to the new idea, never the same question twice; *spot the mistake* as a short. Skill: needed as a step in a new task, a new case each time (quizzes with changing numbers where the skill is a calculation); *what would you do?* as a short. |
| 169 | Mastery levels | **Recognise → recall → apply → teach back.** Apply and teach back need the AI tutor; without a model, items stop at recall. |

### Domains, skills and the next topic

| # | Question | Decision |
|---|---|---|
| 170 | Above topics | **A domain with a skill map**: the skills of the domain and what each needs (`Skill(id, title, needs[])`), plus goals the learner can pick ("order food in Chinese", "model a room scene", "run a profitable promotion"). Written in OUI like the rest of Loom, e.g. `public/domains/<domain>.oui`. |
| 171 | Topics and skills | **`topic.oui` gets optional `teaches` and `needs` lists of skill IDs.** Items inherit their section's skills unless tagged; Studio's AI drafts the tags. Unknown skill IDs and prerequisite loops are Tier 3 diagnostics. Skill IDs are stable; a rename keeps an alias. |
| 172 | Learner model | **Mastery per skill, computed in the browser from the event log**: how well it is remembered plus how far up the ladder (decision 169) the learner has reached. |
| 173 | What next | **An Up next suggestion, always with its reason**: *move forward* (prerequisites mastered, teaches something new), *repair* (a prerequisite has faded; the next topic carries it as callbacks), or *weak spot* (a skill keeps failing across topics). A chosen goal narrows the path to what it needs; a short placement check skips skills the learner already has. |
| 174 | Shared or personal topics | **Mixed: a shared core path for everyone, plus personal topics generated to fill each learner's gaps.** Shared topics carry generic callbacks to earlier topics in the path; personal ones target exactly what this learner is forgetting. |
| 175 | When the next topic does not exist | **Loom writes a request for it**: the domain, the skill to teach next, the learner's mastered and weak skills, the goal and the callbacks to include. An AI chat with `loom-topic-writer` writes the topic; the learner opens the `.loom.oui` in Viewer. Only the summary the learner copies leaves the device. |

### Viewer and Present as the learner's surface

| # | Question | Decision |
|---|---|---|
| 176 | Where the learner learns | **In Loom's Read and Present, shown inside the chat by the Loom MCP App (decisions 180–193), or in Loom Viewer.** The chat's model writes topics and tutors; Loom plays them. Present is the main way through a new topic (it gave the best focus); Read is for working through it by hand. Viewer stays for topics opened from files or pasted text, offline use and chats without the app. |
| 177 | Callbacks in Present | **Present stays hands-free, except for callbacks.** A callback (decision 162) or opening-check item pauses on **Your turn**: the learner answers or thinks and presses `Space`, then the stage plays the answer and its explanation. All other gates keep playing themselves (decision 101). Without this, review woven into a topic would never test the learner in Present. A Your-turn answer logs `answered`; beats played by the stage log `seen`. |
| 178 | Opening Viewer straight into Present | **`viewer.html#present`** starts in Present at the first section, and pasting a topic (Open → Paste) with that flag goes straight to the stage. The flag lives in the hash, so nothing reaches GitHub Pages. |
| 179 | Getting a topic from a chat into Viewer | **Four levels, built in order, none needs a server.** **Level 0 — works today:** the `loom-topic-writer` skill in the Claude app, or the published authoring prompt as knowledge in a Gemini Gem (or a ChatGPT GPT); the learner saves the `.loom.oui` or copies it, then opens or pastes it in Viewer. **Level 1 — a link made by code:** `viewer.html#present&oui=<deflate + base64url>` opens a whole topic from the link. The link is built by code, never typed by the model (a model cannot compress): by a one-button artifact or canvas page the chat writes around the topic text, or by the level 3 tool. **Level 2 — back to the chat:** Viewer's **Ask for next topic** copies the request of decision 175 (mastered and weak skills, goal, callbacks to include), opening the chat with it filled in where the chat accepts a prompt in its URL. **Level 3 — a local MCP server run with `npx`** (no hosting): validate a topic with the 3-tier gateway, read the learner summary from the synced memory folder (decision 149), save the topic to a folder, and return its level 1 link; for Claude Desktop, Claude Code, Gemini CLI and other MCP clients. |
| 180 | Remote connectors and MCP Apps | **Yes: a Loom MCP App, served by a serverless, stateless endpoint, with its UI on GitHub Pages.** Revises the earlier "not now". MCP Apps is a shared standard, so one app plays Present and Read inside every chat that renders MCP App UI. The endpoint stores nothing about the learner, so decision 143 (no server for learner memory) still holds. Decisions 181–186 give the shape. |

### The Loom MCP App

| # | Question | Decision |
|---|---|---|
| 181 | The parts | **Three, none with a database.** (1) **GitHub Pages** hosts the UI: Loom's Read and Present for one topic, as a page the app loads (exists as a site today). (2) **A serverless MCP endpoint** (Streamable HTTP) answers the chat app: it lists the tools and returns the UI resource. (3) **The same server as an npm package over stdio** for chats on the learner's computer (`npx`, or a `.mcpb` extension for Claude Desktop). |
| 182 | The UI resource | **A small HTML shell at `ui://loom/present`** that loads Loom's script and styles from GitHub Pages, declared in `_meta.ui.csp.resourceDomains` (`https://chanatipsaetia.github.io`). The shell is a few KB, so the endpoint stays tiny and every Pages deploy updates the app in every chat at once. No nested iframe of the Pages site (`frameDomains`), since hosts may restrict it. |
| 183 | Tools | **`get_authoring_guide(sections?)`** (decision 188), **`show_topic(oui, mode?)`** (Present by default, or Read) and **`next_topic_request(summary)`** on both servers. The local server adds **`validate_topic(oui)`** (the full 3-tier check, called before `show_topic`), **`save_topic(oui, name)`**, **`list_topics(domain?)`**, **`open_topic(name)`**, **`learner_summary(domain)`** and **`record_events(events)`**, which only the app calls (hidden from the model). The hosted endpoint adds `learner_summary` and `record_events` once the learner has signed in (decision 186). |
| 184 | Where work runs | **In the learner's browser, inside the app**, for parsing, rendering and, on the hosted endpoint, validation (Loom does all of them in the browser already); the endpoint only passes text through, within a free tier's per-request CPU limit (10 ms on Cloudflare Workers Free). **Locally**, `validate_topic` runs the 3-tier check before the topic is shown, so the model fixes errors before the learner sees them. **Hosted**, the app finds the errors and sends them back to the chat as a fix request (Viewer's Copy-errors flow, done for the learner). |
| 185 | Hosting and cost | **Cloudflare Workers, free plan**, on its `*.workers.dev` address: 100,000 requests a day, about 4–6 per topic opened, so roughly 15,000–25,000 topic opens a day at $0. No sign-in: the endpoint holds nothing private. Vercel Hobby (personal, non-commercial only), Deno Deploy or Netlify Functions are alternatives behind the same code. The paid Workers plan starts at $5 a month if ever needed. |
| 186 | Learner memory | **In the learner's own storage, never on a Loom server.** **Local:** the server writes the app's events to the memory folder (decision 149), which may sit inside a OneDrive- or Drive-synced folder. **Hosted:** adding the connector asks the learner to **sign in with Microsoft or Google**; each request carries the learner's token and the endpoint reads and writes the event log in **the OneDrive app folder** (`Files.ReadWrite.AppFolder`, first, as the learner uses Microsoft 365) or **the Google Drive `appDataFolder`** (decision 150), then forgets. The endpoint keeps only an OAuth client secret per provider and the connector's sign-in records, encrypted in Workers KV (free tier); no topic, answer or progress. Without sign-in the app offers **Continue in Viewer**. The same event-log files (decisions 145–146) serve Viewer, the local server and the connector, so there is one memory. Revises the earlier "hosted: not kept in the chat". |
| 187 | The local server | **Allowed, and a full peer of the hosted endpoint, not a fallback.** The npm package runs on the learner's computer over stdio (`npx`, or a `.mcpb` extension for Claude Desktop) and can do what the hosted endpoint cannot: keep learner memory in the memory folder (decision 186), validate topics with the 3-tier gateway with no CPU limit, save topics to a folder the learner picks, and serve the UI from the package itself so it works offline (GitHub Pages stays the default source). It is the preferred path whenever the chat runs on the learner's computer (VS Code Copilot, Goose, Claude Desktop, Cursor); the hosted endpoint covers web and mobile chats. |
| 188 | How the model learns Loom's format | **From the server, not from a skill or a pasted prompt.** `get_authoring_guide(sections?)` returns the core rules plus only the section types the model plans to use (the whole prompt is about 72 KB, roughly 18k tokens, too much for every request). Any chat with the app connected can write topics; the `loom-topic-writer` skill stays for chats without it. |
| 189 | How a topic looks in the chat | **A compact card inline** (title, sections, **▶ Play**); **Play asks the host for fullscreen**, where Present's 16:9 stage (1200×675) plays. Pressing Play also starts the narration (browsers allow audio only after a click) and gives the app keyboard focus (`Space`, arrows, `N`). Read opens the same way. Hosts that do not offer fullscreen play the stage scaled into the card. |
| 190 | The chat's model as tutor | **The app tells the model what happened**: a missed Your turn ("learner missed `q2`: measure word for books") goes into the model's context, so the model explains in the conversation. Viewer's own assistant is not needed inside a chat. |
| 191 | Next topic from inside the app | **A Next topic button** sends the learner's summary (mastered and weak skills, goal, callbacks to include; decisions 172–175) into the chat as a message; the model writes the next topic and calls `show_topic` again. |
| 192 | The chat app's own memory | **Only a summary for the model**, never the learner's record. Claude, ChatGPT or Copilot memory may hold a line like "tones solid, measure words weak"; the event log in the learner's storage (decision 186) stays the source of truth. |
| 193 | Local models | **Tutor locally, write with a stronger model.** Writing a 5–30 KB topic and calling tools correctly is hard for small local models; in Goose the learner may keep the local model for tutoring and give a stronger model (through an API key) the writing. |

**Hosts, in order of trying** (Oct 2026; check the official MCP Apps host list before relying on one):

| Order | Host | Kind | Server | MCP App UI |
|---|---|---|---|---|
| 1 | MCPJam, the SDK's basic host | Testing | Either | Yes |
| 2 | VS Code + GitHub Copilot | Subscription or own key | Local (stdio) | Yes (official list) |
| 2 | Goose | Local models (Ollama) or any API key | Local (stdio) | Yes (official list) |
| 3 | Claude Desktop | Subscription | Local (`.mcpb`) or hosted | Yes (official list) |
| 4 | Claude web and mobile | Subscription | Hosted (custom connector) | Yes (official list) |
| 4 | ChatGPT | Subscription | Hosted (Developer Mode, Apps SDK) | Reported, not on the official list |
| 4 | Microsoft 365 Copilot | Work and school | Hosted (admin) | Yes (official list) |
| 4 | Mistral Le Chat, Cursor | Subscription | Hosted; Cursor also local | Reported |
| — | LM Studio, Open WebUI, Jan, AnythingLLM | Local models | Local (stdio) | No evidence: tools only, so `show_topic` falls back to the Viewer link |

## Learner Journey & User Stories

**Draft — to be adjusted (second version, with the Loom MCP App).** The learner is a self-learner
with a few domains in mind (Chinese, Blender 3D, stock management and pricing) who uses Microsoft
365 Copilot, maybe Claude or ChatGPT, and a local model. Learning happens **inside the chat**
through the Loom MCP App; Loom Viewer stays for files, pasted text and offline use. Status:
**Exists** today, or **New** with the decisions it depends on.

```
0. Set up once ──► 1. Ask in the chat ──► 2. Topic appears in the chat ──► 3. Watch (Present)
                                                                                │
6. Grow the domain ◄── 5. Next topic (with callbacks) ◄── 4. Try it, ask the tutor ◄┘
                              ▲
                              └── Leave & come back: memory in your own folder or cloud
```

### 0. Set up once

Add Loom to the chats the learner uses, with memory in storage they own.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| U1 | to add Loom to a chat on my computer (Goose, Claude Desktop, VS Code) with one command or one click | it runs locally, free, with no account | **New** (181, 187) |
| U2 | to add Loom to a web or phone chat (Claude, Microsoft 365 Copilot, ChatGPT) by its connector address | I can learn anywhere | **New** (180, 185) |
| U3 | to sign in with Microsoft (or Google) when I add the connector | my memory is kept in my own OneDrive (or Drive) and nowhere else | **New** (186) |
| U4 | my computer's chats and my web chats to share one memory | my progress follows me | **New** (145–146, 186) |

### 1. Ask in the chat

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| A1 | to ask for a topic or state a goal in plain words ("teach me Chinese for shopping") | I need no special prompt | **New** (188, 170) |
| A2 | the chat to learn Loom's format by itself | I need no skill, Gem or pasted prompt | **New** (188) |
| A3 | a short placement check when I start a domain | I skip what I know | **New** (173) |

### 2. The topic appears in the chat

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| T1 | the topic to appear in the conversation as a card with ▶ Play | I never save, paste or switch apps | **New** (183, 189) |
| T2 | errors fixed before I see the topic | I never deal with broken topics | **New** (184: validated locally, sent back to the chat when hosted) |
| T3 | my topics saved so I can reopen them in a later chat | I build a library | **New** (183: local `save_topic`, `open_topic`) |

### 3. Watch it in Present

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| P1 | Play to open Present fullscreen with the voice on | I get full focus with one click | **New** (189); Present itself exists |
| P2 | one idea per beat, narrated | I follow without effort | Exists (decisions 101–111) |
| P3 | beats that recall earlier learning to pause on **Your turn** | I remember rather than just watch | **New** (162, 177) |

### 4. Try it, and ask the tutor

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| R1 | to switch to Read in the app and do the quizzes, sandboxes and scenarios myself | I practise what I watched | Exists in Viewer; **New** in the app |
| R2 | the chat to know what I got wrong and explain it in the conversation | the tutor is the chat I already use | **New** (190) |
| R3 | hints before answers | I still do the thinking | Exists as a rule of Viewer's tutor (decision 119); **New** for the chat's model |
| R4 | my answers recorded | Loom knows what I learned | **New** (183 `record_events`, 186) |

### 5. Leave, come back, and get the next topic

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| N1 | nothing lost when I close the chat | I continue in any later chat | **New** (186) |
| N2 | to see what I still remember in each domain, not a pile of overdue items | coming back feels good | **New** (172) |
| N3 | a **Next topic** button with a reason ("tones solid; measure words weak") | I trust the suggestion and act on it in one click | **New** (173, 191) |
| N4 | the next topic to bring back what I am forgetting inside the new material | I review without noticing | **New** (161–163) |
| N5 | callback results to count for the old skill | Loom knows I still have it | **New** (164) |

### 6. Grow the domain

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| D1 | to see my path toward my goal: done, next, fading | I know where I stand | **New** (170, 172) |
| D2 | shared topics when they exist and personal ones when they do not | I get the best of both | **New** (174) |
| D3 | to change my goal and have the path follow | my learning follows my needs | **New** (170, 173) |

### Viewer, still there

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| V1 | to open a topic file or pasted text in Viewer, straight into Present | I can learn outside a chat or offline | Exists (open, paste); **New** `#present` (178) |
| V2 | **Continue in Viewer** from the app | I carry on with memory when the chat cannot keep it | **New** (186) |
| V3 | Viewer and the app to share one memory | it is one learning record | **New** (145–150, 186) |

### When things go wrong

- **The topic has errors:** locally the model fixes them before showing; hosted, the app sends them
  back to the chat as a fix request (184).
- **The chat does not render MCP App UI:** the tools still work and `show_topic` answers with a
  Viewer link instead.
- **The local model cannot write a valid topic:** keep it as tutor and let a stronger model write
  (193).
- **Sign-in declined, or a work account needs admin consent:** the app plays topics without memory
  and offers Continue in Viewer (186).
- **No fullscreen in the host:** the stage plays scaled into the card (189).
- **Wrong facts in an AI-written topic:** validation checks structure only; the tutor marks what
  comes from the topic and what from its own knowledge.

### What the gap shows

Present, Read, validation and the error flow exist; everything around them in a chat is new.
Three groups, in order: **the app shows a topic in a chat** (T1, P1; decisions 181–183, 189),
**memory** (U3, U4, R4, N1; decision 186) and **the loop** (R2, N3–N5; decisions 161–164, 190–191).
The loop needs memory first: without it Loom cannot know what the learner is forgetting.

## Implementation Slices

**Draft — to be adjusted.** Each slice is a thin, end-to-end piece the learner can use and demo,
built in order: risk first, local before hosted (no deploy, every feature), memory before the loop.
Size is relative: **S** small, **M** medium, **L** large.

| # | Slice | The learner can… | Stories | Decisions | Size |
|---|---|---|---|---|---|
| 0 | **Spike: can hosts run the shell?** | — (a test, not a feature) | — | 181, 182, 189 | S |
| 1 | **A topic plays in a chat (local)** | ask Goose for a topic and watch it in Present inside the chat | U1, A1, A2, T1, P1, P2, R1 | 181–183, 188, 189 | L |
| 2 | **No broken topics** | never see a topic with errors | T2 | 184 | S |
| 3 | **Viewer links** | jump from the chat to Viewer, straight into Present | V1, V2 (without memory) | 178, 179 | S |
| 4 | **Memory, locally** | close the chat and find progress and saved topics in the next one | R4, N1, T3, V3 (local) | 144–149, 151, 152, 183 | L |
| 5 | **Hosted endpoint** | learn in Claude web and mobile, Microsoft 365 Copilot or ChatGPT | U2 | 180, 184, 185 | M |
| 6 | **Memory in your cloud** | sign in once and share one memory across web chats, local chats and Viewer | U3, U4, V3 | 150, 186 | L |
| 7 | **Your turn and the tutor** | answer callbacks in Present and have the chat explain misses | P3, R2, R3, N5 | 162, 164, 177, 190 | M |
| 8 | **The loop** | press Next topic and get a topic that carries what they are forgetting | N2, N3, N4 | 161, 163, 170–175, 191, 192 | L |
| 9 | **Grow the domain** | pick a goal, take a placement check, follow a path | A3, D1, D2, D3 | 170, 173, 174 | M |

### Slice 0 — Spike: can hosts run the shell?

- A throwaway MCP server with one tool returning a `ui://` shell that loads a script from GitHub
  Pages through `_meta.ui.csp.resourceDomains`, plays a sound after a click and asks for
  fullscreen.
- Tried in **MCPJam**, **Goose**, **Claude Desktop** and, through a tunnel, a **Claude custom
  connector**.
- **Done when:** a table of which hosts load the script, allow fullscreen and play audio. It
  decides decisions 182 and 189 before slice 1 builds on them.

### Slice 1 — A topic plays in a chat (local)

- **App page on GitHub Pages:** a new Vite entry `mcp-app.html` (`src/mcp-app/`), deployed with the
  site, that receives the tool input through the MCP Apps bridge (`@modelcontextprotocol/ext-apps`)
  and reuses Viewer's topic loading and the Present stage
  (`src/core/supporting/presentation/`). Inline: the card with ▶ Play; Play → fullscreen Present
  with the voice; a Read toggle.
- **Server package** (`mcp/`): one tool layer shared by both transports; this slice ships the stdio
  transport with `show_topic` and `get_authoring_guide`. Runs with `npx`.
- **Authoring guide split by section type:** `npm run oui:schema` also writes the core rules and
  one part per section type, which `get_authoring_guide(sections?)` returns.
- **Done when:** in Goose (and MCPJam) "teach me X" ends with Present playing in the chat; unit
  tests for the tool layer and the guide split.

### Slice 2 — No broken topics

- `validate_topic` on the local server runs the 3-tier gateway in Node; the guide tells the model
  to call it before `show_topic`.
- The app validates too and, on errors, sends them back to the chat as a fix request (the Viewer
  Copy-errors text).
- **Done when:** a topic with a deliberate error is fixed by the model before it is shown.

### Slice 3 — Viewer links

- `viewer.html#present` starts in Present; `#present&oui=<deflate + base64url>` opens a whole
  topic from the link.
- The app's **Continue in Viewer**, and `show_topic`'s answer in hosts without app UI, use that
  link.
- **Done when:** the link opens the same topic at the same place in Viewer.

### Slice 4 — Memory, locally

- `LearnerMemoryPort` and the event log in `src/core/supporting/learner-progress/`; the IndexedDB
  adapter replaces the `localStorage` calls in Viewer; `loom:progress:v1` is imported once.
- Present logs `seen`, Read logs `answered`; items keyed by Pick pointer with a content hash.
- Local server: the folder adapter, `record_events` (app-only), `save_topic`, `list_topics`,
  `open_topic`.
- Back up / Restore in Viewer. Claude Desktop packaging as `.mcpb`.
- **Done when:** progress made in one Goose chat shows in the next chat and in Viewer opened on
  the same folder.

### Slice 5 — Hosted endpoint

- The shared tool layer behind Streamable HTTP on **Cloudflare Workers** (free plan), with the
  hosted tool set (`show_topic`, `get_authoring_guide`, `next_topic_request`); no sign-in yet.
- Added to **Claude** as a custom connector, then tried in **Microsoft 365 Copilot** and
  **ChatGPT**; the hosts table updated with what works.
- **Done when:** Present plays inside Claude on the web and on a phone.

### Slice 6 — Memory in your cloud

- Connector sign-in with **Microsoft first** (Entra app, `Files.ReadWrite.AppFolder`), Google
  second; sign-in records encrypted in Workers KV; the endpoint forwards to the OneDrive app
  folder and stores no learner data.
- A OneDrive adapter for Viewer and the local server, so all three read the same event-log files.
- **Done when:** a quiz answered in Claude on the phone counts in Goose on the computer and in
  Viewer. Work accounts that need admin consent are noted.

### Slice 7 — Your turn and the tutor

- Callback marking in OUI (`recalls`), in the authoring guide and in `npm run oui:schema`; the
  Present beats of callback items pause on Your turn.
- The app tells the chat's model about misses; the guide gives the model the tutor rules (hints
  before answers).
- **Done when:** a missed callback in Present gets an explanation in the chat, and its result
  counts for the old skill.

### Slice 8 — The loop

- Domain files with skills (`public/domains/<domain>.oui`), `teaches` and `needs` in `topic.oui`,
  Tier 3 checks for skill IDs.
- Mastery per skill from the event log; `learner_summary`; Up next with its reason; the **Next
  topic** button and `next_topic_request`, asking for 20–30% callbacks.
- Worked first on the three example domains.
- **Done when:** after one topic, Next topic produces a topic whose callbacks target the
  learner's weak skills.

### Slice 9 — Grow the domain

- Goals in the domain file and the path they imply; the placement check; shared topics with
  personal ones filling the gaps.
- **Done when:** choosing "order food in Chinese" shows a path, and the placement check skips
  what the learner knows.

### What to prepare, by slice

Accounts, keys and settings the slices need from the owner. Tokens and secrets go into GitHub
repository secrets or the cloud environment's settings, never into a chat.

| Needed by | What | Who | Notes |
|---|---|---|---|
| Slices 0–4 | **Goose** desktop app with a model provider: a local model (Ollama or LM Studio) and, for writing topics, an API key for a stronger model (e.g. OpenRouter or Anthropic) | Owner | The owner tests in real hosts; this session cannot run Goose or Claude Desktop |
| Slices 0–4 | **Claude Desktop**, if the owner has Claude | Owner | Optional; Goose and MCPJam cover the early slices |
| Slice 0 | **Where the spike's test script is served**: merge it to `main` so GitHub Pages deploys it, or serve it from a tunnel | Owner decides | Pages deploys from `main` (`.github/workflows/deploy-gh-pages.yml`) |
| Slices 0–1 | **Network access for this session** to `chanatipsaetia.github.io` and `cdn.jsdelivr.net` | Owner, in the environment's Network access settings | Lets this session test the shell in MCPJam with Playwright; both are blocked today |
| Slice 1, 4 | **npm publishing** for the server package (`npx …`): a package name and an npm automation token as the `NPM_TOKEN` repository secret | Owner | The owner already publishes `loom-learning-sections` |
| Slice 5 | **Cloudflare account** (free plan), its **account ID**, a **workers.dev subdomain**, and an **API token** from the "Edit Cloudflare Workers" template | Owner | Stored as `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` **repository secrets**; a GitHub Actions workflow deploys with Wrangler. Deploying from this session instead would need the token as an environment secret and `api.cloudflare.com` allowed in Network access |
| Slice 5 | **Claude plan with custom connectors**, if Claude is used on the web or phone | Owner | Check the plan's connector limits |
| Slice 5–6 | **Microsoft 365 Copilot: work or personal account?** For work: does the tenant allow custom agents or connectors (Copilot Studio), and will an admin consent to OneDrive app-folder access? | Owner (and IT) | Decides whether Microsoft 365 Copilot is a slice 5 host |
| Slice 6 | **Microsoft Entra app registration** for personal (and, if allowed, work) accounts: client ID, client secret, redirect URI on the Worker, `Files.ReadWrite.AppFolder` | Owner | Secret as a Worker secret; a Workers KV namespace for sign-in records (created by Wrangler) |
| Slice 6 | **Google Cloud OAuth client** (`drive.appdata`), later | Owner | Second provider |
| Every slice | **Names**: the npm package, the Worker, the connector's display name | Owner decides | Placeholders until chosen |

### Across every slice

- `npm run typecheck`, `npm run test` and `npm run lint` pass; new behaviour gets Vitest tests and
  a Playwright check against the dev server.
- AGENTS.md, the README and this log are updated as decisions are built; component changes run
  `npm run oui:schema`.
- The shorts feed (decision 166) is outside these slices until its prototype says it is worth it.

## The Three Domains as Examples

| | **Chinese** | **Blender 3D** | **Stock management & pricing** |
|---|---|---|---|
| Mix | Mostly fact; skill (sentences, dialogue); concept (grammar) | Mostly skill; fact (shortcuts, names); concept (how Blender thinks) | Mostly skill (calculate, decide); concept (why stock and prices behave so); fact (terms, formulas) |
| Example skill path | tones → greetings → numbers → time and dates → prices and shopping; `是` → `吗` → measure words | interface → modelling basics → modifiers → materials → UV → lighting → rendering; sculpting and rigging branches | margin vs markup → stock counting → reorder point → ABC analysis → pricing strategy → promotions → forecasting → supplier terms |
| Callbacks in a new topic | *Shopping* dialogues reuse greetings and numbers; a `吗` question about prices | *Materials* starts by modelling a cup (loop cuts, bevel); a material bug caused by modifier order | *Promotions* needs margin vs markup with new numbers; a promotion that causes a stockout brings back the reorder point |
| Strongest section | Flashcards with listening | Scenario ("why does it look wrong?") | Formula sandbox (the discount trap) |
| Feature it asks for | "Hear it" items with the browser voice | Practice prompts done in Blender and reported back; GIF or video in the gallery | Quizzes with changing numbers from the sandbox formulas |
| Where real practice happens | Talking with people | In Blender | With the learner's own shop numbers |

## Open Questions

- Whether each host honours `_meta.ui.csp.resourceDomains` the same way, so the shell can load
  Loom from GitHub Pages (decision 182). Test on MCPJam and Claude first.
- What GitHub Pages entry the shell loads: the Viewer page as it is, or a slimmer page for one topic.

- Which chats accept a prompt in their URL for decision 179 level 2 (and under what length limit)?
  Check Claude, Gemini and ChatGPT before relying on it.
- Level 1 links: how long a compressed topic gets (a typical topic is tens of KB of OUI), whether
  chats keep links that long intact, and whether Claude artifacts and Gemini Canvas may open a new
  tab from a button. A topic too long for a link falls back to copy and paste.
- Should a callback's Your turn in Present wait without limit, or play the answer after a while
  so a learner who is only watching is not stuck?
- Keep, simplify or retire the hex campaign now that review lives in topics?
- How much skill tagging is acceptable for authors, with AI drafts?
- Where shared domain files live and who maintains them, versus personal topics kept in the
  learner's own folder or Drive.
