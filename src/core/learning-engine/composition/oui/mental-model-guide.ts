/** Shared selection policy for one purpose-based component catalog. */
export const REPRESENTATION_SELECTION_GUIDE = `Learning-first, representation-aware authoring: learning objective → knowledge structure → learner action → candidate section capabilities → representation and configuration → focused contracts → OUI and narration → validation/repair → delivery. Choose the simplest representation or complementary combination that fully supports the intended learning experience. Text, layouts, visuals and prebuilt activities share one catalog; there is no section ranking, visual quota or mandatory sequence.

Compare candidates by knowledge fidelity (preserve information and relationships), learner action (what the learner does), perspective coverage (what additional views reveal), cognitive clarity (avoid unnecessary complexity), assessment suitability (what response demonstrates the outcome) and authoring feasibility (what the evidence can actually model). Record the choice in TopicPlan activity, rationale and presentation.strategy before retrieving exact signatures. Resolve relevant advisory warnings or explicitly justify proceeding; structural validity alone is not experience readiness.

Bullets teach numbered linear procedures, checklists, prerequisites, key points, supporting details and concise summaries. The knowledge itself should fit a list; moving paragraphs into bullet items is not a representation decision. Compare compositions proactively: matched attributes in a table, verified use-case examples in cards, spatial mechanisms in labelled Svg, and measured quantities in charts. Simplest means clearest for the learner, not fewest component types or easiest syntax. Steps add visual stage guidance; Flowchart teaches interactions, responsibilities, messages, data or states, even in a linear process when perspectives add understanding. Reflection Sequence practises order; User Journey follows a person's experience. Text is appropriate for connected prose, nuanced explanation and argument; consider alternatives when they clarify the objective, without forcing interactivity.

Flashcards introduce definitions and meanings as well as practise recall. Cards/stacks compare examples, tables compare factual attributes, labelled Svg diagrams explain spatial structure, and charts explain quantities or trends. Empirical charts require supplied or verified data; clearly label illustrative data and never invent benchmark results. Tradeoff Sandbox explains comparisons as well as contextual decisions; Formula Sandbox explores parameter sensitivity. Select other prebuilt activities by their learning purpose below.

For a 3D web research lesson, compare matched capabilities in a Table, inspect annotated use-case cards, and explain camera/geometry with a labelled Svg when each serves an objective. Bullets can guide real initialization steps; Flowchart can trace system messages. These are candidates, not a required section mix.

For full lessons, combine sections only when each adds a distinct contribution: e.g. Flowchart explains RAG tool execution, Bullets guides implementation, Scenario explores retrieval failures and Quiz assesses application. Distinguish presentation, exploration and assessment. Viewing, clicking, switching views and flipping cards are engagement, not demonstrated mastery.

Read only plausible capability summaries, then the exact contracts and required model dependencies of the selected components. Prebuilt activities package reusable interactions and presentation scenes; select them by fit, just like tables, text or controls. If a contract is unavailable, correct the path or explicitly revise and revalidate the plan; never silently downgrade to prose or invent signatures. Generic child alternatives are choices, not dependencies.`

/** Shared comparison guidance for selection and focused component contracts. */
export const TRADEOFF_COMPARISON_GUIDE = `TradeoffSandbox is a first-class comparison component, including when the learner only asks how alternatives differ. Table provides a compact factual overview; TradeoffSandbox supports an explained comparison across shared criteria, strengths, limitations and practical consequences. Choose by learning value, without requiring a winner or a fixed component mix.

For Svelte versus React, compare the same criteria for each option, such as reactivity, setup and ecosystem, and explain what each difference means in practice. Use a comparison step per useful criterion with the same alternatives; keep descriptions and pros/cons specific to that criterion. A project situation can follow if it adds a distinct learning contribution. Do not invent performance or productivity scores.

A qualitative comparison needs no scores, sliders, recommendation or multiple situations. With the current contract, use one TradeoffScenario as the comparison container, metrics: [] and choice metrics: {}; omit recommended, whyThisFits and whenToUse unless useful. These are existing positional fields, not new mode flags. Present guides the authored comparisons; Read supports exploration. Inspecting or selecting an option is engagement, not evidence of a justified decision.`

/** Purpose guidance reused in planning and only the relevant focused contracts. */
export const PROCEDURE_TEACHING_GUIDE = `For a procedure, ask whether the learner needs to execute instructions, understand their structure, or practise their order. Steps, Bullets and Flowchart are peer candidates: Steps guides instructions with explanations or code, Bullets supports concise checklists and prerequisites, and Flowchart explains sequence, dependencies, branches, responsibilities and consequences. A linear procedure can justify Flowchart when the connections help explain it; branching or multiple participants are not selection prerequisites. The existing Flowchart contract still applies: model only supported participants, events and relationships; never invent actors or events just to use it.

For creating a Svelte app, Steps can guide installation, project creation and running commands; Flowchart can explain the edit-to-browser-update process. ReflectionSequence can optionally assess reconstructing a taught order. These serve distinct learning needs, not a mandatory sequence or component mix. Present demonstrations and checklist clicks do not prove procedural skill.`

export const TAXONOMY_TEACHING_GUIDE = `TaxonomyBrowser introduces and explains meaningful kinds as well as supporting classification. Each category should state its defining features, give examples and distinguish nearby categories. Compare a compact Table or grouped cards for scanning, ConceptMap for labelled relationships and DecisionTree for rule-based identification. Select by the learner's question, without requiring every representation.

For an introduction to Svelte, categories could organize components, reactivity, composition and lifecycle when their scope is clearly explained. Categories may overlap; explain shared examples instead of forcing a mutually exclusive partition. Use parent-child relationships only when the subject supports them. The current TaxonomyBrowser contract is a flat category browser: describe relevant relationships in its existing fields or select a suitable relationship component; do not invent nested category or parent fields. Preserve dependencies and process order through an appropriate representation. Browsing is exploration; classification practice requires an observable learner response.`

export const FLASHCARD_TEACHING_GUIDE = `Flashcards teach individual concepts on first encounter as well as practising recall. Use a focused term or question on the front and one coherent explanation on the back, supported by a concise example, dialogue or common mistake when useful. For Svelte, a $state card can introduce its meaning, a small example and a misconception before recall practice. Keep one focused idea per card; use TextContent for a connected explanation and TaxonomyBrowser to organize kinds or distinguish categories.

Use the existing Flashcard fields: word carries the front's term or question, and shortDefinition, detailedDefinition and optional dialogue carry the explanation and examples. Do not invent prompt, answer or automatic-grading fields. Read lets the learner attempt recall and reveal the explanation; Present demonstrates front and back. Flipping or viewing a card records exposure, not correctness or mastery. Add a grounded assessment only when the learning goal requires observable evidence.`

/** A targeted selection leaf: candidates, not a mandatory component mix. */
export const COMPOSITION_DECISION_GUIDE = `### Choose an activity, then a composition

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

Progressive reading stays unchanged: browse capability summaries, open only plausible alternatives, validate the plan, then retrieve exact contracts only for the selected components. Do not load every component contract to fill this decision record.`

/** Compact skill entry point; detailed policy stays in planning references. */
export const REPRESENTATION_SELECTION_OVERVIEW = `Learning-first, representation-aware: objective → knowledge structure → learner action → candidate capabilities → simplest faithful representation/configuration. Compare knowledge fidelity, learner action, perspective coverage, cognitive clarity, assessment suitability and authoring feasibility. All components are peers; prebuilt activities are conveniences, not a preferred tier; no section ranking, visual quota or mandatory sequence. Bullets teach numbered linear procedures and checklists; a list is not a universal replacement for prose. Consider Tables for attributes, cards for examples and Svg for spatial mechanisms. Flashcards introduce definitions. Text can teach connected prose and nuance. Tables compare facts, cards compare examples, diagrams explain space and charts require supplied/verified or labelled illustrative data; never invent benchmark results. Record rationale and presentation strategy, resolve relevant readiness warnings, then retrieve focused contracts. TradeoffSandbox also teaches explained comparisons without a decision or scores. See planning references for views, evidence boundaries and safe retrieval fallback.`

/** Shared table of contents for the writer, tutor skills and scoped authoring guides. */
export const SECTION_MENTAL_MODELS = [
  { type: 'intro', model: 'Orientation, purpose and roadmap', question: 'What will I learn, why does it matter, and where are we going?' },
  { type: 'flashcards', model: 'Definitions, meaning, vocabulary and recall', question: 'What does this term or concept mean? Introduce or recall one focused idea per card, with a coherent explanation and concise example or dialogue. A flip is exposure, not correctness.' },
  { type: 'text', model: 'Connected explanation and narrative', question: 'Does this idea need connected prose or narrative? Before choosing TextContent, consider comparisons, diagrams, tables or charts; use prose when it best teaches the goal.' },
  { type: 'bullets', model: 'Linear procedures, prerequisites, checklists and key points', question: 'Is the task a linear procedure, checklist, key points or summary? Preserve comparative, spatial and relational structure when a table or diagram teaches it better.' },
  { type: 'image-gallery', model: 'Visual recognition and concrete references', question: 'What does it look like? Compare examples, textures, objects or screenshots.' },
  { type: 'taxonomy-browser', model: 'Classification and distinctions', question: 'What kinds exist, what defines them, and how do I recognise their differences? Introduce meaningful categories with examples and explain overlaps; use relationships only when the subject supports them.' },
  { type: 'concept-map', model: 'Relationships between concepts', question: 'How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly.' },
  { type: 'pillar-layer', model: 'Layered dependency and foundation', question: 'What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application.' },
  { type: 'flowchart', model: 'Process, responsibility and interaction', question: 'How do procedure steps connect, depend on one another or branch? What happens, what triggers it, and who handles it? Linear procedures are candidates too; choose a view supported by the actual model.' },
  { type: 'user-journey', model: 'A person’s experience with a product or service', question: 'What does the person want, do and experience at each stage, and how can friction be resolved?' },
  { type: 'timeline', model: 'Measured time, duration, overlap and waiting', question: 'When does each task start and finish, what runs together, and what must wait?' },
  { type: 'breakdown-tree', model: 'Parts of a measurable whole and conditional probability', question: 'How does a total divide through a hierarchy? Use quantity mode for costs/counts and probability mode for conditional branches and path probabilities.' },
  { type: 'tradeoff-sandbox', model: 'Presenting options, comparing alternatives and trade-offs', question: 'What are my options and how do they differ across shared criteria? Explain strengths, limitations and consequences even without a decision request. Contextual suitability and recommendations are optional; no scoring or mathematical optimisation is required.' },
  { type: 'formula-sandbox', model: 'Input–output relationships and sensitivity', question: 'How does changing an input change a calculated result? Let the learner vary inputs to an authored formula.' },
  { type: 'decision-tree', model: 'Rule-based diagnosis and selection', question: 'Which option fits my situation after answering a sequence of questions?' },
  { type: 'scenario', model: 'Consequences across decisions', question: 'What happens if I choose this, then make another decision? Explore authored paths and outcomes.' },
  { type: 'quiz', model: 'Checking understanding and applying knowledge', question: 'Can I answer or apply what has already been taught?' },
  { type: 'reflection-sequence', model: 'Reconstructing order and procedure', question: 'Can I arrange the supplied steps into the correct sequence?' },
  { type: 'reflection-template', model: 'Structured reasoning and explanation', question: 'Can I complete a sound explanation using the supplied concepts and sentence blanks?' },
  { type: 'openui', model: 'Factual comparisons, visual examples, spatial diagrams and data', question: 'Would a chart, table, simple procedure, drawing, analogy or mixed composition express this idea best? See the visual choices below.' },
] as const

/** Discovery evidence, not a renderer ranking or proof of learning. */
export const SECTION_LEARNING_BEHAVIORS: Record<typeof SECTION_MENTAL_MODELS[number]['type'], {
  learnerAction: string; presentationConstraint: string; evidenceBoundary: string
}> = {
  intro: { learnerAction: 'Read the purpose and roadmap.', presentationConstraint: 'Orient attention; keep the opening focused.', evidenceBoundary: 'Reading is engagement, not demonstrated understanding.' },
  text: { learnerAction: 'Read a connected explanation or argument.', presentationConstraint: 'Keep prose readable in Read and Present; check long paragraphs at phone width.', evidenceBoundary: 'Prose can be the right representation; viewing it is not assessment.' },
  bullets: { learnerAction: 'Follow numbered instructions, check prerequisites or inspect key points and supporting details.', presentationConstraint: 'Use documented item beats; avoid turning every item into a paragraph wall.', evidenceBoundary: 'A checklist presentation does not demonstrate procedural skill.' },
  flashcards: { learnerAction: 'Try recall, then flip to inspect a definition or example.', presentationConstraint: 'Present demonstrates front/back; use Read for learner-controlled recall.', evidenceBoundary: 'A flip records exposure, not correctness of unauthored recall.' },
  'image-gallery': { learnerAction: 'Inspect and compare visual examples.', presentationConstraint: 'Check image labels and legibility at the actual viewport.', evidenceBoundary: 'Visual inspection alone does not establish recognition accuracy.' },
  'taxonomy-browser': { learnerAction: 'Discover kinds, inspect examples and distinguish categories, including explained overlaps.', presentationConstraint: 'Use focused category beats instead of a dense classification dump.', evidenceBoundary: 'Category exploration is engagement, not a classification test.' },
  'concept-map': { learnerAction: 'Inspect concepts and their labelled relationships.', presentationConstraint: 'Check that labels and connections remain readable at phone width.', evidenceBoundary: 'A displayed relationship does not show the learner can explain it.' },
  'pillar-layer': { learnerAction: 'Inspect layers and what each foundation supports.', presentationConstraint: 'Keep layer labels short and inspect the complete stack in Read.', evidenceBoundary: 'Layer inspection alone does not demonstrate dependency reasoning.' },
  flowchart: { learnerAction: 'Step through events, responsibilities and handoffs in the appropriate view.', presentationConstraint: 'Select the documented process view and inspect graph labels at the viewport.', evidenceBoundary: 'Stepping through a process is engagement; test application separately.' },
  'user-journey': { learnerAction: 'Inspect stages, goals, friction and improvements in a person’s journey.', presentationConstraint: 'Focus on one stage at a time; check horizontal content remains reachable.', evidenceBoundary: 'Stage selection is exploration, not evidence of diagnosing friction.' },
  timeline: { learnerAction: 'Inspect start times, durations, overlap and waiting.', presentationConstraint: 'Time geometry must use authored measurements; verify labels and scale.', evidenceBoundary: 'Selection is exploration; interpretation needs a learner response.' },
  'breakdown-tree': { learnerAction: 'Explore how a quantity or probability divides through branches.', presentationConstraint: 'Preserve visible totals and branch labels; inspect deep trees in Read.', evidenceBoundary: 'Expansion is engagement; it does not establish quantitative reasoning.' },
  'tradeoff-sandbox': { learnerAction: 'Compare options across shared criteria and explain strengths, limitations and consequences; optionally explore suitability for a situation.', presentationConstraint: 'Present guides option comparisons; Read supports learner exploration.', evidenceBoundary: 'Exploring options does not prove a justified decision.' },
  'formula-sandbox': { learnerAction: 'Vary inputs and observe authored calculated outputs.', presentationConstraint: 'Present demonstrates chosen inputs; Read is needed for learner experiments.', evidenceBoundary: 'Slider movement is engagement, not correctness or causal understanding.' },
  'decision-tree': { learnerAction: 'Answer branching questions to inspect a rule-based recommendation.', presentationConstraint: 'Present demonstrates a path; Read lets the learner choose branches.', evidenceBoundary: 'A reached recommendation is not an assessment score.' },
  scenario: { learnerAction: 'Choose authored decisions and inspect consequences.', presentationConstraint: 'Present demonstrates paths; Read permits learner decisions.', evidenceBoundary: 'An explored consequence is not independently verified mastery.' },
  quiz: { learnerAction: 'Submit an answer and inspect authored feedback.', presentationConstraint: 'Present demonstrates answers; Read captures learner attempts.', evidenceBoundary: 'Explicit correct/wrong attempts are evidence; views and stage demonstrations are not mastery.' },
  'reflection-sequence': { learnerAction: 'Reconstruct the order of supplied steps and check the answer.', presentationConstraint: 'Present demonstrates reconstruction; Read supports learner attempts.', evidenceBoundary: 'Correctness concerns this authored sequence, not general mastery.' },
  'reflection-template': { learnerAction: 'Complete an explanation from supplied concepts and sentence blanks.', presentationConstraint: 'Present demonstrates a completed explanation; use Read for attempts.', evidenceBoundary: 'Explicit results concern this exercise, not independent free-text reasoning.' },
  openui: { learnerAction: 'Inspect or interact with an authored composition of cards, diagrams, tables or charts.', presentationConstraint: 'Use supported child beats and narration targets; measure dense tables/charts at phone width.', evidenceBoundary: 'Component presence is not proof of meaningful interaction. Use verified or labelled illustrative chart data; static tables are valid for factual comparison.' },
}

export const FLOWCHART_MODELS = [
  ['event-storming', 'Event → policy → command → system → resulting event; explain triggers and rules.'],
  ['architecture', 'Components, their responsibilities and their connections.'],
  ['swimlanes', 'Ownership and handoffs between participants.'],
  ['sequence', 'Who sends what to whom, and in what order; vertical spacing is not measured duration.'],
  ['data-flow', 'What information moves between components.'],
  ['state-machine', 'How events change the state of something.'],
] as const

export const OPENUI_MODELS = [
  ['Compare concrete examples or evidence layouts side by side', 'Card / Stack with concise explanations or labelled Svg drawings'],
  ['Compare amounts or rank categories', 'BarChart / HorizontalBarChart'],
  ['Follow a measurement over time', 'LineChart'],
  ['Show an amount developing over time', 'AreaChart; use cumulative data when teaching accumulation'],
  ['Show flat shares of one whole', 'PieChart / donut variant / SingleStackedBarChart'],
  ['Compare used and remaining capacity', 'Stacked HorizontalBarChart'],
  ['Examine two numeric variables', 'ScatterChart; an association alone does not establish causation'],
  ['Compare profiles across comparable criteria', 'RadarChart'],
  ['Compare attributes and explain their implications', 'Table for a compact overview; TradeoffSandbox for an explained comparison'],
  ['Explain spatial structure, anatomy, a mechanism or a concrete analogy', 'Labelled Svg drawing'],
  ['Execute or understand a procedure', 'Steps, Bullets or Flowchart according to instruction, checklist or structural needs'],
] as const

export const MENTAL_MODEL_GUIDE = `## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the main visual or learning activity that teaches that mental model. Rows name learning capabilities; retrieve the selected component contracts. Every authored section is Page(title, body, heading?), without a section-type or library choice. Read its exact component signatures before writing.

${REPRESENTATION_SELECTION_GUIDE}

${COMPOSITION_DECISION_GUIDE}

### Choosing views within a Flowchart

Choose one meaningful primary view with Flowchart.initialView. In presentation.strategy record that view, the guided Journey/JourneyStep path and any purposeful NarrationStep.view transitions. Multiple narration steps can use the same beat to reveal different perspectives. Do not require all six views or invent actors, interactions, event data or states to enable them. Use Branch/BranchOption only for real alternatives, async for fire-and-forget commands, sendsTo for declared messages, Event.data for meaningful payloads, and StateMachine plus Event.enters for genuine lifecycle transitions. Sequence spacing is not measured duration. A linear process can still justify several perspectives when each teaches something distinct.

| View | Mental model it teaches |
|---|---|
${FLOWCHART_MODELS.map(([view, model]) => `| ${view} | ${model} |`).join('\n')}

### Choosing a visual composition

| Mental model / learning goal | Visual |
|---|---|
${OPENUI_MODELS.map(([model, visual]) => `| ${model} | ${visual} |`).join('\n')}

### Applying the selection

${PROCEDURE_TEACHING_GUIDE}

${TAXONOMY_TEACHING_GUIDE}

${FLASHCARD_TEACHING_GUIDE}

${TRADEOFF_COMPARISON_GUIDE}
- A Tradeoff Sandbox can contain multiple situations to teach how to choose between alternatives. Reuse comparable choices across contrasting situations, but vary the goals, constraints and priorities so the learner sees when each option fits. For HTTP versus WebSocket, contrast an ordinary resource API with a bidirectional live collaboration application; explain each situation's gains, costs and recommendation rather than declaring one universal winner. A general comparison may stand on its own; add contrasting situations only when they teach contextual suitability. Several situations remain one main activity on one page, with internal automatic Present scenes; split pages when the learning purpose changes or the content becomes too dense. Recommendations must follow the authored situation, and numerical scores must be sourced or visibly labelled illustrative.
- Keep the distinctions explicit: Taxonomy classifies; Breakdown Tree divides a measurable whole. Pillar Layer shows foundations; Flowchart shows process. Sequence shows interaction order; Timeline shows measured time. Decision Tree selects by rules; Scenario explores consequences.
- Select only the sections that help this topic. This is a catalogue of teaching choices, not a mandatory lesson sequence or a requirement to include every type. A focused explanation may use one strong section; a fuller topic can introduce meanings, show relationships or a mechanism, compare options, then practise applying the idea.
- Read and Present deliver the same mental model. Read supports inspection and learner interaction; Present guides attention with narration and focus. Use each section's documented beats and view controls. In Present, quiz and reflection answers can be demonstrated by the stage; they are learner practice in the interactive Read mode.
`
