# Grill Log — AI Assistant for Pick in Studio and Viewer

Status: **All phases complete (1–4), plus decisions 63–64 and 119–128; decisions 129–142 (Studio tools, staged edits, planning, web search) implemented**

## Goal

Let a person send their picks (decisions 40–53) straight to an AI model from **Loom Studio** or
**Loom Viewer**, without copying them to an outside agent. The pages call any
**OpenAI-compatible API** (`/models`, `/chat/completions`) directly from the browser, with a
base URL the person types in: a local server (Ollama, LM Studio, llama.cpp, vLLM), OpenRouter,
OpenAI or anything else that follows the spec. There is **no backend**.

## Baseline

- Pick mode builds a tray of pointers (`kafka/sections/quiz.oui:14 #q2.explanation`) with
  optional comments and an Ask question; **Copy** writes one block for an outside agent that has
  the files (decisions 40, 44). The tray lives in `localStorage` per topic (decision 45).
- Nothing in the app calls a model.
- Viewer is read-only. Studio edits files through the File System Access API, keeps unsaved
  buffers, and shows code + form + live preview with `lastValid` fallback.
- The published authoring prompt (`public/llm/loom-authoring-prompt.md`) is about 47 KB
  (~12k tokens), more than the default context of many local models.

## Decisions

Numbering continues from [grill-log-pick-and-comment.md](grill-log-pick-and-comment.md).

| # | Question | Decision |
|---|---|---|
| 54 | What the assistant does | **Answer and propose edits.** The tray (pointers, comments, question) and the picked source go to the model, which streams an answer. In **Studio** the model may also propose `.oui` changes; they land as a **diff in the editor buffer** that is accepted or rejected hunk by hunk, then go through the Validation Gateway and the preview like a manual edit. Nothing is written until **Save**. If the proposed buffer fails validation, the diagnostics go back to the model **once**, automatically; that is the only loop. **Viewer** is answer-only. No tool calling: it is the least consistent part of the spec across local servers and OpenRouter models. |
| 55 | Where connection settings live | **Named profiles in `localStorage`, key split out.** A profile holds a name, base URL, model, extra headers (OpenRouter's `HTTP-Referer` / `X-Title`), token budget and the Full reference switch (decision 59); one profile is active. The API key goes to `sessionStorage` (forgotten when the tab closes) unless **"Remember key on this device"** moves it to `localStorage`. Profiles without a key (local servers) are saved in full. **No cookies:** a cookie is sent to the page's host on every request, so an OpenRouter key would reach GitHub Pages and anything in between. Settings never appear in the tray copy, exports or topic files. |
| 56 | Conversation history | **One thread per topic in `localStorage`** (`loom-ai-thread:<topicId>`), with **New chat** to start over. (1) On Send, the tray's entries become **chips on that message** and the tray clears; old chips still show on the page and turn stale like tray entries. (2) The thread stores what was written, the pointers and the replies, **not source snapshots**: each request resolves every pointer in the thread against the **current** buffers (unsaved edits included) and sends those statements once in a "current source" block. (3) A proposed edit stays in the thread as a card marked **Applied / Rejected / Pending**; only that one-line outcome goes back to the model. (4) The system prompt and the current source block are always sent; older turns are dropped oldest-first once the profile's token budget runs out (default ~24k tokens, estimated as characters ÷ 4), with an "earlier messages not sent" marker. (5) Viewer works the same, without edit cards. Not included: several threads per topic, history search, thread export. |
| 57 | Reaching the endpoint | **Pure frontend with diagnostics.** **Test connection** calls `GET {base}/models`, fills the model picker, and sorts a failure into CORS/network, mixed content, 401/403 key, 404 wrong base path (e.g. missing `/v1`) or no models, each with a fix hint worded per **preset**: Ollama (`OLLAMA_ORIGINS`), LM Studio (Enable CORS), llama.cpp, OpenRouter, OpenAI, Custom. When `/models` is not supported the model name is typed in. No dev proxy. The client is plain `fetch` with its own SSE parsing (no `openai` package), tolerant of near-compatible servers (missing `usage`, odd `data:` framing), and retries once with `stream: false` if streaming fails. |
| 58 | Edit format | **Statement-level `oui-edit` blocks.** The model writes fenced blocks `` ```oui-edit file=sections/quiz-basics.oui `` holding whole statements (`q2 = QuizQuestion(…)`). A statement whose name exists is **replaced**; a new name is **added** after the last statement the block touched (or at the end); `q7 = DELETE` **removes** it; `file=sections/new.oui mode=create` **creates a file**, together with a `topic.oui` change. Statements are found by name with `indexStatementLines`, so wrong line numbers do not matter. Each block is one hunk in the diff. A block naming a statement that does not exist and does not look new fails and is sent back with the validation retry. A prop-level pick (`#q2.explanation`) still gets the whole `q2` statement back. |
| 59 | What the prompt contains | **A short assistant prompt built per request, plus an opt-in Full reference.** (1) Core OUI syntax rules and the `oui-edit` format (left out in Viewer), ~1.5k tokens. (2) Reference entries (props, `fields` descriptions, an example) only for the component types in the current source block, plus their usual children (`Quiz` brings `QuizQuestion`). (3) A **topic outline**: `topic.oui`'s section list; for each file in context one line per statement (name and type); every component name with a one-line summary. (4) The **current diagnostics** for the files in context. Statement-level picks send the picked statements plus the statements they reference by name, one level deep; a whole-section pick (`#root`) sends the whole file. The profile's **Full reference** switch sends the full authoring prompt instead of (2). Built by `composition/oui/assistant-prompt.ts` from the same sources as `authoring-prompt.ts`, so it cannot drift from the published prompt. |
| 60 | Where it appears | **The tray becomes the input box.** **Send to AI** sits next to **Copy**; both use the same draft, and Copy stays the main route for big changes. Replies show in an **Assistant panel**: a resizable right drawer over the preview in Studio, a drawer on the same side in Viewer. Sending with no picks is a plain message with the outline as context. With no active profile, Send opens connection settings (gear in the panel header); a profile/model menu in the header switches per message. `Ctrl/Cmd+Enter` sends; `Esc` or **Stop** stops a streaming reply, which stays marked "(stopped)". The **Send to AI** button is always visible; the panel stays hidden until a profile exists. On phones (≤640px) the decision 53 sheet gets **Picks · Chat** tabs, the folded bar reads "3 picked · Send · Copy", and a reply arriving while folded puts a dot on the bar. Studio edit cards show the hunks with **Apply**, **Reject**, **Apply all** and **Show in code** (decision 46's reveal). |
| 61 | Safety of output and content | **Sanitized markdown.** Replies render as markdown with **no raw HTML and no images** (an image URL can leak topic source and comments when it loads); links show their full URL and open in a new tab with `rel="noopener noreferrer"`; code blocks are highlighted; `oui-edit` blocks become edit cards and never run. Topic source and diagnostics are wrapped in tags and marked as **data, not instructions** in the system prompt. The first send through a **remote** profile shows a one-time notice naming the host that receives the picks, comments and source; `localhost` / `127.0.0.1` skip it. Every reply carries a small "via `<host>` · `<model>`" label. |
| 63 | Follow-ups and prompt caching | **A message box in the panel, and a request laid out as a stable prefix.** (1) The Assistant panel has its own message box at its foot (Enter sends, Shift+Enter is a new line, Stop while a reply streams), so a conversation goes on without the tray; whatever the Pick tray holds goes with the next message as chips, and the tray then clears. On wide screens the tray no longer shows a message box while the panel is open (it hides when empty); on phones the tray's message bar under the sheet stays the message box. **Send to AI** in the tray still works. (2) Revises decisions 56 and 59 for caching: the **system prompt is the same for the whole conversation** (role, rules, syntax, component index; no topic context and no per-request reference entries). The `<topic-context>` block moves into the **user turn** it was sent with and is **stored with that message**, so every later request repeats the earlier turns byte for byte and OpenAI-compatible servers with prefix caching (OpenAI, DeepSeek, OpenRouter providers with implicit caching, llama.cpp, Ollama and LM Studio keeping their KV cache) reuse it. (3) A new block carries only what the blocks still in the history do not: the outline when it changed, picked statements that are new or changed (a whole file once, until it changes), reference entries for components not yet described, and the errors when they changed ("None." once they are gone). A follow-up about nothing new carries no block at all. (4) Over the token budget the history is cut **in one step, down to half the budget**, and the thread keeps where it starts (`start`), so the prefix stays the same for the following requests instead of shifting one turn each time. Retry builds the last message's block again. |
| 64 | One message bar | **The Pick tray and the panel's message box become one bar at the bottom** (revises decisions 53, 60 and part of 63). (1) **⌖ Pick sits in the bar**, like an attach button (P still toggles it); the header Pick button is gone. (2) Each pick is a **chip**; a tapped chip opens an editor above the chips with the full pointer, a comment box, Show on page, Wider and Remove. (3) **Comment/Ask goes**: a pick with a comment is a comment, the typed text is the message; the old Ask mode is **Answer only** in the ⋯ menu, which also holds **Copy for agent** and **Clear**. (4) With an assistant the main button is **Send** (Enter; Shift+Enter is a new line), **Stop** while a reply streams; without one it is **Copy**, and the typed text goes after the pointers in the copy. (5) Placement: the bar always shows while a topic is open, floating at the bottom centre of the page (in Studio, of the preview pane, so the code stays clear); with the Assistant panel open on a wide screen it **docks at the foot of the panel**; on phones it is a full-width bar and the chat is a sheet above it (no Picks/Chat tabs, no separate tray sheet). (6) The saved tray (`loom-pick-tray:<topicId>`) keeps its shape: `question` holds the bar's text and `mode: ask` is Answer only. |
| 119 | Viewer's assistant is a learner's tutor | **Viewer talks to a learner about the subject, not the code** (revises 54, 59 and the Viewer half of 56). (1) The role says the person is a learner; answers name places by what they show and what they are in the lesson (from the reference entries), not by file, statement or prop, unless asked or an error needs fixing. (2) Answers may use the model's own knowledge, marked apart from the topic ("In the topic: …" / "Beyond the topic: …"), and say so when the two disagree. (3) Questions with an answer to find (quiz, reflection, scenario, decision tree) get a hint first. (4) It answers in the language of the question. (5) No change proposals and no comment semantics: every pick is something the learner asks about (`About these places`). Errors are explained with how to fix them (file, statement, corrected statement). (6) No authoring rules, no component index and no Full reference: a short guide to reading the source, plus the reference entries for the components in the context. (7) The context carries **On Screen**: Read or Present mode and the section in view, whose file goes whole, so "explain this" works without a pick. Studio is unchanged. |
| 62 | Rollout and scope | **Phased**, each green on `typecheck` + `test` (below). E2E in Playwright against a **mock OpenAI-compatible server** fixture (canned `/models` and streaming `/chat/completions`), plus one manual check against a real Ollama. **Out of scope:** tool calling and agent loops, several threads per topic, an assistant for learners in the main app or embeds (as decision 47), and non-OpenAI APIs (e.g. Anthropic-native). |

## Rollout Phases

1. **Connection:** profiles and key storage (55), `fetch` + SSE client with the non-streaming
   fallback, Test connection with failure classes and preset hints (57), settings dialog. Unit
   tests against a mocked `fetch`: SSE framing quirks, `/models` 404, bad key.
2. **Answer-only chat in Viewer and Studio:** thread store and token budget (56), assistant
   prompt builder with outline and selected reference entries (59), Send to AI in the tray and
   the Assistant panel (60), sanitized renderer and remote notice (61), phone tabs.
3. **Studio edits:** `oui-edit` parser and statement-level apply on `indexStatementLines` (58),
   edit cards, diff in the editor buffer, Apply / Reject, the single validation retry (54).
4. **Docs:** `AGENTS.md`, the Create page (`composition/oui/llm-guide.ts`, local-server setup
   hints; the page's **Your own model** tab was later removed, decision 40 in
   grill-log-openui-input.md), and `npm run oui:schema` if `authoring-prompt.ts` changes.

## Phase 1 — Implementation Notes

| Piece | Location |
|---|---|
| Profiles, key storage (`loom-ai-profiles`, `loom-ai-key:<id>` in sessionStorage or localStorage), `connectionOf`, header parsing | `src/core/supporting/authoring-editor/assistant/profiles.ts` |
| Client: `listModels`, `testConnection`, `chatCompletion` (plain `fetch`, `SSEDecoder`, one retry with `stream: false`), failure kinds (`invalid-url`, `mixed-content`, `network`, `auth`, `not-found`, `no-models`, `bad-response`, `http`, `aborted`) | `assistant/client.ts` |
| Presets and fix hints (`failureHint`) | `assistant/presets.ts` |
| Settings dialog | `assistant/AssistantSettingsDialog.tsx`, `assistant.css` |
| Mock OpenAI-compatible server (`--no-cors` mimics a server that refuses the page) | `tests/e2e/fixtures/mock-openai-server.mjs` |

- Plain http from an https page (the published site) is refused before anything is sent (`mixed-content`) when the host is a public IP literal. Local-network IP literals (the spec's "local" space: 10/8, 100.64/10 carrier-grade NAT and Tailscale, 172.16/12, 192.168/16, 169.254/16, fc00::/7, fe80::/10, fec0::/10), `.local` names and other host names (e.g. Tailscale MagicDNS) go through. Those requests carry `targetAddressSpace: "local"`, so Chrome's Local Network Access asks the person for permission instead of blocking them as mixed content (and fails a name that resolves to a public address; https and loopback targets are never marked, since marking them would fail them); when such a request fails anyway the error is `local-network`, whose hint names the permission, the browsers that do not have it, and the server's own network and CORS settings. Browsers report every other unreachable case as the same `TypeError`, so `network` hints list the likely causes per preset.
- Tests: `tests/unit/core/supporting/authoring-editor/assistant/{client,profiles,settings-dialog}.test.*`. Checked in Chromium against the mock: streaming, Stop, a server without CORS, a refused key and a wrong path.

## Phase 2 — Implementation Notes

| Piece | Location |
|---|---|
| Assistant system prompt: role and answer rules per app, syntax rules, reference entries for the components in context and everything their signatures can contain (`componentClosure`), a one-line index of every component, Full reference | `src/core/learning-engine/composition/oui/assistant-prompt.ts` (`promptDescription` is now exported from `library.ts`) |
| `<topic-context>`: outline, current source of the picked statements (plus their one-level references; `#root` sends the file), current errors; `fileStatements` uses the editor's scanner | `assistant/context.ts` |
| Thread: messages with pick chips, `loom-ai-thread:<topicId>`, `userMessageContent`, `historyForRequest` (token budget, starts with a user turn), `threadPointers` | `assistant/thread.ts` |
| `useAssistant`: profile, thread, request in flight, Stop / Esc, Retry, New chat, the remote notice (`loom-ai-remote-ok:<profileId>`), model list | `assistant/useAssistant.ts` |
| Panel (`AssistantDock`), header button (`AssistantToggle`), `pickBridgeOf` | `assistant/AssistantPanel.tsx` |
| Reply renderer: `marked` tokens to React elements, no `innerHTML`; openui-lang blocks highlighted with the scanner | `assistant/AssistantMarkdown.tsx` |
| Tray: Send to AI, message box while the panel is open, Ctrl/Cmd+Enter, Chat button with a new-reply dot, phone message bar; the tray centres left of the drawer (`--ai-panel-width`) | `pick/PickMode.tsx` (`PickAssistantBridge`, `PickSendDraft`), `pick/pick.css` |
| Wiring: Viewer passes its files, errors and source note; Studio passes `exportFiles()` (unsaved buffers), each section's diagnostics with fix hints, and the unsaved set | `src/viewer/ViewerApp.tsx`, `src/studio/components/StudioWorkspace.tsx` |

- The system prompt for a quiz pick is about 8 KB (~2k tokens), against 47 KB for the authoring prompt. The topic context goes at the end of the one system message (several local chat templates reject a second system message).
- In comment mode the tray's message is sent after the picks; in Ask mode the message says it is a question. Copy still copies exactly what it did before.
- Phones: the open chat is a sheet above the tray, which becomes a one-line message bar; its "N picked" button is the Picks tab and turns Pick mode on.
- Code blocks in replies are highlighted only when they are openui-lang (`oui` or unlabelled `name = Component(`); other languages show as plain monospace.
- Tests: `tests/unit/core/learning-engine/composition/oui/assistant-prompt.test.ts`; `assistant/{context,thread,markdown,assistant-dock}.test.*` (send and clear, remote notice accepted and declined, no profile, failure and Retry); `tests/e2e/assistant.spec.ts` against the mock server (Viewer: pick, send, follow-up, thread after reload; Studio: the request carries unsaved edits). The existing Studio e2e tests still pass.

## Phase 3 — Implementation Notes

| Piece | Location |
|---|---|
| `oui-edit` blocks: `parseEditBlocks` (same `marked` walk as the renderer, so block n is card n; paths like `kafka/sections/x.oui` are normalised), `applyEditBlock` (replace / add after the last touched statement / `DELETE` / `mode=create`), `applyOrder` (new files, sections, then topic.oui), `checkProposal` (dry run + validation, ignoring errors the file already had), `diffLines` | `assistant/edits.ts` |
| Studio rules in the prompt ("Proposing Changes": the block format, whole statements only, new sections with a topic.oui block) | `composition/oui/assistant-prompt.ts` |
| After each reply in Studio: parse, dry-run, store per-block state (`edits`) and `problems`; when there are problems, a user message marked `auto` sends them back once (`retryMessage`) | `assistant/useAssistant.ts` (`AssistantEditor`, `applyEdit`, `applyAllEdits`, `rejectEdit`, `showEdit`) |
| History: each block goes back as `[Proposed edit to <file>: applied / rejected / pending / failed: …]` | `assistant/thread.ts` |
| Edit cards (diff against the current buffer, Apply, Reject, Show in code; Show proposal once decided) and the proposal bar (Apply all, dry-run result) | `assistant/AssistantEdits.tsx`; `AssistantMarkdown` renders `oui-edit` blocks through `renderEdit` |
| Studio's editor: section blocks go to `setSource`, new sections to `insertSection`, topic.oui to `updateMetadata` + `setSectionOrder`; Show in code selects the section and flashes the statement | `src/studio/components/StudioWorkspace.tsx`; `TopicWorkspace.insertSection` / `setSectionOrder` (buffered, written by Save) |

- **Deviation from decision 54:** the diff is shown in the edit card, not inline in the code editor. Apply puts the new text in the buffer (marked unsaved, with the usual diagnostics and preview) and Show in code flashes the statement there; Save writes the files.
- **Deviation from decision 58:** a statement name that does not exist in the file is always added; there is no "does not look new" check. Wrong additions show up in the dry run when they break references; an added statement nothing references is only a warning, as when typed by hand.
- Removing a section from topic.oui is refused when applied ("Remove sections with Delete in the section list"): Delete stays the one way to remove files. Blocks can be applied even when the dry run found problems; the card and the bar say what is wrong.
- In Viewer, `oui-edit` blocks (which its prompt never asks for) render as highlighted code.
- Tests: `assistant/edits.test.ts`; Studio cases in `assistant-dock.test.tsx` (apply, reject, the automatic retry and what it sends); `thread.test.ts` (edit outcomes in the history); `workspace.test.ts` (buffered insert and reorder); `tests/e2e/assistant.spec.ts` (an applied edit is saved; Apply all adds a section and its SectionRef, written on Save).

## Phase 4 — Implementation Notes

> Superseded: the Create page now covers only the Loom skill (decision 40 in [grill-log-openui-input.md](grill-log-openui-input.md)); the **Your own model** tab, `MODEL_SERVERS`, `LOCAL_MODEL_NOTE` and their tests were removed.

| Piece | Location |
|---|---|
| Server setup wording for the Create page (`MODEL_SERVERS`: steps worded with the page's origin, start commands; `LOCAL_MODEL_NOTE` on https pages and network addresses) | `composition/oui/llm-guide.ts` |
| **Your own model** tab (`?ai=model`): start a model (Ollama, LM Studio, llama.cpp, OpenRouter), connect Viewer or Studio, pick and ask, apply edits in Studio | `src/create/CreateApp.tsx` (`ModelGuide`), `create.css` |
| README feature line; AGENTS.md section on the assistant | `README.md`, `AGENTS.md` |

- The authoring prompt and the skill did not change, so `npm run oui:schema` rewrites the published files unchanged (checked). The assistant's own prompt is built at runtime and is not published.
- Tests: `tests/unit/create/create.test.tsx` (the tab, the Ollama command with this origin, switching servers, and `MODEL_SERVERS` base URLs and keys matching the assistant presets).

## Decision 63 — Implementation Notes

| Piece | Location |
|---|---|
| Panel message box (`Composer`: draft kept per topic in sessionStorage, `loom-ai-draft:<topicId>`), Stop in the box while streaming | `assistant/AssistantPanel.tsx`, `assistant.css` |
| The tray registers its draft with the assistant (`connectTray`, `AssistantTray`); `sendMessage` sends the panel's text with the tray's picks | `pick/PickMode.tsx`, `assistant/useAssistant.ts` |
| `buildTopicContext(context, pointers, { known, reference })`: keys per part sent (`outline:`, `src:<file>#<name>:`, `file:<file>:`, `errors:`, `component:`), `textHash` | `assistant/context.ts` |
| Messages keep `context` and `sent`; the thread keeps `start`; `historyStart` (cut to half the budget), `historyMessages`, `knownContext` | `assistant/thread.ts` |
| Stable system prompt; `componentEntries` for the reference entries the topic context carries | `composition/oui/assistant-prompt.ts` |

- The data rule in the system prompt says each block carries only what is new or changed, and that a later version of a statement replaces an earlier one.
- Threads saved before this change still load: their user messages have no stored block, and the next request only adds one to the new message.
- Tests: `context.test.ts` (known parts left out, changed statements resent, errors gone), `thread.test.ts` (`historyStart`, stored context), `assistant-dock.test.tsx` (panel message box with tray picks, follow-up repeats the first turns unchanged); `tests/e2e/assistant.spec.ts` uses the panel's message box and checks the unchanged prefix. The mock server's echo leaves out the topic context block.

## Decision 64 — Implementation Notes

| Piece | Location |
|---|---|
| The bar: ⌖, chips and chip editor, text box, ⋯ menu (Copy for agent, Answer only, Clear), Send / Stop / Copy; `--pick-bar-height`; `over` (Studio passes `.studio-preview-pane`) | `pick/PickMode.tsx`, `pick/pick.css` |
| `PickAssistantBridge.stop`; the panel's own message box, its sessionStorage draft and the phone tabs are removed; the panel ends where the bar starts | `assistant/AssistantPanel.tsx`, `assistant/useAssistant.ts`, `assistant.css` |
| `pickReport({ message })`: the bar's text after the pointers when copying without Answer only | `composition/oui/pick-report.ts`, `pick/tray.ts` |
| Header Pick buttons removed | `src/viewer/ViewerApp.tsx`, `src/studio/components/StudioWorkspace.tsx` |
| Modals sit above the bar and the panel (`z-[1100]`) | `src/core/ui-system/UIComponentRegistryContract.tsx` |

- **Studio on phones (≤640px):** the header is one row (topic title, AI, Save, ⋯); the ⋯ menu holds the app switcher, theme, Import, Export file, Export zip, Refresh and Open folder. A **Sections · Edit · Preview** switch shows one pane at a time (`data-pane` on `.studio-body`); choosing a section shows its preview, Topic settings shows its form, and ⌖ brings up the preview. The panes end where the message bar starts. Desktop is unchanged (`src/studio/components/StudioWorkspace.tsx`, `src/studio/studio.css`; test in `tests/unit/studio/studio.test.tsx`).
- Tests: `pick/message-bar.test.tsx` (⌖, Copy with Enter, Send with Answer only and a comment, Stop), `pick-report.test.ts` (message), Viewer and Studio pick tests on chips and the chip editor, `assistant-dock.test.tsx` and `tests/e2e/assistant.spec.ts` on the bar's text box.

## Decision 119 — Implementation Notes

| Piece | Location |
|---|---|
| Viewer role, answer rules and `VIEWER_SOURCE_RULES`; no index or Full reference for Viewer; `firstSentence` reads past "e.g." (the index cut `Event` mid-sentence) | `composition/oui/assistant-prompt.ts` |
| `AssistantTopicContext.view` (`AssistantView`): the **On Screen** part (key `view:`) and the section in view sent whole | `assistant/context.ts` |
| `userMessageContent(message, app)`: Viewer picks are `About these places`, no "do not propose changes" line; `historyMessages(…, app)` | `assistant/thread.ts`, `assistant/useAssistant.ts` |
| `viewOf(topic, mode, presentedIndex)`: Present's section, or Read's section in view | `src/viewer/ViewerApp.tsx` |

- Tests: `assistant-prompt.test.ts` (Viewer prompt, `firstSentence`), `context.test.ts` (On Screen sent once, resent when the view moves), `thread.test.ts` (Viewer picks), `assistant-dock.test.tsx`, `tests/e2e/assistant.spec.ts` (Viewer request).

## Content Tools and Thinking in Viewer — Decisions

The tutor (decision 119) only saw what was picked and the section on screen, so it could not
say where else the topic covers something, or answer "how does this relate to what I read
before?". These decisions give it two tools to look through the topic itself. They revise
decision 54 ("no tool calling") for Viewer.

| # | Question | Decision |
|---|---|---|
| 120 | How tools are called | **Native OpenAI tool calling, switch per profile** (revises 54 for Viewer). Requests carry `tools`; replies' `tool_calls` (streamed deltas or a whole message) are run in the page and answered with `role: "tool"` messages. The profile's **Look up topic content** switch is on by default. If the server rejects a request with tools (400 or 422 before any text), it is sent again without them and the switch turns off for that profile. With the switch off, the assistant works as before (decision 119). |
| 121 | `navigate` | **A tree, one level at a time.** `navigate()` lists the topic's sections in order: address, type, title and a short summary. `navigate(address)` lists the parts inside that place (questions, steps, cards, choices…), each with its address, type and a one-line summary, plus the section's narration script when it has one. |
| 122 | `read` | **Readable content, not source.** `read(address)` returns the place as labelled plain text built from its props (labels are the prop names), so the model needs no syntax knowledge. Small children are written out inline; larger ones (anything that contains parts of its own) are listed as parts with their addresses, so `read(section)` is a summary and `read(part)` gives the details. Each result is capped at about 2k tokens (8,000 characters) and ends with "truncated; read the parts" when cut. `source: true` returns the statement (or the whole file for a section) as written, for fixing errors. A section that does not compile returns its errors and its source. Correct answers and explanations are included; the prompt's hint-first rule decides what the learner sees. |
| 123 | Addresses | **Pick pointers**: `sections/quiz.oui #q2`, `sections/quiz.oui #q2.choices[1]`; a file alone means its root. Picks, the topic context, tool results and "Show on page" all use the same address. The model keeps them out of its answers (decision 119). Tools accept small slips (no `sections/`, no `.oui`). |
| 124 | Loop and history | **At most 6 tool rounds per learner message**; after the 6th the results say the limit is reached and the next request sets `tool_choice: "none"`. Each round (the calls, their results and any text the model wrote with them) is stored on the reply in the thread and sent unchanged later, so the prompt cache keeps working; the token budget trims old turns as before. Reading the same address again with an unchanged result returns "unchanged since your earlier read". With the switch off, stored rounds go to the model only as "[Looked at …]" lines in the reply. |
| 125 | What the learner sees | **A "Looked at" pill above the reply**: "Looking at <section>…" with a spinner while the model looks, then "Looked at N places". Opened, it lists the places as a small timeline, one row per call: an icon for the tool, the section title, and the part below it in muted text (`Knowledge Check` / `A logged-in dashboard…`). Clicking a row scrolls to it in Read mode, like a pick chip. |
| 126 | Scope | **The open topic's sections and their narration scripts** (`sections/<name>.narrate.oui`). Not other topics in the same archive, and not Studio yet (the tools live in the shared `assistant/` module so Studio can switch them on in a later decision). |
| 127 | What each message sends up front | **With the tools on: the picks and where the learner is, the rest on demand.** The picked statements are still sent, and the On Screen line names the section in view by address and title, but its whole file is no longer sent; the model reads it when it needs it. With the tools off, the section in view goes whole as in decision 119. The outline now gives each section's title, so even without tools the model can name where the topic covers something. The Viewer prompt also gains a length rule (brief by default, deeper with examples or analogies when asked) and a **Going further** rule: point at the topic's own sections by title, offer one or two directions to explore next, and never invent links or sources. |
| 128 | The model's thinking | **Shown in the activity pill, never sent back.** Reasoning arrives in a `reasoning_content` field (llama.cpp, LM Studio, DeepSeek, vLLM), a `reasoning` field (Ollama, OpenRouter), or as a `<think>…</think>` block at the start of the text, which the client splits off (tags cut across chunks are held back until whole). It streams into the pill with decision 125's lookups: "Thinking…" with a one-line preview of the newest thought, then "Thought for 8s · Looked at 2 places"; opened, the timeline shows each round's thinking before its calls, and the final thinking last. It is kept in the thread for the panel (each round's and the reply's, cut at 20,000 characters) but left out of every request: some servers reject reasoning in input messages, and it would only spend tokens. Studio shows it the same way. |

## Decisions 120–127 — Implementation Notes

| Piece | Location |
|---|---|
| `parseOUIElements`: the evaluated element tree of any `.oui` file (Loom or standard OpenUI) | `composition/oui/compile.ts` |
| `indexElements` (anchors as the source map gives them, `#root` always), `partsOf`, `summaryOf`, `renderElement` (leaf parts inline, larger parts as `→ <address>`), drawings described by their labels and shape IDs, `capResult` (8,000 characters), `sectionTitle` | `composition/oui/content-tree.ts` |
| `CONTENT_TOOLS` (`navigate`, `read`), `parseAddress` (takes slips), `ContentToolRunner` (outline, parts, readable content, `source: true`, files that do not compile, narration scripts) | `assistant/content-tools.ts` |
| `tools` / `tool_choice` in the request; `ToolCallCollector` assembles streamed or whole tool calls (missing `index`, `id`, object arguments) | `assistant/client.ts` |
| `ToolStep` / `ToolStepCall` on replies (`steps`), saved and loaded; `historyMessages(…, { app, tools })` sends them as tool messages, or as "[Looked at …]" lines without tools; `toolStepMessages` | `assistant/thread.ts` |
| The loop: up to `MAX_TOOL_ROUNDS` (6), then `tool_choice: "none"`; repeated calls with an unchanged result answered briefly; a 400/422 with tools is sent again without them, and the profile's switch turns off once that works | `assistant/useAssistant.ts` |
| Profile switch `tools` (on by default), **Look up topic content** in the settings | `assistant/profiles.ts`, `assistant/AssistantSettingsDialog.tsx` |
| "Looked at" lines above a reply, click to show on page | `assistant/AssistantPanel.tsx`, `assistant.css` |
| Viewer prompt: **Looking Things Up** (with the tools), **Going Further**, the length rule; outline titles; `wholeView` in the topic context | `composition/oui/assistant-prompt.ts`, `assistant/context.ts` |

- The mock server in `tests/e2e/fixtures/` calls a tool for `TOOL<<name {args}>>` in the last user message (streamed in two pieces) and answers with the result's first line.
- Tests: `content-tree.test.ts`, `content-tools.test.ts`, `client.test.ts` (tool calls streamed and whole, body), `thread.test.ts` (rounds in history, saved), `assistant-dock.test.tsx` (the loop, the round limit, the fallback), `assistant-prompt.test.ts`, `tests/e2e/assistant.spec.ts` (Viewer tool round, "Looked at" line shows the place).

## Decision 128 — Implementation Notes

| Piece | Location |
|---|---|
| `readChoice` reads `reasoning_content` / `reasoning`; `ThinkSplitter` splits a leading `<think>` block; `AnswerCollector` serves the streamed, whole and mislabelled-SSE paths; `onReasoning`, `ChatResult.reasoning` | `assistant/client.ts` |
| `ToolStep.thinking`, `ThreadMessage.thinking` and `thoughtMs`, `clipThinking` (20,000 characters); never in `historyMessages` | `assistant/thread.ts` |
| Thinking streams into the reply, moves into the round when the model calls tools; time from a round's first reasoning to its first text or its end | `assistant/useAssistant.ts` |
| `Activity` (was `LookedAt`): the pill's live states, the preview line, thought rows with auto-scrolling text | `assistant/AssistantPanel.tsx`, `assistant.css` |

- Tests: `client.test.ts` (both fields, `<think>` cut across chunks, whole answers, text that only mentions the tag), `thread.test.ts` (kept, not sent), `assistant-dock.test.tsx` (pill, opened thought, follow-up without it).

## Tools, Multi-Section Edits and Planning in Studio — Decisions

Studio's assistant sees only the picks and the outline, and proposes changes as `oui-edit`
blocks checked once after the whole reply (decisions 54, 58). A change spanning several
sections needs a large reply, and a mistake gets one automatic retry. These decisions bring the
content tools to Studio (decision 126's "later decision"), add edit tools that change one file
per call, stage what they change for review, and let the assistant help plan a topic. They
revise decisions 54 and 58 for Studio.

| # | Question | Decision |
|---|---|---|
| 129 | Content tools in Studio | **`navigate` and `read` as in Viewer, over the unsaved buffers plus the staged changeset (decision 133).** Same profile switch (**Look up topic content**) and the same 400/422 fallback (decision 120). In Studio `read` returns the **source** by default (`source: false` gives the readable text), since the model edits source. The section open in the editor is named in the On Screen line rather than sent whole (as decision 127). |
| 130 | `edit_section` | **One file per call, statement-level.** `edit_section({ file, statements?, delete?, summary })`: `statements` holds whole statements; a name that exists is replaced, a new one is added after the last statement the call touched (decision 58's rules); `delete` lists names to remove; `summary` is one line for the card. `file` is a section (`sections/<name>.oui`) or its narration script (`sections/<name>.narrate.oui`, created when missing; steps use the section type's `BEAT_IDS`). Changes to several sections are several calls. |
| 131 | `create_section` and `edit_topic` | **`create_section({ name, title?, source, after? })`** stages a new file and its `SectionRef` in `topic.oui` (after the named section, or at the end). **`edit_topic({ title?, category?, description?, tags? })`** stages a change to the topic's metadata. Removing and reordering sections stay in the section list (Delete is the one way to remove files, as in Phase 3). |
| 132 | Feedback inside the loop | **Each edit call is dry-run and validated at once, and the result is the verdict:** "Staged, no new errors" or the new diagnostics with fix hints (errors the file already had are left out, as `checkProposal`). The model fixes its own mistakes in the following rounds; this replaces the single automatic retry (decision 54) when the tools are on. |
| 133 | Where edits land | **A staged changeset, not the buffers.** Edit calls write to a staged layer over the buffers; later `navigate`/`read` calls see it, so changes across sections stay consistent within a turn and across turns. The panel shows **one card per file** (diff against the buffer, the call's `summary`) with **a checkbox per changed statement** (replaced, added, deleted), **Apply** (ticked statements), **Reject**, **Show in code**; a changeset bar holds **Apply all** / **Reject all**. Applying moves the text into the buffers (unsaved, usual diagnostics and preview); Save writes the files. |
| 134 | Typing while changes are staged | **Re-based by statement.** When the author edits a buffer that has staged changes, the staged statements are applied again by name onto the new buffer. A statement the author also changed is marked **conflict** on the card, showing both versions, and is not applied with Apply all. |
| 135 | How long staged changes live | **With the thread** (`loom-ai-thread:<topicId>`, localStorage): a reload keeps the pending cards. **New chat** or **Reject all** clears them. In history each call goes back as its tool result, and the author's later decision as a one-line outcome (`[Staged edit to <file>: applied 3 of 4 / rejected / conflict]`), as decision 56(3). |
| 136 | Round limit in Studio | **16 rounds per message** (Viewer keeps 6). After the last round the results say the limit is reached and the next request sets `tool_choice: "none"` (decision 124). |
| 137 | `oui-edit` blocks | **Only without the tools.** With the tools on, the Studio prompt asks for tool calls and never for `oui-edit` blocks; with them off or refused, decisions 54 and 58 apply unchanged. |
| 138 | Brainstorming | **A Planning rule in the Studio prompt.** Before writing a new topic or a large change, the assistant asks who the learners are and what they should be able to do afterwards, then suggests contents: sections spread across the interactive types (no walls of `text`), assessments that test only what an earlier section teaches, narration where Present mode helps. It may suggest ideas, examples and angles from its own knowledge. It does not stage edits until the author agrees to a plan. Questions to the author are asked in the reply and end the turn (no ask tool). |
| 139 | Plan card | **`propose_plan({ goal, items: [{ action: create \| edit, file?, name?, type, title, idea }] })`** ends the round with a card listing the items, each with a checkbox, and **Build these**. The tool result is "Shown to the author". Build these sends **one message** with the ticked items; the model creates and edits them with the tools in that turn (round limit 136), and everything lands in the staged changeset. A plan can be revised by asking in chat, which proposes a new card; the old one turns stale. |
| 140 | Web search | **Tavily, called from the browser when the author gives a key, in Studio and Viewer** (revises decision 62's "no tool calling" scope again; still no backend). Two tools join the content tools: **`web_search({ query, max_results? })`** (title, URL, snippet per result; `POST https://api.tavily.com/search`) and **`web_extract({ urls })`** (the readable text of up to 3 URLs, each capped like `read` at 8,000 characters; `POST /extract`). They are offered only when web search is on and a key is set, and count toward the round limit (124, 136). In Studio they feed research and brainstorming (138, 139); in Viewer they back "Beyond the topic" answers (119). |
| 141 | Tavily key and settings | **One key for all profiles.** A **Web search** section in the settings dialog: key, on/off, **Test** (a one-result search). The key is stored like profile keys (`loom-ai-tavily-key`, sessionStorage unless **Remember key on this device**) and never appears in the thread, exports or topic files. If the browser blocks the request (Tavily not allowing the page's origin), Test reports it as a CORS failure with that hint and web search stays off. The first search shows a one-time notice that queries go to `api.tavily.com`. |
| 142 | Web results in answers | **Data, cited.** Results are wrapped as data, not instructions, like topic source (decision 61): text in a fetched page never changes the assistant's rules. Every claim drawn from the web names its source as a link with its full URL (Viewer: under "Beyond the topic"); the activity pill lists searches and pages read like lookups (125), each row opening its URL in a new tab. In Studio, content written from a web source keeps the source in the reply, not in the `.oui` files, unless the author asks for it. |

## Decisions 129–137 — Implementation Notes

| Piece | Location |
|---|---|
| Changeset: `StagedFile` / `StagedChange` (statement `replace` / `add` / `delete`, `create`, topic `field`, `section`), `fileView` (re-based by statement name, conflicts, `only` for ticked statements), `stagedFiles`, `stagedContext`, `stageStatements`, `stageSection`, `stageTopic`, `newErrors`, `decide`, `applyRank`, `changesetNote`, `readChangeset` | `assistant/changeset.ts` |
| `EDIT_TOOLS` (`edit_section`, `create_section`, `edit_topic`, `describe_components`) and `EditToolRunner`, whose results are the dry run's verdict | `assistant/edit-tools.ts` |
| `STUDIO_CONTENT_TOOLS` (`read` gives source by default); `ContentToolRunner(context, sourceByDefault)` | `assistant/content-tools.ts` |
| The loop in Studio: content and edit tools, `MAX_STUDIO_TOOL_ROUNDS` (16), reads over `stagedContext`; `applyStagedFile`, `applyAllStaged`, `rejectStagedFile`, `rejectAllStaged`; the decision note on the next message | `assistant/useAssistant.ts` |
| `AssistantThread.staged`, `ThreadMessage.stagedNote` (sent after the topic context) | `assistant/thread.ts` |
| Staged cards (checkbox per change, conflict with both versions, Apply / Reject the ticked ones, Show in code) and the Apply all / Reject all bar, under the conversation; edit rows in the activity pill ("Staged 2 edits") | `assistant/StagedChanges.tsx`, `assistant/AssistantPanel.tsx`, `assistant.css` |
| Studio prompt with the tools: **Tools**, **Changing the Topic**, **Planning and Brainstorming** (no `oui-edit` rules); without them the old **Proposing Changes** | `composition/oui/assistant-prompt.ts` |

- **Deviation from decision 131:** `create_section` has no `title`; a section's title lives in its source. A new section and its `SectionRef` are applied and rejected together, because Studio's workspace lists a section as soon as its file exists; applying the file writes topic.oui with the `SectionRef` where the model put it.
- **Addition:** `describe_components(names)` returns the reference entries of components the model is about to write (and those they contain), since with the tools a request no longer carries entries only for picked source.
- The `<topic-context>` block is still built from the buffers (what the author sees and picks); the tools see the staged view. What the author decided goes with their next message as one note ("applied q1; rejected q2", plus what is still staged), marked reported so it is said once.
- `oui-edit` blocks a model writes even with the tools on still become edit cards; the single validation retry applies to them as before.
- Tests: `changeset.test.ts` (staging, re-basing, conflicts, ticked statements, new sections and metadata, the note, the runner's verdicts, Studio reads), `assistant-dock.test.tsx` (the Studio loop across two files, Apply and Reject all, the note on the next message; a new section applied in place after a reload; the `oui-edit` tests now run with the tools off), `tests/e2e/assistant.spec.ts` (an `edit_section` call staged, applied from its card and saved).

## Decisions 138–139 — Implementation Notes

| Piece | Location |
|---|---|
| **Planning and Brainstorming** rules in the Studio prompt with the tools (ask about learners and goal, suggest contents, spread over interactive types, grounded assessments, `propose_plan`, build on Build these) | `composition/oui/assistant-prompt.ts` |
| `PLAN_TOOL` (`propose_plan`), `readPlan`, `buildMessage` | `assistant/edit-tools.ts` |
| After a plan the next request sets `tool_choice: "none"`, so the model says a word and the turn ends; `buildPlan` sends the ticked items as one message and marks the card built (`ThreadMessage.planBuilt`) | `assistant/useAssistant.ts`, `assistant/thread.ts` |
| The card (checkbox per item, Build these / Build 1 of 2; Built or "Replaced by a newer plan"); "Proposed a plan" in the activity pill | `assistant/PlanCard.tsx`, `assistant/AssistantPanel.tsx`, `assistant.css` |

- Tests: `assistant-dock.test.tsx` (the plan card, `tool_choice: "none"` after it, Build with one item unticked, the card built).

## Decisions 140–142 — Implementation Notes

| Piece | Location |
|---|---|
| Tavily client (`tavilySearch`, `tavilyExtract`, `testWebSearch`; key as `Authorization: Bearer`), failure kinds (`network`, `auth`, `rate-limit`, `http`, `bad-response`) and hints, `WEB_TOOLS`, `runWebTool` (results wrapped in `<web-results>` with the data rule, pages capped at 8,000 characters, at most 3 URLs and 8 results), settings `loom-ai-web` and key `loom-ai-tavily-key` | `assistant/web-search.ts` |
| `loadStoredKey` / `saveStoredKey`, shared with the profile keys | `assistant/profiles.ts` |
| The web tools join the request when the profile's tools are on and web search has a key; tool calls now run one after another (`await`), so a web call can wait for Tavily | `assistant/useAssistant.ts` |
| **Web Search** rules per app (research, cite full URLs, never invent them; Viewer puts it under "Beyond the topic"; Studio keeps sources out of the files unless asked) | `composition/oui/assistant-prompt.ts` |
| Web search section in the settings (switch, key, Remember, Test with a CORS hint) | `assistant/AssistantSettingsDialog.tsx` |
| "Searched the web" in the activity pill; a page row is a link that opens in a new tab (`ToolStepCall.url`, `rel="noopener noreferrer"`) | `assistant/AssistantPanel.tsx`, `assistant/thread.ts` |

- **Deviation from decision 141:** the notice that queries go to `api.tavily.com` is in the settings, next to the switch that turns web search on, instead of a one-time dialog at the first search: a dialog in the middle of a tool round would hold the model's request open.
- Whether `api.tavily.com` accepts requests from the page's origin (CORS) is still unchecked from a browser; when it does not, Test says so and the tool results tell the model to answer without the web.
- Tests: `web-search.test.ts` (storage, the request, wrapping, extract caps and failed URLs, failures as text, Test), `settings-dialog.test.tsx` (switch, key, Test, saved; blocked request), `assistant-dock.test.tsx` (web tools offered with a key, a `web_extract` round, the link in the pill; left out without a key).

## Open Questions

- Whether `api.tavily.com` answers CORS preflights from GitHub Pages and localhost (see the notes on decisions 140–142).
