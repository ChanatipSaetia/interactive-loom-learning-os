## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the main visual or learning activity that teaches that mental model. Rows name learning capabilities; retrieve the selected component contracts. Every authored section is Page(title, body, heading?), without a section-type or library choice. Read its exact component signatures before writing.

Learning-first, representation-aware authoring: learning objective → knowledge structure → learner action → candidate section capabilities → representation and configuration → focused contracts → OUI and narration → validation/repair → delivery. Choose the simplest representation or complementary combination that fully supports the intended learning experience. Text, layouts, visuals and prebuilt activities share one catalog; there is no section ranking, visual quota or mandatory sequence.

Compare candidates by knowledge fidelity (preserve information and relationships), learner action (what the learner does), perspective coverage (what additional views reveal), cognitive clarity (avoid unnecessary complexity), assessment suitability (what response demonstrates the outcome) and authoring feasibility (what the evidence can actually model). Record the choice in TopicPlan activity, rationale and presentation.strategy before retrieving exact signatures. Resolve relevant advisory warnings or explicitly justify proceeding; structural validity alone is not experience readiness.

Bullets teach numbered linear procedures, checklists, prerequisites, key points, supporting details and concise summaries. The knowledge itself should fit a list; moving paragraphs into bullet items is not a representation decision. Compare compositions proactively: matched attributes in a table, verified use-case examples in cards, spatial mechanisms in labelled Svg, and measured quantities in charts. Simplest means clearest for the learner, not fewest component types or easiest syntax. Steps add visual stage guidance; Flowchart teaches interactions, responsibilities, messages, data or states, even in a linear process when perspectives add understanding. Reflection Sequence practises order; User Journey follows a person's experience. Text is appropriate for connected prose, nuanced explanation and argument; consider alternatives when they clarify the objective, without forcing interactivity.

Flashcards introduce definitions and meanings as well as practise recall. Cards/stacks compare examples, tables compare factual attributes, labelled Svg diagrams explain spatial structure, and charts explain quantities or trends. Empirical charts require supplied or verified data; clearly label illustrative data and never invent benchmark results. Tradeoff Sandbox explains comparisons as well as contextual decisions; Formula Sandbox explores parameter sensitivity. Select other prebuilt activities by their learning purpose below.

For a 3D web research lesson, compare matched capabilities in a Table, inspect annotated use-case cards, and explain camera/geometry with a labelled Svg when each serves an objective. Bullets can guide real initialization steps; Flowchart can trace system messages. These are candidates, not a required section mix.

For full lessons, combine sections only when each adds a distinct contribution: e.g. Flowchart explains RAG tool execution, Bullets guides implementation, Scenario explores retrieval failures and Quiz assesses application. Distinguish presentation, exploration and assessment. Viewing, clicking, switching views and flipping cards are engagement, not demonstrated mastery.

Read only plausible capability summaries, then the exact contracts and required model dependencies of the selected components. Prebuilt activities package reusable interactions and presentation scenes; select them by fit, just like tables, text or controls. If a contract is unavailable, correct the path or explicitly revise and revalidate the plan; never silently downgrade to prose or invent signatures. Generic child alternatives are choices, not dependencies.

### Choose an activity, then a composition

For each page establish the learning objective, knowledge structure and concrete learner action. For every candidate ask what it can introduce, what learners can explore, what their response demonstrates and what its limits are. Read those four teaching-purpose fields in the relevant capability or component reference; do not load every component guide. Consider feasible alternatives, then explain the selected composition and its limits in the existing plan rationale. Use evidenceRefs for sources, presentation for Read/Present behavior and assessment for observable answers. No additional TopicPlan fields are needed. Supporting components must serve the same main activity; a second page needs a distinct contribution. Do not require a fixed number of components, pages, alternatives or interactions.

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
