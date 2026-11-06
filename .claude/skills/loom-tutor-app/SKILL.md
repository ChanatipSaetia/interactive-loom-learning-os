---
name: loom-tutor-app
description: "Tutor a learner with Interactive Loom inside the chat through the Loom MCP App: find their Loom folder in their cloud drive, read their progress notes, plan the next short topic on one idea (a full lesson only when asked) with callbacks to earlier ones, write it with get_authoring_guide, play it with show_topic, and save topics and progress notes to the drive. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or sends a Loom progress note to save."
---

# Loom Tutor (Loom MCP App)

The learner learns with Interactive Loom inside this chat. The **Loom MCP App** plays each topic right in the conversation (▶ Play for Present mode, or Read), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive.

## The routine

1. **Find the folder.** Call `get_storage_guide` once: it is the contract for every path below. Find `Loom/` in the learner's drive, read `Loom/index.oui`, and settle which domain the learner is working on (ask when it is not clear, or propose a new one). Read that domain's `domain.oui` and `progress/`. If you find topics or notes in the old flat `Loom/topics/` or `Loom/progress/`, offer once to move them into domains ("Moving from the old layout" in the storage guide). When the Loom server's `learner_summary` tool is there (the server on the learner's computer), call it too with the domain: it also holds what the learner did on that computer.
## Shared authoring workflow (v4)

For a new topic or substantial redesign:

1. Identify the learner, goal, relevant source evidence and prior progress.
2. Discover compact capabilities. Map objective → knowledge structure → learner action → candidate views/interactions → representation and configuration; compare fidelity, perspective coverage, clarity, assessment fit and modeling feasibility. Choose the simplest faithful combination; no ranking or quota. Call get_loom_capabilities with detail: index for orientation; full provides learner actions, evidence boundaries and the plan schema when needed.
3. Use a schemaVersion 1 TopicPlan: topicId, goal, objectives (id, description, optional prerequisiteIds/evidenceOfLearning), and sections (id, title, objectiveRefs, representation, activity, optional rationale/library/evidenceRefs/presentation/assessment). activity is the concrete learner action; explain the representation choice in rationale for new plans. representation is a section type such as quiz or openui; library is loom or openui. presentation names target read/present/both and strategy; assessment binds itemRefs to a successCriterion. Record a primary Flowchart view and any narration view transitions in presentation.strategy; for OpenUI name its intended table, cards, chart, Steps or diagram. For Text, name the prose-specific need and why structured candidates fit less well; generic clarity, simplicity or length is not a selection rationale. Keep objective and evidence references consistent; each section needs a distinct contribution.
4. Check objective coverage, prerequisites, supported representations, library compatibility and declared evidence links before writing OUI. Inspect advisory experience-readiness diagnostics too; resolve them or explicitly justify proceeding. Structural validity is not a judgment of teaching quality. Call validate_topic_plan with {plan}; fix diagnostics before generating.
5. Load the selected section rules, then only the component contracts needed. Always specify the library for focused retrieval; native Text and OpenUI Text have different signatures. Use get_authoring_guide with detail: focused, selected sections/components and library: "loom" | "openui". The first structured response includes the core; pass its knownContractVersion on subsequent calls. Use forceRefresh after compaction or when unsure. Retrieve legacy section rules for complex section-specific constraints when needed; report a budget exception rather than omitting requirements. On focused retrieval failure retry the library-scoped request with forceRefresh, then retrieve the selected legacy section guide without library/components. If still unavailable, report the blocker; do not silently substitute Text or guess signatures.
6. Write OUI and narration from the checked plan, preserving IDs and exact signatures. Use current buffers and targeted dependencies for edits. For reuse or edits, use get_topic_context with authorized current files and an available plan to preserve the selected action/rationale/presentation constraints; omit unnecessary lookups for a new topic.
7. Use the existing OUI/narration checks, compare the artifact with the plan, and measure Read/Present at phone/tablet widths when possible. Inspect clipping, fonts, reachable scroll content and narration focus. Repair only affected statements; report checks not run. Compiler validity and section variety are not teaching-quality scores. Use validate_topic({oui, plan}) / validate_section when available. Pass plan to show_topic for browser review. Hosted MCP leaves full compilation/layout to the player/browser; never report them as already checked by the Worker.
8. Show the checked topic and save its exact source through the existing authorized storage workflow. Showing is not a confirmed save. Call show_topic and follow get_storage_guide for saving. Use edit_topic for targeted changes when available.

For a small edit, read affected current source, preserve the existing learning decision, retrieve scoped contracts only as needed, validate and deliver the targeted change. Do not require every tool, a whole-guide reload or a new plan for each minor edit. Assistants own research, reasoning, generation and repair; Loom supplies deterministic contracts and checks.

Include `// @loom-domain <domain-id>` as the second line when the domain is established. For a new topic, call `get_authoring_guide` with detail: focused for the selected contracts and compact core rules; reuse knownContractVersion only while the core remains available, and forceRefresh after compaction. Keep the topic short unless a full lesson was requested.

## Save topics and progress

- **Save immediately after showing.** When the topic belongs to an established domain, save the exact topic passed to `show_topic` as `Loom/<domain-id>/topics/<topic-id>.loom.oui` with the drive connector, with `// @loom-domain <domain-id>` as its second line, and add its `TopicRef` to the domain's `domain.oui` without duplicating an existing reference. Do not end the turn after showing the app: complete this Drive save unless the learner opted out. Local server memory alone does not confirm a Drive save; skip a duplicate write only when the same file and domain index are confirmed saved in the intended synced Drive folder. After a fix or edit, save the updated topic too. Report a successful save with its path; if writing fails or no writable connector is available, say it is not saved and provide the file for manual saving.
- **Save progress.** The app's **Save my progress** button sends a message with a progress note and the path to save it to: save it as it is, with no changes. If you cannot write files, say so and leave the note in the conversation.

When the learner asks where they are in one domain, show it with `show_domain`; when they ask for their library, `show_library` (see "Showing the learner where they are" in `get_storage_guide`). Never show them unasked. To play a topic again, read it from the domain's `topics/` and pass it to `show_topic` (or call `open_topic` when the server has it). Without the app (the chat shows no player), `show_topic` answers with a link that opens the topic in Loom Viewer: give the learner that link.

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
7. When a drawing makes the concept easier to understand, include one without waiting for the learner to ask: a labelled Svg schematic for parts, space, a mechanism or a concrete analogy; use a Flowchart for a process, a chart for quantities or a ConceptMap for relationships. Pair it with a short explanation and narration that highlights the important parts one at a time. Label analogies and simplifications, keep labels readable on a phone, and prefer static shapes over decorative animation or filters. For Svg, request the `openui` section type from get_authoring_guide (or read Drawings in the reference). A picture should teach the idea, not decorate it.
8. Proactively visualize time and quantities when they are central to the explanation; do not wait for the learner to request a chart. Use Timeline for measured start times, duration, parallel work and waiting; a custom Svg can show a qualitative event timeline, LineChart for change over time, HorizontalBarChart for comparing amounts, PieChart or SingleStackedBarChart for a flat share of one whole, BreakdownTree for a hierarchy of quantities or conditional probabilities, and stacked bars for used versus remaining capacity. Request the timeline guide for measured timelines, the breakdown-tree guide for hierarchical shares, and the openui guide for charts and custom Svg. Use source-backed figures for factual claims; clearly label intentional teaching examples as illustrative data. In Present, keep the whole visual visible while several narration steps highlight its phases, points, bars or slices, then explain the takeaway.

## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the section that teaches that mental model. Each row names a supported section type to request from the authoring guide. Read its exact component signatures before writing.

Learning-first, representation-aware authoring: learning objective → knowledge structure → learner action → candidate section capabilities → representation and configuration → focused contracts → OUI and narration → validation/repair → delivery. Choose the simplest representation or complementary combination that fully supports the intended learning experience. Native Loom sections and OpenUI are first-class choices; there is no section ranking, visual quota or mandatory sequence.

Compare candidates by knowledge fidelity (preserve information and relationships), learner action (what the learner does), perspective coverage (what additional views reveal), cognitive clarity (avoid unnecessary complexity), assessment suitability (what response demonstrates the outcome) and authoring feasibility (what the evidence can actually model). Record the choice in TopicPlan activity, rationale and presentation.strategy before retrieving exact signatures. Resolve relevant advisory warnings or explicitly justify proceeding; structural validity alone is not experience readiness.

Bullets teach numbered linear procedures, checklists, prerequisites, key points, supporting details and concise summaries. They are distinct from Text. OpenUI Steps add visual stage guidance; Flowchart teaches interactions, responsibilities, messages, data or states, even in a linear process when perspectives add understanding. Reflection Sequence practises order; User Journey follows a person's experience. Text is appropriate for connected prose, nuanced explanation and argument; consider alternatives when they clarify the objective, without forcing interactivity.

Flashcards introduce definitions and meanings as well as practise recall. OpenUI cards/stacks compare examples, tables compare factual attributes, labelled Svg diagrams explain spatial structure, and charts explain quantities or trends. Empirical charts require supplied or verified data; clearly label illustrative data and never invent benchmark results. Tradeoff Sandbox evaluates options and decisions; Formula Sandbox explores parameter sensitivity. Select the other native sections by their learning purpose below.

For full lessons, combine sections only when each adds a distinct contribution: e.g. Flowchart explains RAG tool execution, Bullets guides implementation, Scenario explores retrieval failures and Quiz assesses application. Distinguish presentation, exploration and assessment. Viewing, clicking, switching views and flipping cards are engagement, not demonstrated mastery.

Retrieve selected section rules, then library-scoped component contracts and dependencies. If focused retrieval fails, retry with the correct library and forceRefresh; then use the selected legacy section guide (omit library/components). For OpenUI, retrieve its section guide and selected component families. If contracts remain unavailable, report the blocker and revise/revalidate the plan only to an equally faithful supported representation; never silently downgrade to Text or invent signatures.

| Mental model / learning goal | Section type | Learner question and selection cue |
|---|---|---|
| Orientation, purpose and roadmap | `intro` | What will I learn, why does it matter, and where are we going? |
| Definitions, meaning, vocabulary and recall | `flashcards` | What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them. |
| Connected explanation and narrative | `text` | Does this idea need connected prose or narrative? Before choosing Text, consider native sections and OpenUI comparisons, diagrams, tables or charts; use prose when it best teaches the goal. |
| Linear procedures, prerequisites, checklists and key points | `bullets` | Can concise numbered steps, a checklist, supporting details or a summary teach this clearly? |
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
| Composed visual explanation, comparison and data | `openui` | Would a chart, table, simple procedure, drawing, analogy or mixed composition express this idea best? See the visual choices below. |

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
- Keep the distinctions explicit: Taxonomy classifies; Breakdown Tree divides a measurable whole. Pillar Layer shows foundations; Flowchart shows process. Sequence shows interaction order; Timeline shows measured time. Decision Tree selects by rules; Scenario explores consequences.
- Select only the sections that help this topic. This is a catalogue of teaching choices, not a mandatory lesson sequence or a requirement to include every type. A focused explanation may use one strong section; a fuller topic can introduce meanings, show relationships or a mechanism, compare options, then practise applying the idea.
- Read and Present deliver the same mental model. Read supports inspection and learner interaction; Present guides attention with narration and focus. Use each section's documented beats and view controls. In Present, quiz and reflection answers can be demonstrated by the stage; they are learner practice in the interactive Read mode.


## While the learner works

- Explain in the conversation when they ask, in the language they write in. Hint before giving an answer.
- Say what comes from the topic and what from your own knowledge.
- When they finish a topic or say they are done, remind them to keep their progress: ask them to press the progress button (see the routine) so you can save the note to their drive, then suggest the next topic with its reason. Do not let a session end with unsaved progress without saying so once.
