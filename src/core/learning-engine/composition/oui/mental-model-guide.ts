/** Shared table of contents for the writer, tutor skills and scoped authoring guides. */
export const SECTION_MENTAL_MODELS = [
  { type: 'intro', model: 'Orientation, purpose and roadmap', question: 'What will I learn, why does it matter, and where are we going?' },
  { type: 'flashcards', model: 'Definitions, meaning, vocabulary and recall', question: 'What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them.' },
  { type: 'text', model: 'Connected explanation and narrative', question: 'Why does this happen, or how should I understand the explanation? Use for connected prose, reasoning or context beyond a concise definition.' },
  { type: 'bullets', model: 'Key points, supporting details and checklists', question: 'What are the important points, requirements or supporting subpoints?' },
  { type: 'image-gallery', model: 'Visual recognition and concrete references', question: 'What does it look like? Compare examples, textures, objects or screenshots.' },
  { type: 'taxonomy-browser', model: 'Classification and distinctions', question: 'What kinds exist, what defines them, and how do I recognise their differences?' },
  { type: 'concept-map', model: 'Relationships between concepts', question: 'How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly.' },
  { type: 'pillar-layer', model: 'Layered dependency and foundation', question: 'What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application.' },
  { type: 'flowchart', model: 'Process, responsibility and interaction', question: 'What happens, what triggers it, who handles it, and how do participants interact? Choose the view from the table below.' },
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

const FLOWCHART_MODELS = [
  ['Event Storming', 'Event → policy → command → system → resulting event; explain triggers and rules.'],
  ['System Architecture', 'Components, their responsibilities and their connections.'],
  ['Swimlanes', 'Ownership and handoffs between participants.'],
  ['Sequence', 'Who sends what to whom, and in what order; vertical spacing is not measured duration.'],
  ['Data Flow', 'What information moves between components.'],
  ['State Machine', 'How events change the state of something.'],
] as const

const OPENUI_MODELS = [
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
