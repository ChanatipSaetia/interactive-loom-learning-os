# Topic Authoring DX Improvements

Findings from walking through [creating-topics.md](../creating-topics.md) and
[creating-hexmaps.md](../creating-hexmaps.md) end-to-end by building the
`http-caching` example topic (intro → taxonomy-browser → quiz + hex map).

## Current Onboarding Path

A minimal topic takes 13 hand-written files across 5 locations:

| # | Step | Files | Doc |
|---|---|---|---|
| 1 | Topic bundle | `public/okf/<topic>/index.md`, `index.yaml` | `creating-topics.md` §1–2 |
| 2 | Sections | `sections/<name>/section.md` + data files | `docs/sections/<type>.md` |
| 3 | Validate | — | `npm run okf:validate -- --topic=<topic>` |
| 4 | Register | `public/okf/index.md` | `creating-topics.md` §4 |
| 5 | Hex map | `public/hexmaps/<topic>.yaml` | `creating-hexmaps.md` |

## Validator Coverage Gaps

Errors were deliberately injected into a scratch topic and run through
`npm run okf:validate`:

| Mistake | Caught? |
|---|---|
| Broken YAML | ✅ |
| `index.md` links a missing section | ✅ |
| Quiz question with two `correct: true` choices | ❌ |
| Unknown taxonomy `icon` (`NotARealIcon`) | ❌ — `icon: z.string()` |
| Unknown taxonomy `color` (`chartreuse`) | ❌ — `color: z.string()` |
| Intro `roadmap[].sectionId` pointing at a missing section | ❌ |
| Topic not registered in root `public/okf/index.md` | ❌ — validates clean, never appears in the app |
| Topic has no hex map | ❌ |
| Hex map with 1 track (docs require 2–4 from the capital) | ❌ |

A YAML syntax error in one file also stops reporting for the rest of that
section.

## Suggested Improvements (Priority Order)

### 1. Topic-level checks in the Validation Gateway

Add checks that run once per topic in `scripts/validate-okf.ts`:

- The topic folder exists but has no link in root `public/okf/index.md`.
  The browser discovers topics from that file (`composition/routes.tsx`),
  while the CLI scans the filesystem, so today the two can disagree silently.
- `public/hexmaps/<topic>.yaml` is missing.
- An intro `roadmap[].sectionId` does not match any section folder.

### 2. Tighten section schemas (Tier 2 / Tier 3)

- **Quiz:** exactly one `correct: true` per question (the rule already stated
  in `docs/sections/quiz.md`).
- **Colour:** `color` restricted to the Catppuccin Frappé accent names.
- **Icon:** `icon` checked against the lucide icon names the renderer
  supports, with a "did you mean" `fixHint`.

### 3. Scaffold command

```bash
npm run okf:new -- http-caching --category Architecture --sections intro,taxonomy-browser,quiz
```

It would generate the bundle folder, stub `section.md` + data files per
type, the root `index.md` registration line, and a starter hex map with
one node per section. It would then run `okf:validate`, so a new author
starts from a green state.

### 4. Single source of truth for topic category

The category is currently written in two places: under a `##` heading in
root `public/okf/index.md` and in `<topic>/index.yaml`. Keep it only in
`index.yaml` and generate the root listing from it, or have the validator
flag when the two disagree.

In the meantime, `public/index.yaml` is marked "auto-generated" but is
stale: labels equal IDs and most descriptions are empty. Either fix
`scripts/update-okf-manifest.js` or retire the fallback.

### 5. Validate the checkable hex-map authoring rules

Enforce 2–4 exploration tracks radiating from the capital and full section
coverage, both of which `creating-hexmaps.md` already requires. Assessment
grounding (quizzes test only what was taught) remains a human/AI review
concern.

### 6. JSON Schema for editor autocomplete

Generate JSON Schema from the co-located Zod `SectionSchema`s (e.g. with
`zod-to-json-schema`) and map it by filename pattern in
`.vscode/settings.json` (`yaml.schemas`). Authors then get autocomplete and
inline errors in plain YAML files, not only in the in-app editor.

### 7. Report all errors per section

After a Tier 1 syntax error in one file, still validate the section's
other files so authors can fix everything in one pass.

### 8. Quick-start doc

Add a one-page "first topic in 10 minutes" at the top of
`creating-topics.md` that links to the per-type references, instead of
making newcomers read the full ~470-line guide first.
