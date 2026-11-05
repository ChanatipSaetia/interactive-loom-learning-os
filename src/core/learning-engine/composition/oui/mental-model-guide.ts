/** Shared selection policy: native sections and OpenUI remain first-class choices. */
export const REPRESENTATION_SELECTION_GUIDE = `Before choosing Text, consider whether a native Loom section or an OpenUI visual composition would explain the idea more clearly. Native Loom sections and OpenUI are first-class choices; choose by the learner's goal, not a preference for one library. Use Text when connected prose or narrative is the best teaching format, and combine concise explanations with visuals when useful.

Use OpenUI cards for side-by-side examples, tables for factual attribute comparisons, charts for quantities and trends, and labelled Svg drawings for spatial structure or mechanisms. Charts must use supplied or verified data; clearly label illustrative data and never invent benchmark results. Keep native Flowchart for processes, Quiz and Flashcards for assessment/recall, Scenario for consequences, Tradeoff Sandbox for evaluating options, Formula Sandbox for input-driven calculations, and the other native sections where their interactions teach the goal. No OpenUI quota or mandatory section sequence.

For example, explain isolated versus distributed retrieval evidence with two annotated document diagrams and a short explanation, then use a native Quiz to check understanding. A chart is appropriate only when actual measurements are available. Request the openui section guide for its syntax and presentation rules before writing a composition, then retrieve only the component families needed.`

/** Shared table of contents for the writer, tutor skills and scoped authoring guides. */
export const SECTION_MENTAL_MODELS = [
  { type: 'intro', model: 'Orientation, purpose and roadmap', question: 'What will I learn, why does it matter, and where are we going?' },
  { type: 'flashcards', model: 'Definitions, meaning, vocabulary and recall', question: 'What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them.' },
  { type: 'text', model: 'Connected explanation and narrative', question: 'Does this idea need connected prose or narrative? Before choosing Text, consider native sections and OpenUI comparisons, diagrams, tables or charts; use prose when it best teaches the goal.' },
  { type: 'bullets', model: 'Key points, supporting details and checklists', question: 'What are the important points, requirements or supporting subpoints?' },
  { type: 'image-gallery', model: 'Visual recognition and concrete references', question: 'What does it look like? Compare examples, textures, objects or screenshots.' },
  { type: 'taxonomy-browser', model: 'Classification and distinctions', question: 'What kinds exist, what defines them, and how do I recognise their differences?' },
  { type: 'concept-map', model: 'Relationships between concepts', question: 'How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly.' },
  { type: 'pillar-layer', model: 'Layered dependency and foundation', question: 'What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application.' },
  { type: 'flowchart', model: 'Process, responsibility and interaction', question: 'What happens, what triggers it, who handles it, and how do participants interact? Choose the view from the table below.' },
  { type: 'user-journey', model: 'A person’s experience with a product or service', question: 'What does the person want, do and experience at each stage, and how can friction be resolved?' },
  { type: 'timeline', model: 'Measured time, duration, overlap and waiting', question: 'When does each task start and finish, what runs together, and what must wait?' },
  { type: 'breakdown-tree', model: 'Parts of a measurable whole and conditional probability', question: 'How does a total divide through a hierarchy? Use quantity mode for costs/counts and probability mode for conditional branches and path probabilities.' },
  { type: 'tradeoff-sandbox', model: 'Presenting options, comparing alternatives and trade-offs', question: 'What are my options, how do they compare, and when should I choose each? Show strengths, limitations, gains, costs and suitability; a recommendation can explain why an option fits. Use this for option comparison even without formal mathematical optimisation.' },
  { type: 'formula-sandbox', model: 'Input–output relationships and sensitivity', question: 'How does changing an input change a calculated result? Let the learner vary inputs to an authored formula.' },
  { type: 'decision-tree', model: 'Rule-based diagnosis and selection', question: 'Which option fits my situation after answering a sequence of questions?' },
  { type: 'scenario', model: 'Consequences across decisions', question: 'What happens if I choose this, then make another decision? Explore authored paths and outcomes.' },
  { type: 'quiz', model: 'Checking understanding and applying knowledge', question: 'Can I answer or apply what has already been taught?' },
  { type: 'reflection-sequence', model: 'Reconstructing order and procedure', question: 'Can I arrange the supplied steps into the correct sequence?' },
  { type: 'reflection-template', model: 'Structured reasoning and explanation', question: 'Can I complete a sound explanation using the supplied concepts and sentence blanks?' },
  { type: 'openui', model: 'Composed visual explanation, comparison and data', question: 'Would a chart, table, simple procedure, drawing, analogy or mixed composition express this idea best? See the visual choices below.' },
] as const

/** Discovery evidence, not a renderer ranking or proof of learning. */
export const SECTION_LEARNING_BEHAVIORS: Record<typeof SECTION_MENTAL_MODELS[number]['type'], {
  learnerAction: string; presentationConstraint: string; evidenceBoundary: string
}> = {
  intro: { learnerAction: 'Read the purpose and roadmap.', presentationConstraint: 'Orient attention; keep the opening focused.', evidenceBoundary: 'Reading is engagement, not demonstrated understanding.' },
  text: { learnerAction: 'Read a connected explanation or argument.', presentationConstraint: 'Keep prose readable in Read and Present; check long paragraphs at phone width.', evidenceBoundary: 'Prose can be the right representation; viewing it is not assessment.' },
  bullets: { learnerAction: 'Inspect key points and supporting details.', presentationConstraint: 'Use documented item beats; avoid turning every item into a paragraph wall.', evidenceBoundary: 'A checklist presentation does not demonstrate procedural skill.' },
  flashcards: { learnerAction: 'Try recall, then flip to inspect a definition or example.', presentationConstraint: 'Present demonstrates front/back; use Read for learner-controlled recall.', evidenceBoundary: 'A flip records exposure, not correctness of unauthored recall.' },
  'image-gallery': { learnerAction: 'Inspect and compare visual examples.', presentationConstraint: 'Check image labels and legibility at the actual viewport.', evidenceBoundary: 'Visual inspection alone does not establish recognition accuracy.' },
  'taxonomy-browser': { learnerAction: 'Select categories and inspect their distinctions.', presentationConstraint: 'Use focused category beats instead of a dense classification dump.', evidenceBoundary: 'Category exploration is engagement, not a classification test.' },
  'concept-map': { learnerAction: 'Inspect concepts and their labelled relationships.', presentationConstraint: 'Check that labels and connections remain readable at phone width.', evidenceBoundary: 'A displayed relationship does not show the learner can explain it.' },
  'pillar-layer': { learnerAction: 'Inspect layers and what each foundation supports.', presentationConstraint: 'Keep layer labels short and inspect the complete stack in Read.', evidenceBoundary: 'Layer inspection alone does not demonstrate dependency reasoning.' },
  flowchart: { learnerAction: 'Step through events, responsibilities and handoffs in the appropriate view.', presentationConstraint: 'Select the documented process view and inspect graph labels at the viewport.', evidenceBoundary: 'Stepping through a process is engagement; test application separately.' },
  'user-journey': { learnerAction: 'Inspect stages, goals, friction and improvements in a person’s journey.', presentationConstraint: 'Focus on one stage at a time; check horizontal content remains reachable.', evidenceBoundary: 'Stage selection is exploration, not evidence of diagnosing friction.' },
  timeline: { learnerAction: 'Inspect start times, durations, overlap and waiting.', presentationConstraint: 'Time geometry must use authored measurements; verify labels and scale.', evidenceBoundary: 'Selection is exploration; interpretation needs a learner response.' },
  'breakdown-tree': { learnerAction: 'Explore how a quantity or probability divides through branches.', presentationConstraint: 'Preserve visible totals and branch labels; inspect deep trees in Read.', evidenceBoundary: 'Expansion is engagement; it does not establish quantitative reasoning.' },
  'tradeoff-sandbox': { learnerAction: 'Compare options, strengths, costs and suitability for a situation.', presentationConstraint: 'Present guides option comparisons; Read supports learner exploration.', evidenceBoundary: 'Exploring options does not prove a justified decision.' },
  'formula-sandbox': { learnerAction: 'Vary inputs and observe authored calculated outputs.', presentationConstraint: 'Present demonstrates chosen inputs; Read is needed for learner experiments.', evidenceBoundary: 'Slider movement is engagement, not correctness or causal understanding.' },
  'decision-tree': { learnerAction: 'Answer branching questions to inspect a rule-based recommendation.', presentationConstraint: 'Present demonstrates a path; Read lets the learner choose branches.', evidenceBoundary: 'A reached recommendation is not an assessment score.' },
  scenario: { learnerAction: 'Choose authored decisions and inspect consequences.', presentationConstraint: 'Present demonstrates paths; Read permits learner decisions.', evidenceBoundary: 'An explored consequence is not independently verified mastery.' },
  quiz: { learnerAction: 'Submit an answer and inspect authored feedback.', presentationConstraint: 'Present demonstrates answers; Read captures learner attempts.', evidenceBoundary: 'Explicit correct/wrong attempts are evidence; views and stage demonstrations are not mastery.' },
  'reflection-sequence': { learnerAction: 'Reconstruct the order of supplied steps and check the answer.', presentationConstraint: 'Present demonstrates reconstruction; Read supports learner attempts.', evidenceBoundary: 'Correctness concerns this authored sequence, not general mastery.' },
  'reflection-template': { learnerAction: 'Complete an explanation from supplied concepts and sentence blanks.', presentationConstraint: 'Present demonstrates a completed explanation; use Read for attempts.', evidenceBoundary: 'Explicit results concern this exercise, not independent free-text reasoning.' },
  openui: { learnerAction: 'Inspect or interact with an authored composition of cards, diagrams, tables or charts.', presentationConstraint: 'Use supported child beats and narration targets; measure dense tables/charts at phone width.', evidenceBoundary: 'Component presence is not proof of meaningful interaction. Use verified or labelled illustrative chart data; static tables are valid for factual comparison.' },
}

const FLOWCHART_MODELS = [
  ['Event Storming', 'Event → policy → command → system → resulting event; explain triggers and rules.'],
  ['System Architecture', 'Components, their responsibilities and their connections.'],
  ['Swimlanes', 'Ownership and handoffs between participants.'],
  ['Sequence', 'Who sends what to whom, and in what order; vertical spacing is not measured duration.'],
  ['Data Flow', 'What information moves between components.'],
  ['State Machine', 'How events change the state of something.'],
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
  ['Look up or compare factual attributes', 'Table'],
  ['Explain spatial structure, anatomy, a mechanism or a concrete analogy', 'Labelled Svg drawing'],
  ['Explain a straightforward procedure', 'Steps'],
] as const

export const MENTAL_MODEL_GUIDE = `## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the section that teaches that mental model. Each row names a supported section type to request from the authoring guide. Read its exact component signatures before writing.

${REPRESENTATION_SELECTION_GUIDE}

| Mental model / learning goal | Section type | Learner question and selection cue |
|---|---|---|
${SECTION_MENTAL_MODELS.map(({ type, model, question }) => `| ${model} | \`${type}\` | ${question} |`).join('\n')}

### Choosing views within a Flowchart

| View | Mental model it teaches |
|---|---|
${FLOWCHART_MODELS.map(([view, model]) => `| ${view} | ${model} |`).join('\n')}

### Choosing an OpenUI visual

| Mental model / learning goal | Visual |
|---|---|
${OPENUI_MODELS.map(([model, visual]) => `| ${model} | ${visual} |`).join('\n')}

### Applying the selection

- Flashcards can define and introduce a concept before the learner has memorised it. Put the term or question on the front and a concise meaning on the back; use examples or dialogue when helpful. They are a teaching format as well as a recall activity. Use Text or OpenUI when a longer connected explanation is needed.
- Tradeoff Sandbox also presents choices and compares alternatives. Choose it when the learner needs to evaluate options, their strengths and weaknesses, or suitability for a situation. A simple factual lookup matrix can use an OpenUI Table; input-driven calculations belong in Formula Sandbox.
- Keep the distinctions explicit: Taxonomy classifies; Breakdown Tree divides a measurable whole. Pillar Layer shows foundations; Flowchart shows process. Sequence shows interaction order; Timeline shows measured time. Decision Tree selects by rules; Scenario explores consequences.
- Select only the sections that help this topic. This is a catalogue of teaching choices, not a mandatory lesson sequence or a requirement to include every type. A focused explanation may use one strong section; a fuller topic can introduce meanings, show relationships or a mechanism, compare options, then practise applying the idea.
- Read and Present deliver the same mental model. Read supports inspection and learner interaction; Present guides attention with narration and focus. Use each section's documented beats and view controls. In Present, quiz and reflection answers can be demonstrated by the stage; they are learner practice in the interactive Read mode.
`
