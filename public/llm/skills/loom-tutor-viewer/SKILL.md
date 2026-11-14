---
name: loom-tutor-viewer
description: "Tutor a learner with Interactive Loom when the chat has no Loom MCP App: find their Loom folder in their cloud drive, read the progress notes they paste from Loom Viewer, plan the next topic with callbacks to earlier ones, and write it as one .loom.oui text for them to open in Loom Viewer. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or pastes a Loom progress note."
---

# Loom Tutor (Loom Viewer)

The learner learns with Interactive Loom in **Loom Viewer** (https://chanatipsaetia.github.io/interactive-loom-learning-os/viewer.html), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive. `references/loom-authoring-prompt.md` is the full specification of the topic format.

## The routine

1. **Find the folder.** Find `Loom/` in the learner's drive (see "Where Loom keeps the learner's topics and progress" below, the contract for every path), read `Loom/index.oui`, and settle which domain the learner is working on (ask when it is not clear, or propose a new one). Read that domain's `domain.oui` and `progress/`. If you find topics or notes in the old flat `Loom/topics/` or `Loom/progress/`, offer once to move them into domains ("Moving from the old layout" below).
2. **Plan** the next topic (see below) and tell the learner in one or two lines what it covers and why.
3. **Write** it: read `references/loom-authoring-prompt.md` in full first (every component is positional; the signatures there are the only valid ones), then write the whole topic as **one `<topic-id>.loom.oui` file** in the "Single .oui file" format, with a narration file for every section.
4. **Hand it over** as a file to download, or as one code block when the chat cannot make files. The learner opens it in Loom Viewer with **Open file**, or copies it and uses **Paste text**.
5. **Save** the topic as `Loom/<domain-id>/topics/<topic-id>.loom.oui` with the drive connector, with `// @loom-domain <domain-id>` as its second line, and add its `TopicRef` to the domain's `domain.oui`.
6. **Fix.** If Viewer shows errors, the learner pastes them from **Copy errors for your AI chat**: fix only what they point at, keep everything else unchanged and hand over the whole file again.
7. **Save progress.** When the learner is done, they press **Copy progress** in Viewer and paste it here: a message with a progress note and the path to save it to. Save it as it is, with no changes; if you cannot write files, keep it in the conversation and use it to plan.

## Reopen the same lesson

"Show again", "reopen" or "resume this topic" means reuse the original complete .loom.oui source, not generate a replacement. Use open_topic when available, or read the exact file from an authorized attachment/drive and pass it unchanged to show_topic. Preserve section IDs, narration and domain markers. A title, summary or remembered outline is not the original source. If the complete source is unavailable, ask the learner to attach their saved .loom.oui file; create a replacement only if they explicitly request one. The hosted Worker stores no topics. The MCP player offers Download lesson through supporting hosts and Copy lesson source as a fallback. Keep that exact file for reopening in a later chat or Loom Viewer. A download request is not proof of a Drive save.

## The learner's Loom folder

Everything the learner keeps lives in one folder, `Loom/`, at the top of the cloud drive they use (My Drive in Google Drive, not a shared drive; OneDrive or SharePoint), reached with this chat's own drive connector. It is grouped by **domain**, one subject area each (fight animation, home networking), so each domain is planned from its own progress:

```
Loom/
  index.oui                              the list of domains
  <domain-id>/
    domain.oui                           title, goal, topics in learning order
    topics/<topic-id>.loom.oui           one file per topic
    progress/<topic-id>-YYYY-MM-DD.md    one progress note per topic and day
```

- These paths are a contract that Loom reads: use them exactly and never invent other folders.
- Look for `Loom/` at the start of a session. If the drive has none, offer to create it there, saying why: topics and progress kept in their own drive follow them to every chat and device, and let you plan each next topic from what they actually did.
- If this chat has no drive connector, encourage the learner to turn one on before they start, in one or two lines: in Claude, Settings → Connectors → Google Drive (or OneDrive / SharePoint), then enable it for the chat; in ChatGPT, its Google Drive or OneDrive app; Microsoft 365 Copilot has OneDrive built in. If they would rather not, carry on from the conversation, say once that nothing is kept between chats, and keep each progress note in the conversation so they can save it themselves.
- After showing a topic in an established domain, save it to the learner's drive immediately unless they opted out; do not wait for another request or ask for the same permission again. Confirm a new or ambiguous domain first. Offer each save rather than wait to be asked for progress notes, asking before saving unless already authorized. If the connector cannot write, say the topic is not saved and provide the exact file for manual saving. Never claim a save succeeded without a successful write.

## Progress notes

A note is the learner's record of one topic on one day. Loom writes it, never the model: it starts with front matter, then plain lists.

```markdown
---
loom-progress: 1
domain: chinese
topic: chinese101-day1
date: 2026-10-24
---
# Loom progress: Chinese 101: Day 1

Played 4 of 6 sections; 5 of 7 questions right in the end.

## Sections
- [x] Greetings (`greetings`)
- [ ] Numbers (`numbers`)

## Answers
- `sections/quiz.oui#q2`: wrong, then right
- `sections/quiz.oui#q5`: wrong

## To review
- `sections/quiz.oui#q5`: last answer wrong
- Numbers (`numbers`): not played yet
```

Items are named by file and ID inside the topic (`sections/quiz.oui#q5` is the statement `q5 = …` in that section of `Loom/chinese/topics/chinese101-day1.loom.oui`): open the topic to see what was asked. Save a note exactly as it came, at the path its message names (`Loom/<domain-id>/progress/<topic>-<date>.md`), replacing a note of the same name; when the message leaves the domain to you, put it in the topic's domain and add its `domain:` line.

## Shared authoring workflow (v7)

For a new topic or substantial redesign:

1. Identify the learner, goal, relevant source evidence and prior progress.
2. Discover compact capabilities. Map objective → knowledge structure → learner action → candidate views/interactions → representation and configuration; compare fidelity, perspective coverage, clarity, assessment fit and modeling feasibility. Compare OpenUI tables, cards, diagrams and charts as normal candidates, not only when no native type fits. Proactively consider images with cards/text for visual topics and learner-visible sources for researched/current comparisons; these support one composition. Keep Bullets for genuine list tasks. Choose the clearest faithful combination, not the cheapest syntax; no ranking or quota. Compare only relevant candidate compositions; read their capability references progressively rather than loading every component. Distinguish presenting, exploring and assessing; each additional page must serve a distinct learner action. Read the installed mental-model and visual-planning references; with MCP start at read_reference({path:"index.md"}).
3. Use a schemaVersion 1 TopicPlan: topicId, goal, objectives (id, description, optional prerequisiteIds/evidenceOfLearning), and sections (id, title, objectiveRefs, components, activity, optional rationale/evidenceRefs/presentation/assessment). activity is the concrete learner action; explain the representation choice in rationale for new plans, including why relevant alternatives fit less well and any evidence or modeling limits. Use existing rationale, evidenceRefs, presentation and assessment fields; do not invent extra plan fields. A page is a compositional learning unit. components is required and lists the main visual/activity and supporting components from one shared catalog; representation and library are not plan fields. Do not choose a section type or library. Multiple components may cooperate in one learning activity. Record useful image examples, nearby learner-visible source links and any dated measurement limits in the existing components/rationale/evidenceRefs fields; no new media fields are needed. Every section is root = Page("Title", body, heading?). presentation names target read/present/both and strategy; assessment binds itemRefs to a successCriterion. Record a primary Flowchart view and any narration view transitions in presentation.strategy; for OpenUI name its intended table, cards, chart, Steps or diagram. For Text, name the prose-specific need and why structured candidates fit less well; generic clarity, simplicity or length is not a selection rationale. Keep objective and evidence references consistent; each section needs a distinct contribution.
4. Check objective coverage, prerequisites, supported representations, component availability and declared evidence links before writing OUI. Inspect advisory experience-readiness diagnostics too; resolve them or explicitly justify proceeding. Structural validity is not a judgment of teaching quality. Use validate_topic_plan if available; otherwise check the same contract locally and state which checks ran.
5. Load the selected section rules, then only the component contracts needed. Focused OpenUI requests include compact section rules and beats; list all actual composition components, while specific model dependencies are included and generic child alternatives remain choices. Use the full guide for extra examples when needed. For selected images or references, read focused media-composition, image-policy and learner-reference guidance as relevant. Retrieve components by canonical name from the same purpose-based catalog. Prebuilt activities are conveniences, not a separate library or preferred tier. Read selected section references and only the relevant OpenUI families. With MCP, use read_reference for the selected components/<Name>.md paths.
6. Write OUI and narration from the checked plan, preserving IDs and exact signatures. Each virtual file requires exactly one root assignment: root = Topic(...) for the manifest, root = Page(...) for a page and root = Narration(...) for narration. Bare calls are not complete source. Use current buffers and targeted dependencies for edits.
7. Check each virtual file for its named root and correct document role, then use the existing OUI/narration compiler checks and compare the artifact with the plan, and measure Read/Present at phone/tablet widths when possible. Inspect clipping, fonts, reachable scroll content and narration focus, plus image loading, descriptive alt text where supported, source-link destinations/hover descriptions and dated chart claims. Validate quantitative defaults and domain boundaries using the approved expression evaluator; reconcile shared-model totals and units. Label illustrative assumptions and normalize provider token usage with explicit inclusive/exclusive semantics. Repair only affected statements, retaining IDs and source references. Recheck after each repair, stop after three unsuccessful attempts and report remaining diagnostics without silently changing facts or learner progress; report checks not run. Compiler validity and section variety are not teaching-quality scores.
8. Show the checked topic and save its exact source through the existing authorized storage workflow. Showing is not a confirmed save. Follow the skill output-location and validation references; provide the actual files.

For a small edit, read affected current source, preserve the existing learning decision, retrieve scoped contracts only as needed, validate and deliver the targeted change. Do not require every tool, a whole-guide reload or a new plan for each minor edit. Assistants own research, reasoning, generation and repair; Loom supplies deterministic contracts and checks.

## Planning the next topic

1. Work in one domain: read its `domain.oui` (the learner's goal and the topics in order) and its `progress/` notes, the latest one per topic. Other domains' progress does not count unless the learner asks to connect them.
2. Pick what comes next and say why in one line: **move forward** (the earlier topics went well), **repair** (something earlier has faded or keeps failing) or **weak spot** (one idea fails across topics).
3. Connect earlier knowledge when it supports this goal, rather than assigning a fixed share of callbacks. Weave an earlier word, step or formula into a new application instead of repeating the same explanation. Include recall or application questions when they provide useful evidence of learning.
4. Teach new ideas before testing them: every question tests only what an earlier section of the topic, or an earlier topic the learner has done, teaches.
5. Keep it to one sitting, with no fixed section count or order. Select native sections and OpenUI by the learner action; use connected prose when it is the clearest explanation.
6. When a drawing makes the concept easier to understand, include one without waiting for the learner to ask: a labelled Svg schematic for parts, space, a mechanism or a concrete analogy; use a Flowchart for a process, a chart for quantities or a ConceptMap for relationships. Pair it with a short explanation and narration that highlights the important parts one at a time. Label analogies and simplifications, keep labels readable on a phone, and prefer static shapes over decorative animation or filters. For Svg, read the components/Svg.md reference. A picture should teach the idea, not decorate it.
7. Proactively visualize time and quantities when they are central to the explanation; do not wait for the learner to request a chart. Use Timeline for measured start times, duration, parallel work and waiting; a custom Svg can show a qualitative event timeline, LineChart for change over time, HorizontalBarChart for comparing amounts, PieChart or SingleStackedBarChart for a flat share of one whole, BreakdownTree for a hierarchy of quantities or conditional probabilities, and stacked bars for used versus remaining capacity. Request the timeline guide for measured timelines, the breakdown-tree guide for hierarchical shares, and the openui guide for charts and custom Svg. Use source-backed figures for factual claims; clearly label intentional teaching examples as illustrative data. In Present, keep the whole visual visible while several narration steps highlight its phases, points, bars or slices, then explain the takeaway.

## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the main visual or learning activity that teaches that mental model. Rows name learning capabilities; retrieve the selected component contracts. Every authored section is Page(title, body, heading?), without a section-type or library choice. Read its exact component signatures before writing.

Learning-first, representation-aware authoring: learning objective → knowledge structure → learner action → candidate section capabilities → representation and configuration → focused contracts → OUI and narration → validation/repair → delivery. Choose the simplest representation or complementary combination that fully supports the intended learning experience. Text, layouts, visuals and prebuilt activities share one catalog; there is no section ranking, visual quota or mandatory sequence.

Compare candidates by knowledge fidelity (preserve information and relationships), learner action (what the learner does), perspective coverage (what additional views reveal), cognitive clarity (avoid unnecessary complexity), assessment suitability (what response demonstrates the outcome) and authoring feasibility (what the evidence can actually model). Record the choice in TopicPlan activity, rationale and presentation.strategy before retrieving exact signatures. Resolve relevant advisory warnings or explicitly justify proceeding; structural validity alone is not experience readiness.

Bullets teach numbered linear procedures, checklists, prerequisites, key points, supporting details and concise summaries. The knowledge itself should fit a list; moving paragraphs into bullet items is not a representation decision. For visual subjects, proactively compose informative images with cards and text, and include learner-visible references beside researched or time-sensitive claims. Images and links support the same learning unit; they are not separate page types. Read contracts/media-composition.md (installed skills: references/planning/media-composition.md) for composition examples. Compare compositions proactively: matched attributes in a table, verified use-case examples in cards, spatial mechanisms in labelled Svg, and measured quantities in charts. Simplest means clearest for the learner, not fewest component types or easiest syntax. Steps add visual stage guidance; Flowchart teaches interactions, responsibilities, messages, data or states, even in a linear process when perspectives add understanding. Reflection Sequence practises order; User Journey follows a person's experience. Text is appropriate for connected prose, nuanced explanation and argument; consider alternatives when they clarify the objective, without forcing interactivity.

Flashcards introduce definitions and meanings as well as practise recall. Cards/stacks compare examples, tables compare factual attributes, labelled Svg diagrams explain spatial structure, and charts explain quantities or trends. Empirical charts require supplied or verified data; clearly label illustrative data and never invent benchmark results. Tradeoff Sandbox explains comparisons as well as contextual decisions; Formula Sandbox explores parameter sensitivity. Select other prebuilt activities by their learning purpose below.

For a 3D web research lesson, compare matched capabilities in a Table, inspect annotated use-case cards, and explain camera/geometry with a labelled Svg when each serves an objective. Bullets can guide real initialization steps; Flowchart can trace system messages. These are candidates, not a required section mix.

For full lessons, combine sections only when each adds a distinct contribution: e.g. Flowchart explains RAG tool execution, Bullets guides implementation, Scenario explores retrieval failures and Quiz assesses application. Distinguish presentation, exploration and assessment. Viewing, clicking, switching views and flipping cards are engagement, not demonstrated mastery.

Read only plausible capability summaries, then the exact contracts and required model dependencies of the selected components. Prebuilt activities package reusable interactions and presentation scenes; select them by fit, just like tables, text or controls. If a contract is unavailable, correct the path or explicitly revise and revalidate the plan; never silently downgrade to prose or invent signatures. Generic child alternatives are choices, not dependencies.

### Choose an activity, then a composition

For each page establish the learning objective, knowledge structure and concrete learner action. For every candidate ask what it can introduce, what learners can explore, what their response demonstrates and what its limits are. Read those four teaching-purpose fields in the relevant capability or component reference; do not load every component guide. Consider feasible alternatives, then explain the selected composition and its limits in the existing plan rationale. Use evidenceRefs for sources and also author useful learner-visible source or further-reading links in the page; internal plan references do not render themselves. Use presentation for Read/Present behavior and assessment for observable answers. No additional TopicPlan fields are needed. Supporting components must serve the same main activity; a second page needs a distinct contribution. Do not require a fixed number of components, pages, alternatives or interactions.

| Learner action | Candidate capabilities to inspect | Fit and boundary |
|---|---|---|
| Orient or follow a connected argument | TextContent, Card, Intro | Prose can preserve nuance; exposure is not demonstrated understanding. |
| Execute or understand a procedure | Steps, Bullets, Flowchart | Choose instruction, checklist or structural explanation; a linear procedure can benefit from a diagram. |
| Introduce or recall individual concepts | Flashcards, TextContent | One focused idea per card; connected explanations can use prose; flips do not prove correctness. |
| Introduce, organize or distinguish kinds | TaxonomyBrowser, Table, grouped cards | Explain defining features and overlaps; use ConceptMap for relationships or DecisionTree for identification rules. |
| Compare attributes, examples and their implications | Table, TradeoffSandbox, Card with Stack | Use a compact overview or an explained comparison across shared criteria; a recommendation is optional. |
| Trace events, ownership or messages | Flowchart | Choose a meaningful view and model real participants; do not invent internals to enable views. |
| Explain relationships or spatial parts | ConceptMap, labelled Svg | Name relationships or show positions; label conceptual models and analogies. |
| Explain foundations and dependencies | PillarLayer | Show what depends on what, not arbitrary decorative layers. |
| Follow a person's experience | UserJourney | Explain goals, actions, responses and friction, distinct from internal system execution. |
| Interpret measured time or quantities | Timeline, BreakdownTree, charts | Use verified measurements or clearly labelled illustrative data. |
| Explore input/output sensitivity | FormulaSandbox | Use a defensible authored formula; sliders do not execute the real system. |
| Compare choices and consequences | TradeoffSandbox, DecisionTree, Scenario | Choose comparative exploration, explicit diagnostic rules or branching consequences. Explain assumptions; avoid a universal winner. |
| Recognize visual examples | ImageGallery, LearningGallery, Image with Card | Images must teach recognition, not merely decorate. |
| Apply, reconstruct or explain | Quiz, ReflectionSequence, ReflectionTemplate | Teach the assessed concepts first; correct answers concern the authored exercise. |

For procedures, distinguish executing instructions, understanding step connections and practising order. For taxonomy, introduce defining features and examples, explain overlapping categories and ground any parent-child relationships in the subject. For flashcards, introduce or recall one focused idea; use a connected explanation or category overview when those better fit.

For a framework comparison, a table can align APIs, a conceptual demonstration can explain state dependency, and TradeoffSandbox can explain differences and consequences across shared criteria, then optionally explore project constraints. Compare relevant alternatives such as ConceptMap or Flowchart for the mechanism, and Scenario or DecisionTree for project choices. Include only distinct contributions. A Loom-local counter is an illustrative model, not execution or benchmarking of actual Svelte/React code. Do not invent productivity or performance scores to justify FormulaSandbox or charts. A linked code example is not evidence of a live execution environment.

Progressive reading stays unchanged: browse capability summaries, open only plausible alternatives, validate the plan, then retrieve exact contracts only for the selected components. Do not load every component contract to fill this decision record.

### Choosing views within a Flowchart

Choose one meaningful primary view with Flowchart.initialView. In presentation.strategy record that view, the guided Journey/JourneyStep path and any purposeful NarrationStep.view transitions. Multiple narration steps can use the same beat to reveal different perspectives. Do not require all six views or invent actors, interactions, event data or states to enable them. Use Branch/BranchOption only for real alternatives, async for fire-and-forget commands, sendsTo for declared messages, Event.data for meaningful payloads, and StateMachine plus Event.enters for genuine lifecycle transitions. Sequence spacing is not measured duration. A linear process can still justify several perspectives when each teaches something distinct.

| View | Mental model it teaches |
|---|---|
| event-storming | Event → policy → command → system → resulting event; explain triggers and rules. |
| architecture | Components, their responsibilities and their connections. |
| swimlanes | Ownership and handoffs between participants. |
| sequence | Who sends what to whom, and in what order; vertical spacing is not measured duration. |
| data-flow | What information moves between components. |
| state-machine | How events change the state of something. |

### Choosing a visual composition

| Mental model / learning goal | Visual |
|---|---|
| Compare concrete examples or evidence layouts side by side | Card / Stack with concise explanations or labelled Svg drawings |
| Compare amounts or rank categories | BarChart / HorizontalBarChart |
| Follow a measurement over time | LineChart |
| Show an amount developing over time | AreaChart; use cumulative data when teaching accumulation |
| Show flat shares of one whole | PieChart / donut variant / SingleStackedBarChart |
| Compare used and remaining capacity | Stacked HorizontalBarChart |
| Examine two numeric variables | ScatterChart; an association alone does not establish causation |
| Compare profiles across comparable criteria | RadarChart |
| Compare attributes and explain their implications | Table for a compact overview; TradeoffSandbox for an explained comparison |
| Explain spatial structure, anatomy, a mechanism or a concrete analogy | Labelled Svg drawing |
| Execute or understand a procedure | Steps, Bullets or Flowchart according to instruction, checklist or structural needs |

### Applying the selection

### Compose images and references into the learning unit

Proactively include informative images and learner-visible reference links when they help explain, compare or substantiate the topic; do not wait for a separate request. In a researched, current or comparative lesson, normally include checked official references and visible sources beside empirical claims. For a visual topic such as UI design, actively seek useful screenshots or image examples. Avoid decorative filler and fixed image/link quotas. If useful imagery cannot be delivered, explain the limitation and revise the visual explicitly rather than silently dropping it.

Images and links are supporting content within one shared OpenUI composition, not separate page types or alternatives to cards and text. Combine Card/CardHeader, Stack, TextContent, ImageBlock or another appropriate image component, and a chart, Table or prebuilt activity when they cooperate on one learner action. A framework card can contain an explanation, an annotated screenshot and a reference; a popularity chart can have adjacent TextContent with its dated source and measurement caveat. Read exact child contracts rather than inventing image, source, style or link props on Card. Keep essential content as named children of Card or Stack for Present; hidden tabs are optional Read detail.

Explain what to notice in each image and connect it to the nearby text. Put a clickable source/detail link in adjacent TextContent or a field whose contract supports Markdown; plain-text gallery captions/credits are not link containers. Use descriptive link labels and a concise Markdown title for the hover description. Sources belong beside the relevant example or claim, not only in a final bibliography, chat reply or TopicPlan evidenceRefs.

For example, for “explain new UI frameworks, use glassmorphism or flat design, focus on 2026 and compare popularity”: distinguish frameworks, component libraries and design styles; glassmorphism and flat design are aesthetics, not frameworks or popularity metrics. Use composed framework cards with verified visual examples, short explanations and official documentation links. Compare practical strengths with Table or TradeoffSandbox, and show popularity with a chart only when comparable measured data exists. State the metric, source, observation date, sample/window and units; downloads, stars, survey usage and interest answer different questions. Separate established frameworks active in 2026 from newly released ones. Do not invent a 2026 ranking, full-year totals before the year ends, or substitute framework release dates for adoption evidence. With insufficient evidence, show what is known in a sourced qualitative comparison and state the gap.

Honor a requested visual style through supported layout and component options, readable spacing and coherent hierarchy. The player controls the surrounding theme; do not invent per-topic theme/CSS/blur props or promise to override host styling. If teaching glass versus flat appearance, use verified screenshots or clearly labelled authored Svg mockups with supported shapes/gradients, explaining translucency, layering, contrast and readability. A mockup illustrates a style, not a real product screenshot or adoption evidence.

Progressively read contracts/images.md and runtime.md only when selecting image sources, contracts/learner-references.md for visible links, and components/<Name>.md for the selected composition. Installed skills provide references/core/images.md, references/core/learner-references.md and focused component files. Do not load the whole catalog. Verify image loading, link destinations, hover descriptions and legibility in Read and Present when available; report unverified host behavior. Preserve the same understand → discover → plan → validate-plan → references → generate → verify → deliver workflow.

### Reference links for learners

Proactively include useful learner-visible reference links for deeper reading, checking a claim or trying the next step; do not wait for an explicit request for sources. Researched, current and comparative lessons should normally include checked official references and visible sources beside empirical claims. Compose them inside cards or adjacent to text, images, tables, charts and other OpenUI components that teach the same idea; references are supporting content, not a separate page type. Prefer relevant official documentation, primary sources and original image/data sources. Link to a specific section when its destination is supplied or checked, and identify a relevant version or date when it affects the explanation. Use a small, purposeful selection; no fixed reference count or separate references page is required.

Give each link a descriptive label and a short reason to open it, such as a worked example, API detail, source dataset or explanation beyond the lesson's scope. Place it beside the related explanation or in a concise Further reading block inside the authored lesson, not only in a chat reply or source comment. Keep the core learning task understandable without following external links. Do not make Present depend on opening a website or narrating long raw URLs.

Use supplied or checked destinations; never fabricate URLs, titles, quotations or source support. Mark unverified availability honestly. Distinguish a claim's source from optional further reading. Internal TopicPlan evidenceRefs are not automatically rendered links for the learner: author the visible link in the page content too, without adding unsupported Topic, Page or source fields.

Use Markdown links in TextContent or another component that explicitly supports them, or a documented open_url action when suitable. Do not assume every string field supports Markdown or invent a Reference/Link component. Read the actual contract before writing a button or action. For a richer reference preview, include a concise authored description in the standard Markdown link title, for example: [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview "Requests, responses, headers and status codes explained in depth."). Read and Present style these links and show their label, description, website domain and destination on hover or keyboard focus, with an Open reference action. The preview uses authored text and the URL; it does not fetch external page metadata, images or availability. Supply only descriptions supported by the reference, and keep essential teaching visible in the lesson rather than only in the preview. Verify navigation in the target chat host; a host may intercept or block external navigation. Do not open links automatically during presentation. External reference navigation and permission to embed an image are different concerns.

For an image, distinguish the direct image source used for rendering from the source/credit/detail page the learner can visit. Put a readable source or attribution link in supported caption/credit content or adjacent TextContent. LearningGallery captions and credits render as plain text; use adjacent TextContent for a clickable link there. A source-page link is not the image src, and an allowed image origin does not guarantee a working detail-page link. Svg removes links, so place learner references outside the SVG markup. Preserve image rights/attribution information available from the supplied source; a credit is not itself permission to reuse an image.

For a procedure, ask whether the learner needs to execute instructions, understand their structure, or practise their order. Steps, Bullets and Flowchart are peer candidates: Steps guides instructions with explanations or code, Bullets supports concise checklists and prerequisites, and Flowchart explains sequence, dependencies, branches, responsibilities and consequences. A linear procedure can justify Flowchart when the connections help explain it; branching or multiple participants are not selection prerequisites. The existing Flowchart contract still applies: model only supported participants, events and relationships; never invent actors or events just to use it.

For creating a Svelte app, Steps can guide installation, project creation and running commands; Flowchart can explain the edit-to-browser-update process. ReflectionSequence can optionally assess reconstructing a taught order. These serve distinct learning needs, not a mandatory sequence or component mix. Present demonstrations and checklist clicks do not prove procedural skill.

TaxonomyBrowser introduces and explains meaningful kinds as well as supporting classification. Each category should state its defining features, give examples and distinguish nearby categories. Compare a compact Table or grouped cards for scanning, ConceptMap for labelled relationships and DecisionTree for rule-based identification. Select by the learner's question, without requiring every representation.

For an introduction to Svelte, categories could organize components, reactivity, composition and lifecycle when their scope is clearly explained. Categories may overlap; explain shared examples instead of forcing a mutually exclusive partition. Use parent-child relationships only when the subject supports them. The current TaxonomyBrowser contract is a flat category browser: describe relevant relationships in its existing fields or select a suitable relationship component; do not invent nested category or parent fields. Preserve dependencies and process order through an appropriate representation. Browsing is exploration; classification practice requires an observable learner response.

Flashcards teach individual concepts on first encounter as well as practising recall. Use a focused term or question on the front and one coherent explanation on the back, supported by a concise example, dialogue or common mistake when useful. For Svelte, a $state card can introduce its meaning, a small example and a misconception before recall practice. Keep one focused idea per card; use TextContent for a connected explanation and TaxonomyBrowser to organize kinds or distinguish categories.

Use the existing Flashcard fields: word carries the front's term or question, and shortDefinition, detailedDefinition and optional dialogue carry the explanation and examples. Do not invent prompt, answer or automatic-grading fields. Read lets the learner attempt recall and reveal the explanation; Present demonstrates front and back. Flipping or viewing a card records exposure, not correctness or mastery. Add a grounded assessment only when the learning goal requires observable evidence.

TradeoffSandbox is a first-class comparison component, including when the learner only asks how alternatives differ. Table provides a compact factual overview; TradeoffSandbox supports an explained comparison across shared criteria, strengths, limitations and practical consequences. Choose by learning value, without requiring a winner or a fixed component mix.

For Svelte versus React, compare the same criteria for each option, such as reactivity, setup and ecosystem, and explain what each difference means in practice. Use a comparison step per useful criterion with the same alternatives; keep descriptions and pros/cons specific to that criterion. A project situation can follow if it adds a distinct learning contribution. Do not invent performance or productivity scores.

A qualitative comparison needs no scores, sliders, recommendation or multiple situations. With the current contract, use one TradeoffScenario as the comparison container, metrics: [] and choice metrics: {}; omit recommended, whyThisFits and whenToUse unless useful. These are existing positional fields, not new mode flags. Present guides the authored comparisons; Read supports exploration. Inspecting or selecting an option is engagement, not evidence of a justified decision.
- A Tradeoff Sandbox can contain multiple situations to teach how to choose between alternatives. Reuse comparable choices across contrasting situations, but vary the goals, constraints and priorities so the learner sees when each option fits. For HTTP versus WebSocket, contrast an ordinary resource API with a bidirectional live collaboration application; explain each situation's gains, costs and recommendation rather than declaring one universal winner. A general comparison may stand on its own; add contrasting situations only when they teach contextual suitability. Several situations remain one main activity on one page, with internal automatic Present scenes; split pages when the learning purpose changes or the content becomes too dense. Recommendations must follow the authored situation, and numerical scores must be sourced or visibly labelled illustrative.
- Keep the distinctions explicit: Taxonomy classifies; Breakdown Tree divides a measurable whole. Pillar Layer shows foundations; Flowchart shows process. Sequence shows interaction order; Timeline shows measured time. Decision Tree selects by rules; Scenario explores consequences.
- Select only the sections that help this topic. This is a catalogue of teaching choices, not a mandatory lesson sequence or a requirement to include every type. A focused explanation may use one strong section; a fuller topic can introduce meanings, show relationships or a mechanism, compare options, then practise applying the idea.
- Read and Present deliver the same mental model. Read supports inspection and learner interaction; Present guides attention with narration and focus. Use each section's documented beats and view controls. In Present, quiz and reflection answers can be demonstrated by the stage; they are learner practice in the interactive Read mode.


## While the learner works

- Explain in the conversation when they ask, in the language they write in. Hint before giving an answer.
- Say what comes from the topic and what from your own knowledge.
- When they finish a topic or say they are done, remind them to keep their progress: ask them to press the progress button (see the routine) so you can save the note to their drive, then suggest the next topic with its reason. Do not let a session end with unsaved progress without saying so once.

## Where Loom keeps the learner's topics and progress

Learning is grouped by **domain**: one subject area the learner is working through, such as fight animation or home networking. Each domain has its own folder holding its topics and its own progress, so the next topic is planned from that domain's progress alone. These paths are a contract: Loom (its app in the chat, Loom Viewer, and the Loom server on the learner's computer) reads them. Use them exactly; never invent other folder names or layouts.

### Layout

At the top of the learner's drive (**My Drive** in Google Drive, not a shared drive; the root of OneDrive), reached with this chat's drive connector:

```
Loom/
  index.oui                              the list of domains
  <domain-id>/
    domain.oui                           the domain: title, goal, topics in learning order
    topics/<topic-id>.loom.oui           one file per topic
    progress/<topic-id>-YYYY-MM-DD.md    one progress note per topic and day
```

### IDs

- A **domain ID** is a lowercase slug, by the same rules as topic IDs: lowercase letters, digits, `-` and `_` (`fight-animation`, `home-networking`). It never changes; the name shown to the learner is the domain's `title` in `domain.oui`.
- A **topic ID** is the `// @loom-topic` line of the topic. Name the domain on the line after it, so Loom knows where the topic and its progress belong:

```
// @loom-topic punch-basics
// @loom-domain fight-animation
// === topic.oui ===
root = Topic("Punch Basics", "Fight Animation", …)
```

- Keep each topic's `Topic` category the same as its domain's title.

### The files

#### `Loom/index.oui`

```
Library(domains: DomainRef[])
DomainRef(id: string)
```

```
root = Library([DomainRef("fight-animation"), DomainRef("home-networking")])
```

The learner's domains, most recently studied first.

#### `Loom/<domain-id>/domain.oui`

```
Domain(title: string, description: string, topics: TopicRef[], goal?: string)
TopicRef(id: string)
```

```
root = Domain("Fight Animation", "Animating believable fights in Blender: poses, timing, impact.", [TopicRef("punch-basics"), TopicRef("blocking-a-hit")], "Animate a 10-second fight scene")
```

`topics` lists the domain's topics in suggested learning order; each `TopicRef("<topic-id>")` names `topics/<topic-id>.loom.oui`. `goal` is what the learner wants to reach, in their words.

#### `Loom/<domain-id>/topics/<topic-id>.loom.oui`

The whole topic as one `.loom.oui` text, exactly as shown to the learner, with its `// @loom-domain` line.

#### `Loom/<domain-id>/progress/<topic-id>-YYYY-MM-DD.md`

Written by Loom, never by you: the app's **Save my progress** and Loom Viewer's **Copy progress** hand you the note and its path. Save it exactly as it came. Its front matter says what it is about:

```
---
loom-progress: 1
domain: fight-animation
topic: punch-basics
date: 2026-10-24
---
```

then plain lists: the sections played, every answer in order, and what to review. When several notes exist for one topic, the latest date wins.

### Saving

1. **Pick the domain.** Put a topic in an existing domain that fits (read `Loom/index.oui` and the domains' titles). If none fits, propose a new domain (its ID, title and the learner's goal) and confirm it with the learner before creating it.
2. **Create what is missing:** the `Loom/` folder, `index.oui`, the domain folder with its `domain.oui`, `topics/` and `progress/`. Add a new domain's `DomainRef` to `index.oui`, and a new topic's `TopicRef` to its `domain.oui` (where it fits in the learning order, usually at the end).
3. **Replace, never duplicate:** a topic with the same topic ID, or a progress note for the same topic and date, replaces the file that is there.
4. **Plain text:** save `.oui`, `.loom.oui` and `.md` files as plain text with exactly these names, with no conversion to Google Docs or Word.
5. **Save after showing:** when a topic belongs to an established domain, save the exact topic shown with `show_topic` immediately to `Loom/<domain-id>/topics/<topic-id>.loom.oui` and add its `TopicRef` to `domain.oui` once. Include the domain marker before showing, and save revisions after fixes or edits. Unless the learner opted out, do not wait for another request or repeat permission already given for that domain. Confirm new or ambiguous domains first. Local server memory is not proof of a Drive save: skip duplicate writes only after confirming the intended synced Drive file and domain index. Offer each save rather than wait to be asked for progress notes; ask unless already authorized. Confirm the path only after a successful write; if a write fails or no writable connector is available, say the topic is not saved and provide the exact file for manual saving.



### Planning what comes next in a domain

Read only that domain: its `domain.oui` and its `progress/` notes (the latest note per topic). Then, with a one-line reason:

- **move forward** to the next topic in `domain.oui`'s order that has no note, or whose note shows it unfinished;
- **revisit** sections played only partly, or answers whose latest try was wrong;
- or **extend the goal** with a new topic the domain does not have yet (add it to `domain.oui` when you save it).

Other domains' progress does not count, unless the learner asks to connect them.

### Showing the learner where they are

With the Loom MCP App, show progress in the chat instead of describing it, but only when the learner asks:

- **`show_domain`** when they ask about one domain ("where am I in Chinese?", "show my fight animation topics"): pass the domain ID and that folder's `domain.oui`, each topic's header and `topic.oui` part, and the latest progress note per topic. It shows the topics in order with their status and the topic up next, and tells you where the learner stands; its Next topic button sends you a request to plan the next one.
- **`show_library`** when they ask for their library or all their domains: pass `index.oui` and the domains' files.
- The Loom server on the learner's computer reads its own folder: call them there without files.

Do not show either unasked, for example at the start of every session.

### Moving from the old layout

Topics and notes saved before domains existed sit flat in `Loom/topics/` and `Loom/progress/`. When you find files there, offer once to move them into domains, and do it only after the learner agrees:

1. Group them by subject, propose the domains (an ID, a title and the learner's goal for each), and let the learner confirm or change them.
2. For each domain, create `Loom/<domain-id>/` with its `domain.oui` (its topics in a sensible learning order), `topics/` and `progress/`, and add it to `Loom/index.oui` (create that file if it is missing).
3. Move each topic to `Loom/<domain-id>/topics/<topic-id>.loom.oui`, adding `// @loom-domain <domain-id>` as its second line and setting its `Topic` category to the domain's title.
4. Move each progress note to `Loom/<domain-id>/progress/` under the same name, adding `domain: <domain-id>` to its front matter after `loom-progress:`. Change nothing else in it.
5. Remove the old copies only after the new ones are saved, then tell the learner what moved where.

A file whose subject is unclear stays where it is until the learner says which domain it belongs to.

### Finding files that were moved

Files can be moved by hand. When a path does not hold what you expect, search the drive by content: topics by their `// @loom-topic` line (and `// @loom-domain`), progress notes by `loom-progress:` in their front matter, keeping only those whose `domain:` is the domain you are working in. If the drive search finds no `.loom.oui` or `.md` files at all, the connector may only find its own document types: tell the learner, and keep a document copy of each file under the same name.

### Moving files

Move files only when the learner asks. When a move takes a file out of its domain folder (or into another domain), say so first: Loom plans each domain from its own folder, so a topic or note outside it no longer counts for that domain. Update `domain.oui` (and the topic's `// @loom-domain` line) to match a move the learner confirms.
