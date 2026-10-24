# Grill Log — Adaptive Learning: Callbacks, Skill Maps & AI Chat Integration

Status: **Concept — under discussion, nothing implemented (decisions 161–177)**

## Goal

Let a learner keep improving across **many topics per domain** (for example Chinese, Blender 3D,
retail stock management and pricing) without a separate review chore and without a server.
Review is woven into each new topic; the system knows which skills the learner has and suggests,
or has an AI write, the next topic. Starting must be quick: a learner should get going from a
normal AI chat (Claude, Gemini, …) with little or no setup.

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

### Starting from an AI chat (Claude, Gemini, …)

| # | Question | Decision |
|---|---|---|
| 176 | Ways in, by effort | **Four levels; build them in order, and none needs a server.** **Level 0 — works today:** the `loom-topic-writer` skill in the Claude app, and the published authoring prompt as knowledge in a Gemini Gem (or a ChatGPT GPT); ask for a topic, open the `.loom.oui` in Viewer. **Level 1 — one copy:** Viewer's **Ask for next topic** copies the request (decision 175), opening the chat with it filled in where the chat accepts a prompt in its URL. **Level 2 — no file handling:** the chat shows the topic itself, as an artifact or canvas page that loads the Loom CDN library and renders the `.loom.oui` text. **Level 3 — a local MCP server, `npx`-run** (no hosting): tools to validate a topic with the 3-tier gateway, read the learner summary from the synced memory folder (decision 149) and save topics to a folder; for Claude Desktop, Claude Code, Gemini CLI and other MCP clients. |
| 177 | Remote connectors and MCP Apps | **Not now.** A remote MCP connector (the only kind the Claude and Gemini web and mobile apps can add) or an MCP App needs a hosted server, which decision 143 rules out. Revisit only if a free serverless host becomes acceptable. |

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

- Which chats accept a prompt in their URL for decision 176 level 1 (and under what length limit)?
  Check Claude, Gemini and ChatGPT before relying on it.
- Level 2 needs the CDN library to render `.loom.oui` text (it takes OKF JSON today) and the chat to
  allow loading it from jsDelivr. Check Claude artifacts and Gemini Canvas.
- Keep, simplify or retire the hex campaign now that review lives in topics?
- How much skill tagging is acceptable for authors, with AI drafts?
- Where shared domain files live and who maintains them, versus personal topics kept in the
  learner's own folder or Drive.
