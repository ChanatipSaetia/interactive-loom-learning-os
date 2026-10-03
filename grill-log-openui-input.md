# Grill Log — OpenUI Spec as an Additional Input Source

Status: **Open — awaiting grilling session**

## Goal

Accept an **OpenUI spec** as another input source for Loom content, alongside the
existing OKF folders (`public/okf/<topic>/sections/<section>/` YAML/Markdown read by
`src/core/learning-engine/composition/okf/reader.ts`).

## Current Input Pipeline (baseline)

- **Storage port** `OKFStoragePort` (`src/core/delivery/ports.ts`) — `readSection`,
  `saveSection`, `listTopics`; implemented by `InRepoStorageAdapter`.
- **Runtime port** `OKFRuntimePort` — `loadTopicBundle`, `renderSection`,
  `validatePayload` (3-tier Validation Gateway).
- **Hosts:** `webapp-spa`, `single-html-embed`, `dev-server`.
- Sections resolve to `OKFSectionData` for one of the subdomain section types
  (flowchart, quiz, tradeoff-sandbox, …).

## Open Questions (to grill)

1. **Which "OpenUI"?** e.g. OpenUI Lang (generative-UI component spec for LLM output),
   the W3C Open UI community group component specs, or another format? Link / sample?
2. **Direction:** import only (OpenUI → OKF section data), or round-trip
   (editor saves back to OpenUI)?
3. **Granularity:** does one OpenUI document map to a single section, a whole topic
   bundle, or arbitrary UI that needs a new generic section type?
4. **Mapping strategy:** translate OpenUI components onto existing subdomain section
   types, or render OpenUI components directly through the UI System Contract?
5. **Where it plugs in:** a new storage adapter (`OpenUIStorageAdapter` implementing
   `OKFStoragePort`), a pre-parse converter in front of Tier 1 of the Validation
   Gateway, or both?
6. **Source location:** files in `public/okf/<topic>/` (e.g. `section.openui`), a
   separate folder, remote URL, or streamed LLM output?
7. **Validation:** what do Tier 2/3 diagnostics look like for OpenUI input — validated
   as OpenUI, as translated OKF, or both? How are `fixHint`s reported?
8. **Hosts:** must it work in all three hosts (incl. `libs/loom-sections.tsx` embed)?
9. **Editor:** does the Visual OKF Section Editor need an "OpenUI" raw tab?
10. **Unsupported constructs:** fail, warn and drop, or fall back to a generic renderer?

## Decisions

_None yet._
