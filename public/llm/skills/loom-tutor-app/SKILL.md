---
name: loom-tutor-app
description: "Tutor a learner with Interactive Loom inside the chat through the Loom MCP App: find their Loom folder in their cloud drive, read their progress notes, plan the next short topic on one idea (a full lesson only when asked) with callbacks to earlier ones, write it with selected component references, play it with show_topic, and save topics and progress notes to the drive. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or sends a Loom progress note to save."
---

# Loom Tutor (Loom MCP App)

The learner learns with Interactive Loom inside this chat. The **Loom MCP App** plays each topic right in the conversation (▶ Play for Present mode, or Read), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive.

## The routine

1. **Find the folder.** Call `read_reference({path:"storage/index.md"})` once: it is the contract for every path below. Find `Loom/` in the learner's drive, read `Loom/index.oui`, and settle which domain the learner is working on (ask when it is not clear, or propose a new one). Read that domain's `domain.oui` and `progress/`. If you find topics or notes in the old flat `Loom/topics/` or `Loom/progress/`, offer once to move them into domains ("Moving from the old layout" in the storage guide). When the Loom server's `learner_summary` tool is there (the server on the learner's computer), call it too with the domain: it also holds what the learner did on that computer.
## Shared authoring workflow (v6)

For a new topic or substantial redesign:

1. Identify the learner, goal, relevant source evidence and prior progress.
2. Discover compact capabilities. Map objective → knowledge structure → learner action → candidate views/interactions → representation and configuration; compare fidelity, perspective coverage, clarity, assessment fit and modeling feasibility. Compare OpenUI tables, cards, diagrams and charts as normal candidates, not only when no native type fits. Keep Bullets for genuine list tasks. Choose the clearest faithful combination, not the cheapest syntax; no ranking or quota. Compare only relevant candidate compositions; read their capability references progressively rather than loading every component. Distinguish presenting, exploring and assessing; each additional page must serve a distinct learner action. Read capabilities/index.md through read_reference, then only relevant capability nodes; the plan schema is contracts/topic-plan.schema.json.
3. Use a schemaVersion 1 TopicPlan: topicId, goal, objectives (id, description, optional prerequisiteIds/evidenceOfLearning), and sections (id, title, objectiveRefs, components, activity, optional rationale/evidenceRefs/presentation/assessment). activity is the concrete learner action; explain the representation choice in rationale for new plans, including why relevant alternatives fit less well and any evidence or modeling limits. Use existing rationale, evidenceRefs, presentation and assessment fields; do not invent extra plan fields. A page is a compositional learning unit. components is required and lists the main visual/activity and supporting components from one shared catalog; representation and library are not plan fields. Do not choose a section type or library. Multiple components may cooperate in one learning activity. Every section is root = Page("Title", body, heading?). presentation names target read/present/both and strategy; assessment binds itemRefs to a successCriterion. Record a primary Flowchart view and any narration view transitions in presentation.strategy; for OpenUI name its intended table, cards, chart, Steps or diagram. For Text, name the prose-specific need and why structured candidates fit less well; generic clarity, simplicity or length is not a selection rationale. Keep objective and evidence references consistent; each section needs a distinct contribution.
4. Check objective coverage, prerequisites, supported representations, component availability and declared evidence links before writing OUI. Inspect advisory experience-readiness diagnostics too; resolve them or explicitly justify proceeding. Structural validity is not a judgment of teaching quality. Call validate_topic_plan with {plan}; fix diagnostics before generating.
5. Load the selected section rules, then only the component contracts needed. Focused OpenUI requests include compact section rules and beats; list all actual composition components, while specific model dependencies are included and generic child alternatives remain choices. Use the full guide for extra examples when needed. Retrieve components by canonical name; LessonText and LearningGallery name the Loom-specific components. Use read_reference for contracts/page.md, contracts/topic.md, contracts/narration.md and selected components/<Name>.md. Unknown paths return diagnostics; correct the path rather than silently substituting an easier composition.
6. Write OUI and narration from the checked plan, preserving IDs and exact signatures. Each virtual file requires exactly one root assignment: root = Topic(...) for the manifest, root = Page(...) for a page and root = Narration(...) for narration. Bare calls are not complete source. Use current buffers and targeted dependencies for edits. For reuse or edits, use get_topic_context with authorized current files and an available plan to preserve the selected action/rationale/presentation constraints; omit unnecessary lookups for a new topic.
7. Check each virtual file for its named root and correct document role, then use the existing OUI/narration compiler checks and compare the artifact with the plan, and measure Read/Present at phone/tablet widths when possible. Inspect clipping, fonts, reachable scroll content and narration focus. Repair only affected statements; report checks not run. Compiler validity and section variety are not teaching-quality scores. Use validate_topic({oui, plan}) / validate_section when available. Pass plan to show_topic for browser review. Hosted MCP leaves full compilation/layout to the player/browser; never report them as already checked by the Worker.
8. Show the checked topic and save its exact source through the existing authorized storage workflow. Showing is not a confirmed save. For new topics call show_topic({oui, plan}) after resolving plan diagnostics. Delivery rechecks reachable source components against the exact plan. Repair mismatches and missing fields; design-only exceptions require advisoryResolutions with the current planVersion and a specific explanation. Use intent: reopen only for existing exact source. Read storage references and save only accepted source; showing is not saving.

For a small edit, read affected current source, preserve the existing learning decision, retrieve scoped contracts only as needed, validate and deliver the targeted change. Do not require every tool, a whole-guide reload or a new plan for each minor edit. Assistants own research, reasoning, generation and repair; Loom supplies deterministic contracts and checks.

Include `// @loom-domain <domain-id>` as the second line when the domain is established. For a new topic, read the selected component contracts through `read_reference` after validating the plan. Keep the topic short unless a full lesson was requested.

## Save topics and progress

- **Save immediately after showing.** When the topic belongs to an established domain, save the exact topic passed to `show_topic` as `Loom/<domain-id>/topics/<topic-id>.loom.oui` with the drive connector, with `// @loom-domain <domain-id>` as its second line, and add its `TopicRef` to the domain's `domain.oui` without duplicating an existing reference. Do not end the turn after showing the app: complete this Drive save unless the learner opted out. Local server memory alone does not confirm a Drive save; skip a duplicate write only when the same file and domain index are confirmed saved in the intended synced Drive folder. After a fix or edit, save the updated topic too. Report a successful save with its path; if writing fails or no writable connector is available, say it is not saved and provide the file for manual saving.
- **Save progress.** The app's **Save my progress** button sends a message with a progress note and the path to save it to: save it as it is, with no changes. If you cannot write files, say so and leave the note in the conversation.

When the learner asks where they are in one domain, show it with `show_domain`; when they ask for their library, `show_library` (see "Showing the learner where they are" in `read_reference({path:"storage/index.md"})`). Never show them unasked. To play a topic again, read it from the domain's `topics/` and pass it to `show_topic` (or call `open_topic` when the server has it). Without the app (the chat shows no player), `show_topic` answers with a link that opens the topic in Loom Viewer: give the learner that link.

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

## Planning the next topic

1. Work in one domain: read its `domain.oui` (the learner's goal and the topics in order) and its `progress/` notes, the latest one per topic. Other domains' progress does not count unless the learner asks to connect them.
2. Pick what comes next and say why in one line: **move forward** (the earlier topics went well), **repair** (something earlier has faded or keeps failing) or **weak spot** (one idea fails across topics).
3. **Size it to the moment.** By default write a **short topic**: one idea the learner can take in within a few minutes. Choose the simplest faithful representation or complementary combination, with no fixed section count or order. Bullets can teach linear instructions; Flashcards can introduce definitions; use the other native sections or OpenUI when their capabilities add understanding. Include orientation or an assessment only when it serves this learning goal. Weave in one thing from an earlier topic when it fits, rather than a set share of callbacks. Then talk with the learner in the chat and offer the next short topic.
4. **Write a full lesson only when the learner asks for one** ("a full lesson", "the whole topic", "teach me everything about …", a course or a chapter): then plan complementary sections according to prerequisites, distinct learning contributions and assessment needs. Connect earlier knowledge when it supports this goal, rather than assigning a fixed share of callbacks. Weave an earlier word, step or formula into a new application instead of repeating the same explanation. Include recall or application questions when they provide useful evidence of learning.
5. Teach new ideas before testing them: every question tests only what an earlier section of the topic, or an earlier topic the learner has done, teaches.
6. Keep each section focused and readable; complexity and interactivity need a learning purpose.
7. When a drawing makes the concept easier to understand, include one without waiting for the learner to ask: a labelled Svg schematic for parts, space, a mechanism or a concrete analogy; use a Flowchart for a process, a chart for quantities or a ConceptMap for relationships. Pair it with a short explanation and narration that highlights the important parts one at a time. Label analogies and simplifications, keep labels readable on a phone, and prefer static shapes over decorative animation or filters. For Svg, read the components/Svg.md reference. A picture should teach the idea, not decorate it.
8. Proactively visualize time and quantities when they are central to the explanation; do not wait for the learner to request a chart. Use Timeline for measured start times, duration, parallel work and waiting; a custom Svg can show a qualitative event timeline, LineChart for change over time, HorizontalBarChart for comparing amounts, PieChart or SingleStackedBarChart for a flat share of one whole, BreakdownTree for a hierarchy of quantities or conditional probabilities, and stacked bars for used versus remaining capacity. Request the timeline guide for measured timelines, the breakdown-tree guide for hierarchical shares, and the openui guide for charts and custom Svg. Use source-backed figures for factual claims; clearly label intentional teaching examples as illustrative data. In Present, keep the whole visual visible while several narration steps highlight its phases, points, bars or slices, then explain the takeaway.

## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the main visual or learning activity that teaches that mental model. Rows name learning capabilities; retrieve the selected component contracts. Every authored section is Page(title, body, heading?), without a section-type or library choice. Read its exact component signatures before writing.

Learning-first, representation-aware authoring: learning objective → knowledge structure → learner action → candidate section capabilities → representation and configuration → focused contracts → OUI and narration → validation/repair → delivery. Choose the simplest representation or complementary combination that fully supports the intended learning experience. Native Loom sections and OpenUI are first-class choices; there is no section ranking, visual quota or mandatory sequence.

Compare candidates by knowledge fidelity (preserve information and relationships), learner action (what the learner does), perspective coverage (what additional views reveal), cognitive clarity (avoid unnecessary complexity), assessment suitability (what response demonstrates the outcome) and authoring feasibility (what the evidence can actually model). Record the choice in TopicPlan activity, rationale and presentation.strategy before retrieving exact signatures. Resolve relevant advisory warnings or explicitly justify proceeding; structural validity alone is not experience readiness.

Bullets teach numbered linear procedures, checklists, prerequisites, key points, supporting details and concise summaries. The knowledge itself should fit a list; moving paragraphs into bullet items is not a representation decision. Compare OpenUI compositions proactively: matched attributes in a table, verified use-case examples in cards, spatial mechanisms in labelled Svg, and measured quantities in charts. Simplest means clearest for the learner, not fewest component types or easiest syntax. OpenUI Steps add visual stage guidance; Flowchart teaches interactions, responsibilities, messages, data or states, even in a linear process when perspectives add understanding. Reflection Sequence practises order; User Journey follows a person's experience. Text is appropriate for connected prose, nuanced explanation and argument; consider alternatives when they clarify the objective, without forcing interactivity.

Flashcards introduce definitions and meanings as well as practise recall. OpenUI cards/stacks compare examples, tables compare factual attributes, labelled Svg diagrams explain spatial structure, and charts explain quantities or trends. Empirical charts require supplied or verified data; clearly label illustrative data and never invent benchmark results. Tradeoff Sandbox evaluates options and decisions; Formula Sandbox explores parameter sensitivity. Select the other native sections by their learning purpose below.

For a 3D web research lesson, compare matched capabilities in an OpenUI table, inspect annotated use-case cards, and explain camera/geometry with a labelled Svg when each serves an objective. Bullets can guide real initialization steps; native Flowchart can trace system messages. These are candidates, not a required section mix.

For full lessons, combine sections only when each adds a distinct contribution: e.g. Flowchart explains RAG tool execution, Bullets guides implementation, Scenario explores retrieval failures and Quiz assesses application. Distinguish presentation, exploration and assessment. Viewing, clicking, switching views and flipping cards are engagement, not demonstrated mastery.

Retrieve selected section rules, then canonical component contracts and dependencies. If focused retrieval fails, retry with the exact component names and forceRefresh; then use the selected legacy section guide (omit library/components). For OpenUI, retrieve its section guide and selected component families. If contracts remain unavailable, report the blocker and revise/revalidate the plan only to an equally faithful supported representation; never silently downgrade to Text/Bullets or invent signatures. Focused OpenUI contracts include compact section rules and beats: request only the actual composition components and required model types; permitted generic child alternatives are not all dependencies.

### Choose an activity, then a composition

For each page establish the learning objective, knowledge structure and concrete learner action. Consider feasible alternatives, then explain the selected composition and its limits in the existing plan rationale. Use evidenceRefs for sources, presentation for Read/Present behavior and assessment for observable answers. No additional TopicPlan fields are needed. Supporting components must serve the same main activity; a second page needs a distinct contribution. Do not require a fixed number of components, pages, alternatives or interactions.

| Learner action | Candidate capabilities to inspect | Fit and boundary |
|---|---|---|
| Orient or follow a connected argument | Intro, LessonText | Prose can preserve nuance; exposure is not demonstrated understanding. |
| Follow instructions | Bullets, Steps | Preserve meaningful order; do not flatten comparisons into lists. |
| Learn or recall terms | Flashcards | Definitions and examples support recall; flips do not prove correctness. |
| Classify and distinguish kinds | TaxonomyBrowser | Explore categories and distinctions, then assess classification separately if needed. |
| Compare factual attributes or concrete examples | Table, Card with Stack | Align matching attributes or annotate examples; a table is not a universal decision model. |
| Trace events, ownership or messages | Flowchart | Choose a meaningful view and model real participants; do not invent internals to enable views. |
| Explain relationships or spatial parts | ConceptMap, labelled Svg | Name relationships or show positions; label conceptual models and analogies. |
| Explain foundations and dependencies | PillarLayer | Show what depends on what, not arbitrary decorative layers. |
| Follow a person's experience | UserJourney | Explain goals, actions, responses and friction, distinct from internal system execution. |
| Interpret measured time or quantities | Timeline, BreakdownTree, charts | Use verified measurements or clearly labelled illustrative data. |
| Explore input/output sensitivity | FormulaSandbox | Use a defensible authored formula; sliders do not execute the real system. |
| Compare choices and consequences | TradeoffSandbox, DecisionTree, Scenario | Choose comparative exploration, explicit diagnostic rules or branching consequences. Explain assumptions; avoid a universal winner. |
| Recognize visual examples | LearningGallery, annotated cards | Images must teach recognition, not merely decorate. |
| Apply, reconstruct or explain | Quiz, ReflectionSequence, ReflectionTemplate | Teach the assessed concepts first; correct answers concern the authored exercise. |

For a framework comparison, a table can align APIs, a conceptual demonstration can explain state dependency, and TradeoffSandbox can explore project constraints. Compare relevant alternatives such as ConceptMap or Flowchart for the mechanism, and Scenario or DecisionTree for project choices. Include only distinct contributions. A Loom-local counter is an illustrative model, not execution or benchmarking of actual Svelte/React code. Do not invent productivity or performance scores to justify FormulaSandbox or charts. A linked code example is not evidence of a live execution environment.

Progressive reading stays unchanged: browse capability summaries, open only plausible alternatives, validate the plan, then retrieve exact contracts only for the selected components. Do not load every component contract to fill this decision record.

| Mental model / learning goal | Section type | Learner question and selection cue |
|---|---|---|
| Orientation, purpose and roadmap | `intro` | What will I learn, why does it matter, and where are we going? |
| Definitions, meaning, vocabulary and recall | `flashcards` | What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them. |
| Connected explanation and narrative | `text` | Does this idea need connected prose or narrative? Before choosing Text, consider native sections and OpenUI comparisons, diagrams, tables or charts; use prose when it best teaches the goal. |
| Linear procedures, prerequisites, checklists and key points | `bullets` | Is the task a linear procedure, checklist, key points or summary? Preserve comparative, spatial and relational structure when a table or diagram teaches it better. |
| Visual recognition and concrete references | `image-gallery` | What does it look like? Compare examples, textures, objects or screenshots. |
| Classification and distinctions | `taxonomy-browser` | What kinds exist, what defines them, and how do I recognise their differences? |
| Relationships between concepts | `concept-map` | How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly. |
| Layered dependency and foundation | `pillar-layer` | What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application. |
| Process, responsibility and interaction | `flowchart` | What happens, what triggers it, who handles it, and how do participants interact? Choose the view from the table below. |
| A person’s experience with a product or service | `user-journey` | What does the person want, do and experience at each stage, and how can friction be resolved? |
| Measured time, duration, overlap and waiting | `timeline` | When does each task start and finish, what runs together, and what must wait? |
| Parts of a measurable whole and conditional probability | `breakdown-tree` | How does a total divide through a hierarchy? Use quantity mode for costs/counts and probability mode for conditional branches and path probabilities. |
| Presenting options, comparing alternatives and trade-offs | `tradeoff-sandbox` | What are my options, how do they compare, and when should I choose each? Show strengths, limitations, gains, costs and suitability; a recommendation can explain why an option fits. Use this for option comparison even without formal mathematical optimisation. |
| Input–output relationships and sensitivity | `formula-sandbox` | How does changing an input change a calculated result? Let the learner vary inputs to an authored formula. |
| Rule-based diagnosis and selection | `decision-tree` | Which option fits my situation after answering a sequence of questions? |
| Consequences across decisions | `scenario` | What happens if I choose this, then make another decision? Explore authored paths and outcomes. |
| Checking understanding and applying knowledge | `quiz` | Can I answer or apply what has already been taught? |
| Reconstructing order and procedure | `reflection-sequence` | Can I arrange the supplied steps into the correct sequence? |
| Structured reasoning and explanation | `reflection-template` | Can I complete a sound explanation using the supplied concepts and sentence blanks? |
| Factual comparisons, visual examples, spatial diagrams and data | `openui` | Would a chart, table, simple procedure, drawing, analogy or mixed composition express this idea best? See the visual choices below. |

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

### Choosing an OpenUI visual

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
| Look up or compare factual attributes | Table |
| Explain spatial structure, anatomy, a mechanism or a concrete analogy | Labelled Svg drawing |
| Explain a straightforward procedure | Steps |

### Applying the selection

- Flashcards can define and introduce a concept before the learner has memorised it. Put the term or question on the front and a concise meaning on the back; use examples or dialogue when helpful. They are a teaching format as well as a recall activity. Use Text or OpenUI when a longer connected explanation is needed.
- Tradeoff Sandbox also presents choices and compares alternatives. Choose it when the learner needs to evaluate options, their strengths and weaknesses, or suitability for a situation. A simple factual lookup matrix can use an OpenUI Table; input-driven calculations belong in Formula Sandbox.
- A Tradeoff Sandbox can contain multiple situations to teach how to choose between alternatives. Reuse comparable choices across contrasting situations, but vary the goals, constraints and priorities so the learner sees when each option fits. For HTTP versus WebSocket, contrast an ordinary resource API with a bidirectional live collaboration application; explain each situation's gains, costs and recommendation rather than declaring one universal winner. Use a Table for factual differences; use Tradeoff Sandbox when the comparison teaches selection and consequences. Several situations remain one main activity on one page, with internal automatic Present scenes; split pages when the learning purpose changes or the content becomes too dense. Recommendations must follow the authored situation, and numerical scores must be sourced or visibly labelled illustrative.
- Keep the distinctions explicit: Taxonomy classifies; Breakdown Tree divides a measurable whole. Pillar Layer shows foundations; Flowchart shows process. Sequence shows interaction order; Timeline shows measured time. Decision Tree selects by rules; Scenario explores consequences.
- Select only the sections that help this topic. This is a catalogue of teaching choices, not a mandatory lesson sequence or a requirement to include every type. A focused explanation may use one strong section; a fuller topic can introduce meanings, show relationships or a mechanism, compare options, then practise applying the idea.
- Read and Present deliver the same mental model. Read supports inspection and learner interaction; Present guides attention with narration and focus. Use each section's documented beats and view controls. In Present, quiz and reflection answers can be demonstrated by the stage; they are learner practice in the interactive Read mode.


## While the learner works

- Explain in the conversation when they ask, in the language they write in. Hint before giving an answer.
- Say what comes from the topic and what from your own knowledge.
- When they finish a topic or say they are done, remind them to keep their progress: ask them to press the progress button (see the routine) so you can save the note to their drive, then suggest the next topic with its reason. Do not let a session end with unsaved progress without saying so once.
