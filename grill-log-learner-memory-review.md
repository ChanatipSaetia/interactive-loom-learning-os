# Grill Log — Learner Memory & Review Journey

Status: **Proposed — not implemented yet (decisions 143–160)**

## Goal

Give a learner a reason and a smooth way to come back to what they learned, without a server.
Loom stays a static frontend (GitHub Pages, no backend): the learner's memory lives in their own
browser and, if they choose, in their own cloud storage (a synced folder or Google Drive). On top
of that memory, a short **review journey** brings back what is about to be forgotten, in the calm,
guided style of Present mode, instead of re-doing whole sections or playing the hex campaign.

## Baseline

- Progress is a single blob in `localStorage` (`loom:progress:v1`,
  `src/core/supporting/learner-progress/storage.ts`): per section `viewed`, `completed` and `data`.
  There is no history of when or how well anything was recalled, so nothing can be scheduled.
- The campaign keeps its own character state in `localStorage`
  (`gamification/adapters/local-storage-character-adapter.ts`).
- Memory is tied to one browser on one device and is lost when site data is cleared.
- **Learner feedback:** the hex campaign works as designed but feels like a drag (game overhead
  competes with the subject, re-reading is punished by Chaos, timers and resets add anxiety, hops
  back to the map break the topic's story). Present mode gives better focus. Reviewing by
  repeating sections is boring, and a game skin over it is not the answer.
- Present mode (decisions 65–118) already turns every section into beats with stable IDs
  (`BEAT_IDS` in `composition/oui/narration.ts`), and Pick pointers (`sections/quiz.oui #q2`) name
  every statement. Both are usable keys for "what to review".

## Decisions

Numbering continues from [grill-log-ai-assistant.md](grill-log-ai-assistant.md).

### Learner memory (storage without a server)

| # | Question | Decision |
|---|---|---|
| 143 | Server or not | **No server, ever, for learner memory.** The browser stores it; cloud sync goes straight from the browser to storage the learner owns. Nothing leaves the device until the learner connects a provider. |
| 144 | The port | **`LearnerMemoryPort`** in `src/core/supporting/learner-progress/` (`append(events)`, `readAll()`, `onChange(cb)`), like `OKFStoragePort` in `src/core/delivery/ports.ts`. Progress, review and (later) the campaign read through it; sections never know where data lives. |
| 145 | What is stored | **An append-only event log, not a state blob.** Each event: `{ id (uuid), t (ISO time), device, topic, item, kind, result?, ms? }`, with `kind` one of `seen`, `answered`, `graded`, `completed`, `suspended`. Progress and the review schedule are derived from the log and cached as a snapshot that can always be rebuilt. |
| 146 | Syncing devices | **One log file per device, merged by union** (dedupe by event `id`). No two devices write the same file, so a synced folder or Drive never sees write conflicts, and no merge logic beyond "concatenate and sort by time" is needed. |
| 147 | Default adapter | **IndexedDB**, with `navigator.storage.persist()` requested on first write. Replaces the direct `localStorage` calls in `storage.ts`. |
| 148 | Backup without sync | **Back up / Restore** in the settings: download the merged log as one `loom-memory.json`, restore by importing it (merged by union, so restoring twice is harmless). Works in every browser. |
| 149 | Synced folder adapter | **File System Access: the learner picks a folder**, Loom writes `loom-memory/events-<device>.jsonl` there and reads every `events-*.jsonl`. Put the folder inside Google Drive for desktop, Dropbox, OneDrive or iCloud and the provider syncs it, with no login and no OAuth app. Chrome and Edge on desktop only; the folder handle is kept in IndexedDB and permission is asked again when the browser drops it. Reuses Studio's folder-picking code. |
| 150 | Google Drive adapter | **Drive REST API from the page, `drive.appdata` scope**, token from Google Identity Services (token model, no backend). Files live in the app's hidden `appDataFolder`, invisible in the learner's Drive and unreadable by other apps. Needs one Google Cloud OAuth client for the GitHub Pages origin (and `localhost` for dev). The token lasts about an hour and is renewed silently when the Google session allows, else on the next sync. Works on mobile browsers. Dropbox (PKCE) or OneDrive (MSAL) can be added later behind the same port. |
| 151 | Migration | **Import `loom:progress:v1` once** as synthetic `seen` / `completed` events dated at migration time, then stop writing it. The campaign store stays in `localStorage` for now (out of scope). |
| 152 | Topic and item identity | **`topic`** is the topic folder name for published topics (`public/content/<topic>/`), else the opened file's base name (`kafka.loom.oui` → `kafka`). **`item`** is the section file plus the statement name, in Pick pointer form (`sections/quiz.oui#q2`), never the positional beat ID (`q2` in `BEAT_IDS` shifts when questions are reordered). Each item also stores a short hash of its content; when the hash changes, the item keeps its history but its next review is brought forward. |

### The review journey

| # | Question | Decision |
|---|---|---|
| 153 | What a review item is | **A recall unit taken from content the topic already has**; authors write nothing new. Quiz question → one item. Flashcard → one item (word → meaning). Reflection-sequence and reflection-template challenge → one item each. Flowchart → one "order the steps" item per journey. Scenario and decision tree → one item per fork ("what would you pick here, and why?"). Text, bullets, taxonomy, concept map and sandboxes add no items of their own. |
| 154 | When an item enters review | **When the learner has met it, in any mode.** Read and Recap answers log `answered` with the result. Present mode stays hands-free as it is (decision 101) and logs `seen` for the beats it plays; a seen item gets its first review the next day. This turns a passive Present session into active recall a day later, which is where Present's "feels understood" gap is closed. |
| 155 | Scheduling | **FSRS, in the browser**, target retention 0.9. Grades come from the answer where possible (wrong → Again; right and slow → Hard; right → Good; right and fast on a mature item → Easy); a self-grade only for flashcard-style "think, then reveal" items. Interleave topics in one session rather than drilling one topic. |
| 156 | Where review happens | **Two entry points, no separate "review chore".** (1) **Warm-up:** opening any topic in the learning app or Viewer first offers up to 3 due items (from any topic), about a minute, one tap to skip. (2) **Today:** a panel on the catalog page with a ~5-minute **Recap** of what is due. The campaign is not a review surface. |
| 157 | How a Recap plays | **Like Present mode, with a pause for the learner.** Each item is a short scene: the prompt beat → **"Your turn"** (answer the options, place the chips, or think and press `Space`) → the reveal with the topic's own explanation → the next item. Same stage, motion, narration and keyboard as Present; the voice reads prompts and explanations. One idea on screen at a time. |
| 158 | Keeping it from being boring | **Never the same question the same way twice in a row.** Options are shuffled; a flashcard alternates direction (word → meaning, meaning → word); a quiz item on its second review is asked **without options first** (recall, then pick); a well-known item climbs a ladder: recognise → recall → **apply** (the AI tutor asks a new situation built on the same idea, grounded in the topic) → **teach back** (the learner explains in a sentence or two, the tutor points out what was missed). The last two need a connected model profile and are skipped without one. |
| 159 | Load and guilt | **A daily cap (default 15 items) and no backlog.** Items beyond the cap are spread over the next days; there is no red overdue counter and no streak to lose. The catalog shows **what is kept** (an estimated retention per topic, as a fading ring on the topic card), not what is owed. The learner can suspend an item or a whole topic. |
| 160 | Linking to new learning | **Review rides on new learning when it can.** The warm-up for a topic prefers due items from topics with the same category or tags, and its first scene says so ("You met this in mTLS — it comes back here"). |

## The Review Journey, End to End

1. **Learn.** The learner watches a topic in Present (focus, no decisions) or works through it in
   Read. Every item they meet is logged: `seen` in Present, `answered` in Read.
2. **Next day: warm-up.** Opening any topic first plays 1–3 due items as Recap scenes. Present-only
   items get their first real recall here.
3. **Daily: Today.** Up to ~5 minutes of due items across topics, interleaved, in Present style
   with "Your turn" pauses. Capped, never piling up.
4. **Weeks later: deeper.** Items the learner knows well come back in harder forms: without
   options, as a new situation from the tutor, or as a short teach-back.
5. **Always: what is kept.** Topic cards show how much is still remembered; a fading ring is the
   cue to come back, not a debt counter.
6. **Anywhere.** The same memory follows the learner across devices through the synced folder or
   Drive, or moves by Back up / Restore.

## Phases

1. `LearnerMemoryPort`, IndexedDB adapter, event log, derived progress, migration from
   `loom:progress:v1`, Back up / Restore (decisions 143–148, 151–152).
2. Review items, FSRS scheduling, Recap player on the Present stage, warm-up and Today
   (decisions 153–157, 159).
3. Synced-folder adapter (decision 149).
4. Google Drive adapter (decision 150).
5. Variation ladder with the AI tutor and topic links (decisions 158, 160).

## Open Questions

- Two different topics opened from files with the same base name share a `topic` key
  (decision 152). Is a content hash of `topic.oui`'s title enough to tell them apart?
- FSRS library (`ts-fsrs`) or a small in-repo implementation?
- Should the hex campaign be kept, simplified (no Chaos for re-reading, no timers, no reset on
  defeat), or retired once Recap exists?
- Should Present mode get an optional "Your turn" setting outside Recap, or stay purely hands-free?
- Google OAuth client: who owns it, and does the app's consent screen need verification for
  `drive.appdata` at the expected number of users?
