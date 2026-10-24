# Grill Log — Adaptive Learning: Callbacks, Skill Maps & AI Chat Integration

Status: **Concept — under discussion, nothing implemented (decisions 161–187)**

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
| 176 | Where the learner learns | **In Loom Viewer, Read or Present.** An AI chat (Claude, Gemini, …) only writes topics and answers questions; it is never the place a topic is played. Present mode is the main way through a new topic (it gave the best focus); Read is for working through it by hand. |
| 177 | Callbacks in Present | **Present stays hands-free, except for callbacks.** A callback (decision 162) or opening-check item pauses on **Your turn**: the learner answers or thinks and presses `Space`, then the stage plays the answer and its explanation. All other gates keep playing themselves (decision 101). Without this, review woven into a topic would never test the learner in Present. A Your-turn answer logs `answered`; beats played by the stage log `seen`. |
| 178 | Opening Viewer straight into Present | **`viewer.html#present`** starts in Present at the first section, and pasting a topic (Open → Paste) with that flag goes straight to the stage. The flag lives in the hash, so nothing reaches GitHub Pages. |
| 179 | Getting a topic from a chat into Viewer | **Four levels, built in order, none needs a server.** **Level 0 — works today:** the `loom-topic-writer` skill in the Claude app, or the published authoring prompt as knowledge in a Gemini Gem (or a ChatGPT GPT); the learner saves the `.loom.oui` or copies it, then opens or pastes it in Viewer. **Level 1 — a link made by code:** `viewer.html#present&oui=<deflate + base64url>` opens a whole topic from the link. The link is built by code, never typed by the model (a model cannot compress): by a one-button artifact or canvas page the chat writes around the topic text, or by the level 3 tool. **Level 2 — back to the chat:** Viewer's **Ask for next topic** copies the request of decision 175 (mastered and weak skills, goal, callbacks to include), opening the chat with it filled in where the chat accepts a prompt in its URL. **Level 3 — a local MCP server run with `npx`** (no hosting): validate a topic with the 3-tier gateway, read the learner summary from the synced memory folder (decision 149), save the topic to a folder, and return its level 1 link; for Claude Desktop, Claude Code, Gemini CLI and other MCP clients. |
| 180 | Remote connectors and MCP Apps | **Yes: a Loom MCP App, served by a serverless, stateless endpoint, with its UI on GitHub Pages.** Revises the earlier "not now". MCP Apps is a shared standard, so one app plays Present and Read inside every chat that renders MCP App UI. The endpoint stores nothing about the learner, so decision 143 (no server for learner memory) still holds. Decisions 181–186 give the shape. |

### The Loom MCP App

| # | Question | Decision |
|---|---|---|
| 181 | The parts | **Three, none with a database.** (1) **GitHub Pages** hosts the UI: Loom's Read and Present for one topic, as a page the app loads (exists as a site today). (2) **A serverless MCP endpoint** (Streamable HTTP) answers the chat app: it lists the tools and returns the UI resource. (3) **The same server as an npm package over stdio** for chats on the learner's computer (`npx`, or a `.mcpb` extension for Claude Desktop). |
| 182 | The UI resource | **A small HTML shell at `ui://loom/present`** that loads Loom's script and styles from GitHub Pages, declared in `_meta.ui.csp.resourceDomains` (`https://chanatipsaetia.github.io`). The shell is a few KB, so the endpoint stays tiny and every Pages deploy updates the app in every chat at once. No nested iframe of the Pages site (`frameDomains`), since hosts may restrict it. |
| 183 | Tools | **`show_topic(oui, mode?)`** renders a `.loom.oui` topic in Present (default) or Read; **`next_topic_request(summary)`** turns the learner's skill summary into the request of decision 175 for the model to write the next topic. More tools only when a story needs them. |
| 184 | Where work runs | **In the learner's browser, inside the app**, not on the endpoint: parsing, the 3-tier validation and rendering all run in the UI (Loom does them in the browser already). The endpoint only passes text through, which keeps it within a free tier's per-request CPU limit (10 ms on Cloudflare Workers Free). Validation errors show in the app and are handed back to the model to fix. |
| 185 | Hosting and cost | **Cloudflare Workers, free plan**, on its `*.workers.dev` address: 100,000 requests a day, about 4–6 per topic opened, so roughly 15,000–25,000 topic opens a day at $0. No sign-in: the endpoint holds nothing private. Vercel Hobby (personal, non-commercial only), Deno Deploy or Netlify Functions are alternatives behind the same code. The paid Workers plan starts at $5 a month if ever needed. |
| 186 | Learner memory inside a chat | **Local: through the server.** Over stdio the app hands its events to a tool that writes them to the learner's memory folder (decision 149). **Hosted: not kept in the chat.** The sandboxed iframe cannot be trusted to keep browser storage or to sign in to Google Drive, so the app offers **Continue in Viewer**, a link carrying the topic and the session's results, and memory lives in Viewer (decisions 147–150). |
| 187 | The local server | **Allowed, and a full peer of the hosted endpoint, not a fallback.** The npm package runs on the learner's computer over stdio (`npx`, or a `.mcpb` extension for Claude Desktop) and can do what the hosted endpoint cannot: keep learner memory in the memory folder (decision 186), validate topics with the 3-tier gateway with no CPU limit, save topics to a folder the learner picks, and serve the UI from the package itself so it works offline (GitHub Pages stays the default source). It is the preferred path whenever the chat runs on the learner's computer (VS Code Copilot, Goose, Claude Desktop, Cursor); the hosted endpoint covers web and mobile chats. |

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
| — | Gemini app | Subscription | Hosted custom apps (reportedly US, personal, web only) | Not confirmed: use a Gem and the Viewer link until it is |
| — | LM Studio, Open WebUI, Jan, AnythingLLM | Local models | Local (stdio) | No evidence: tools only, so `show_topic` falls back to the Viewer link |

## Learner Journey & User Stories

**Draft — to be adjusted.** The learner is a self-learner with a few domains in mind (Chinese,
Blender 3D, stock management and pricing), who uses a normal AI chat and learns in Loom Viewer.
Status: **Exists** today, or **New** with the decisions it depends on.

```
1. Start ──► 2. Get a topic ──► 3. Watch it (Present) ──► 4. Try it (Read)
   ▲                                                          │
   │                                                          ▼
7. Grow the domain ◄── 6. Next topic (with callbacks) ◄── 5. Leave & come back
```

### 1. Start (first time)

From "I want to learn X" to a first topic in minutes.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| S1 | to add Loom to the chat I already use (Claude skill, Gemini Gem) in one step | I install nothing | Exists for the Claude skill; **New**: a Gem guide (179) |
| S2 | to state my goal in plain words ("order food in Chinese") | the first topic fits what I want | **New** (170, 175) |
| S3 | a short placement check when I know a bit already | I skip what I know | **New** (173) |

### 2. Get a topic into Viewer

From the chat's answer to Viewer without handling files.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| G1 | to open the topic the chat wrote, by file or by paste | I can start learning | Exists |
| G2 | to click one link and land in Viewer with the topic loaded | I skip saving and pasting | **New** (179 level 1) |
| G3 | to copy a broken topic's errors back to the chat as a fix request | I need not understand the error | Exists |

### 3. Watch it in Present (first pass)

Understand with full focus and no decisions.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| P1 | the topic to open straight into Present | it starts playing at once | **New** (178) |
| P2 | one idea per beat, narrated | I follow without effort | Exists (decisions 101–111) |
| P3 | a beat that recalls earlier learning to pause on **Your turn** | I remember it rather than just watch | **New** (162, 177) |
| P4 | to pause and ask the tutor about what is on screen | my question is answered in context | Exists (decision 119) |

### 4. Try it in Read (hands-on)

Do the quizzes, sandboxes and scenarios myself.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| R1 | to switch from Present to Read at the same section | I try what I just watched | Exists |
| R2 | my answers remembered | Loom knows what I have learned | **New** (145, 147) |
| R3 | hints before answers from the tutor when I am stuck | I still do the thinking | Exists (decision 119) |

### 5. Leave and come back

Nothing lost, and no guilt.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| L1 | my progress kept on this device after I close the browser | I pick up where I left | **New** (147) |
| L2 | my progress on my phone and laptop, with no Loom account or server | I learn on any device | **New** (149, 150) |
| L3 | to see what I still remember in each domain, not a pile of overdue items | coming back feels good | **New** (172) |
| L4 | optional shorts for vocabulary when I have a few minutes | fast-fading facts stay fresh | **New, optional** (166, after a prototype) |

### 6. Get the next topic, with review inside

Keep improving without a separate review session.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| N1 | Loom to suggest what is next and why ("tones are solid; measure words are weak") | I trust the suggestion | **New** (173) |
| N2 | to ask the chat for that topic in one click, carrying what I know and what is fading | the next topic fits me | **New** (175, 179 level 2) |
| N3 | the next topic to bring back what I am forgetting inside the new material | I review without noticing | **New** (161–163) |
| N4 | callback results to count for the old skill | Loom knows I still have it | **New** (164) |

### 7. Grow the domain

From separate topics to a path toward my goal.

| # | As a learner, I want… | so that… | Status |
|---|---|---|---|
| D1 | to see my path toward my goal: done, next, fading | I know where I stand | **New** (170, 172) |
| D2 | shared topics when they exist and personal ones when they do not | I get the best of both | **New** (174) |
| D3 | to change my goal and have the path follow | my learning follows my needs | **New** (170, 173) |

### When things go wrong

- **The chat's topic is broken:** its errors go back to the chat with Copy (G3, exists).
- **The topic is too long for a link:** fall back to paste (G1).
- **No AI model connected in Viewer:** the topic still plays; callbacks stop at recall, with no apply
  or teach back (169).
- **Away for weeks:** the next topic carries more repair callbacks, still within the cap (163);
  no backlog appears.
- **Wrong facts in an AI-written topic:** the tutor marks what comes from the topic and what from
  its own knowledge; validation checks structure only.

### What the gap shows

Watching (step 3), the error loop and the tutor already work. What is missing falls in three
groups: **a smoother entry** (P1, G2), **memory** (R2, L1, L2) and **the loop** (N1–N4). The loop
needs memory first: without it Loom cannot know what the learner is forgetting.

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
