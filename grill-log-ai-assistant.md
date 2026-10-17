# Grill Log — AI Assistant for Pick in Studio and Viewer

Status: **Grilled, not implemented (phases 1–4 open)**

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
   hints), and `npm run oui:schema` if `authoring-prompt.ts` changes.

## Open Questions

_None._
