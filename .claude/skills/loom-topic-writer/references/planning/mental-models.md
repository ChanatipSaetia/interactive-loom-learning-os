## Start Here: Mental Model and Section Selection

Use this table as the agent's table of contents before planning or writing a topic. Identify what the learner should be able to define, picture, compare, explain or do; then select the section that teaches that mental model. Each row names a supported section type to request from the authoring guide. Read its exact component signatures before writing.

| Mental model / learning goal | Section type | Learner question and selection cue |
|---|---|---|
| Orientation, purpose and roadmap | `intro` | What will I learn, why does it matter, and where are we going? |
| Definitions, meaning, vocabulary and recall | `flashcards` | What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them. |
| Connected explanation and narrative | `text` | Why does this happen, or how should I understand the explanation? Use for connected prose, reasoning or context beyond a concise definition. |
| Key points, supporting details and checklists | `bullets` | What are the important points, requirements or supporting subpoints? |
| Visual recognition and concrete references | `image-gallery` | What does it look like? Compare examples, textures, objects or screenshots. |
| Classification and distinctions | `taxonomy-browser` | What kinds exist, what defines them, and how do I recognise their differences? |
| Relationships between concepts | `concept-map` | How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly. |
| Layered dependency and foundation | `pillar-layer` | What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application. |
| Process, responsibility and interaction | `flowchart` | What happens, what triggers it, who handles it, and how do participants interact? Choose the view from the table below. |
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

| View | Mental model it teaches |
|---|---|
| Event Storming | Event → policy → command → system → resulting event; explain triggers and rules. |
| System Architecture | Components, their responsibilities and their connections. |
| Swimlanes | Ownership and handoffs between participants. |
| Sequence | Who sends what to whom, and in what order; vertical spacing is not measured duration. |
| Data Flow | What information moves between components. |
| State Machine | How events change the state of something. |

### Choosing an OpenUI visual

| Mental model / learning goal | Visual |
|---|---|
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
