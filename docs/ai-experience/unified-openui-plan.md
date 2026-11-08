# Unified OpenUI authoring — proposal under discussion

Status: implementation complete; automated verification passed. Product decisions below are user-confirmed.
The unified Page envelope, shared contracts, explicit content converter,
component naming migration, editor/AI discovery and separate Read/Present state
are implemented. Runtime domain adapters preserve existing learning renderers
and automatic scenes. Repository content and generated authoring files have
been migrated. Verification results are reported separately; browser and
external-model quality claims require actual measurements.

Verification: TypeScript, full unit/integration suite, production app/MCP app
build, generated-contract consistency, migration idempotence and whitespace
checks passed. Browser assertions could not run: the sandbox denied the local
server bind and Chromium exited before assertions. External-model authoring
quality and learner outcomes have not been measured.

## Accepted decisions

1. **One section = one page.** Explicitly confirmed by the user. Do not introduce
   a nested page hierarchy inside sections. Topics order their section/pages;
   Read and Present share these authored boundaries. The permitted component
   combinations follow decision 2 below.
2. **One main visual/activity plus supporting text per page.** Explicitly
   confirmed by the user. A diagram with a caption or a Quiz with instructions
   belongs on one page; a separate diagram and Quiz belong on separate pages.
   Use this as an AI authoring and review rule rather than reintroducing a
   section-type choice. Validation severity follows decision 10.
3. **Clean migration.** The user explicitly replaced their earlier temporary
   compatibility choice with a clean migration. Convert repository content,
   fixtures, examples and generated authoring artifacts to the unified format;
   remove obsolete authoring and reading paths instead of maintaining parallel
   formats. Plan an explicit conversion route for previously exported/user-owned
   files; its packaging and availability remain to be decided. Do not infer
   authorization to overwrite user-owned files outside the repository.
4. **Page-local shared reactive state in the first release.** User accepted the
   recommendation: supporting controls can update the page's main visual and
   explanation without another model call. A slider and its chart can together
   constitute one activity. Defer Query/Mutation host tool connections. Do not
   infer cross-page shared state or a persistence policy from this decision.
5. **Preserve hands-free Present mode.** After checking the current implementation
   at the user's request, replace the earlier proposal for authored interaction
   pauses. Present plays automatic beats, including performed quiz answers and
   taxonomy focus scenes; the viewer may pause, step, rewind or skip using player
   controls. Do not add activity-completion gates as part of this refactor.
   Demonstrated answers do not count as learner mastery.
6. **Shared content contracts, mode-specific renderers.** Preserve the existing
   model exemplified by Taxonomy: Read supports interactive category cards and
   detailed dialogs; Present derives automatic overview and focus scenes from
   the same category data. Unified authoring does not require identical markup,
   layouts or interaction behavior in Read and Present.
7. **Keep internal automatic scenes/beats.** Explicitly confirmed by the user.
   One section is one authored page, not one fixed presentation scene. A section
   may derive several hands-free Present scenes from its content, such as a
   Taxonomy overview followed by category focus scenes. These are not separately
   authored pages or sections.
8. **Separate learner state from demonstration state.** User accepted that
   Present starts from authored defaults for deterministic demonstrations and
   narration. Preserve the learner's Read-mode answers and control values when
   they return. Present must not overwrite learner state or assessment evidence.
   Persistence across reloads and behavior after source edits remain open.
9. **First-release delivery scope: main apps and MCP.** Explicitly confirmed:
   migrate Studio, Viewer, the main learning app and the MCP chat player together.
   Defer full unified-library support in the lightweight single-file embed.
   Document that boundary and provide an actionable unsupported-format message
   rather than silently rendering incomplete migrated content in the embed.
10. **Page focus is guidance with warnings.** Explicitly confirmed by the user.
    Encourage one main visual/activity plus supporting text through authoring
    guidance and review diagnostics. Do not reject a valid page based on component
    count. Syntax, structural contracts and invalid references remain errors.

## Interview update: section size and presentation

The user confirmed one section per page and one main visual/activity plus
supporting text. Distinguish a shared catalog from unrestricted composition;
there is no nested authored page hierarchy. The user explicitly confirmed that
Present renderers may derive several automatic scenes/beats within one section.

Do not infer pedagogical page breaks from viewport height or silently split a
quiz, diagram or simulation. Responsive wrapping and scrolling remain layout
concerns. Presentation beats may progressively reveal or explain a page without
changing its authored boundary.

## Intended outcome

An AI authors a topic as ordered sections, each representing a coherent learning
moment. It composes upstream OpenUI components and Loom learning activities in a
single section body without selecting a section type or component library first.

Sections own their title, optional learning objective, ordering and presentation
context. Components own their rendering, interaction and learning semantics.
Reading a section does not by itself demonstrate mastery.

## Current implementation constraints

- `composition/oui/compile.ts` selects separate Loom and standard OpenUI paths.
- `composition/oui/library.ts` contains Loom compiler definitions and `toData`
  mappings, rather than directly renderable learning component definitions.
- `progressive-content/components/openui/index.tsx` already uses the upstream
  React Renderer with a themed library containing Loom's Svg extension.
- Upstream containers have child-slot constraints; registering a component alone
  does not allow every nesting combination.
- Text and ImageGallery names collide between the existing libraries.
- Present beats, narration targets, Pick anchors, learning events and persisted
  progress currently depend on section-specific contracts.
- Tool-connected actions are a separate host integration concern from local
  reactive interaction. Package capability must be checked directly; public
  language versions and npm package versions cannot be compared numerically.

## Proposed technical design

- Keep Topic/SectionRef storage and explicit section boundaries. Introduce one
  section envelope for metadata and its OpenUI body; finalize exact syntax after
  a parser/renderer capability check. Do not require an authored section type or
  `library: loom | openui` choice for page content. Topic, narration and library
  manifests remain distinct document roles, not renderable child components.
- Build one canonical catalog from upstream content components plus Loom learning
  components and extensions. Derive browser renderers, serializable parser
  contracts, editor help and focused AI discovery from the same declarations.
  Preserve Worker-safe lazy initialization and avoid bundling React into server
  contract retrieval.
- Keep upstream public names stable. Resolve existing Loom Text/ImageGallery
  collisions through explicit migration mappings and distinct descriptive names
  only where different learning semantics justify separate components. Avoid
  permanent aliases and a second namespace-selection task for the AI.
- Use upstream Renderer for page content and adapters around existing learning
  domain behavior. Keep Read and Present implementations separate where needed;
  remove duplicate section title/help shells from embedded activity bodies.
- Register allowed content slots explicitly. Do not implement unrestricted
  activity-inside-activity nesting in this release. Layout and supporting controls
  should not be misclassified as independent learning activities.
- Retain the current beat/presenter contract for learning components. Give
  upstream content components sensible automatic presentation behavior and reuse
  existing named-content narration rules. Pure visual pages may have one content
  beat; a composed visual may have several. Narration remains authored in OUI.
- Keep reactive state scoped by stable section and statement identities. Use
  separate state stores for Read and Present. Retain current learner-progress
  persistence behavior; preserving arbitrary UI state across reloads is not a
  new requirement. Invalidate incompatible state after source edits rather than
  silently treating stale answers as evidence for changed questions.
- Local state actions are supported. Query/Mutation host calls remain deferred.
  Do not advertise unsupported actions as functional. A focused compatibility
  check must determine whether installed package APIs suffice before upgrades.
- Page-focus warnings should explain the suspected competing activities and
  suggest a split. They are advisory heuristics, not semantic proof of quality.

## Implementation slices and exit criteria

### 1. Freeze contracts and establish the migration inventory

Inspect actual installed parser, Renderer, library extension, binding and action
APIs; public language version numbers do not establish npm API compatibility.
Inventory section definitions, current Read/Present behavior, name collisions,
source maps, narration IDs, progress identities, repo topics and exported formats.
Specify the page envelope and old-to-new mappings. Cover all registered upstream
components in the catalog, while making supported behaviors explicit.

Exit: agreed product decisions are represented in a concrete contract and
migration table; no guessed upstream API is needed for the first slice.

### 2. Deliver a representative end-to-end slice

Use a short topic with separate explanation/table, Taxonomy, Quiz and reactive
chart pages. Each page has one main visual/activity plus supporting text. Make
these work through the unified catalog in Studio, Viewer and the MCP player.
Verify Taxonomy retains Read dialogs and automatic Present focus scenes; Quiz
retains Read feedback and performed Present answers; a chart control updates
locally without a model call. Verify returning from Present restores Read state.

Exit: syntax, Read behavior, hands-free beats, authored narration, Pick pointers
and event attribution work together without requiring a section-type choice.

### 3. Extend adapters and authoring tools

Adapt remaining learning components with their current domain behavior and
mode-specific presenters. Replace library-based content lookup in content-tree,
assistant tools, authoring-guide and TopicPlan with component-based discovery.
Update Studio completions, hovers, property forms and statement edits using the
canonical contracts; retain code editing and last-valid preview. New free-form
drag-and-drop layout authoring is outside this migration's proposed scope.

Exit: all current learning components have documented migration and presentation
coverage, and AI contract retrieval remains focused rather than catalog-sized.

### 4. Convert content and remove obsolete paths

Create an explicit converter that reports unsupported constructs and preserves
section identity, narration targets and assessment references wherever valid.
Use it for repository topics, fixtures, demos and generated artifacts. Offer
manual conversion for external exports separately from the runtime reader; do
not silently rewrite user files. Remove the old section-type/library dispatch,
obsolete directives and redundant catalog paths once their references migrate.
Update authoritative architecture docs, skills and public authoring guides.

Exit: one supported authoring format and content pipeline in the main apps and
MCP; no hidden dual-format reader. The deferred lightweight embed boundary is
explicit and cannot produce silently partial output.

### 5. Verify runtime behavior and AI authoring

Run required typecheck and unit/integration tests, generated-artifact consistency,
production and MCP/Worker packaging checks appropriate to the changed paths.
Exercise representative pages at desktop and narrow widths in Read and Present.
Verify playback, narration alignment, taxonomy detail scenes, state isolation,
rewind/skip determinism, migrations, validation diagnostics and Pick targeting.
Check all main delivery targets against the same migrated topic.

Compare real-model authoring on a small fixed set of teaching tasks against the
current baseline: invalid output, correction turns, contract retrieval cost and
representation fit. A valid fixture or advisory warning alone cannot establish
better AI choices or learning outcomes.

Exit: required automated and browser checks pass; any unmeasured AI-quality claim
is explicitly left unmeasured rather than inferred from structural validity.

## Acceptance evidence

- A short sequence renders upstream content and Loom activities from one catalog
  with predictable authored page boundaries in Read and Present.
- Each activity preserves feedback and emits correctly attributed learning events.
- Present mode remains hands-free, retaining component-specific scenes and valid
  narration/Pick targets from the shared authored content.
- Studio, Viewer, main app and MCP read the same authored content; the lightweight
  embed is deferred.
- Syntax, schema and semantic failures produce actionable diagnostics.
- Representative AI-generated lessons are assessed for representation fit,
  correction rate, authoring cost and runtime validity; scripted fixtures alone
  do not establish better model choices or learning outcomes.
- Run repository-required typecheck and unit tests for implementation changes;
  verify representative focused pages in the browser.

## Implementation details to finalize during contract design

- Exact page-envelope syntax and component name mappings.
- Stable identity mappings for migrated content and invalidation of changed
  assessment evidence; a local control change is not a new assessment result.
- Converter packaging and diagnostics for unsupported exported constructs.
- Capability coverage for upstream components/actions and generic automatic
  Present scenes, including hidden tab or modal content.
- Baseline evaluation tasks and practical acceptance thresholds for AI authoring.

These are proposed engineering choices to make concrete during implementation;
they are not additional user-approved product requirements.
