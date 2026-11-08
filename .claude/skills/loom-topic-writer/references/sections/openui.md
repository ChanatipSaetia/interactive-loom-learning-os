## Standard OpenUI Sections

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. LessonText is Loom prose; Text is an upstream card building block. LearningGallery retains Loom learning/presentation behavior; ImageGallery is upstream. Page body may be a learning component or an OpenUI composition. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

OpenUI compositions are first-class teaching formats alongside native Loom sections. Choose them proactively when a visual layout teaches the idea best; Text is not the default for every explanation:

- Every section uses `root = Page("Title", body, heading?)`; there is no library directive.
- The body uses components from the unified catalog: upstream OpenUI components and Loom learning components. The components to use are listed with their signatures under Tables and Charts, Layouts for Other Content and Drawings below.
- Component reference: https://openui.com/docs/api-reference/react-ui. Language specification: https://openui.com/docs/openui-lang.
- Page-local reactive inputs and state actions work without another model call. Query/Mutation tool connections are deferred.
- List it in topic.oui with `SectionRef` like any other section. Choose a native Loom section when its interaction teaches the goal (a process, a quiz, a trade-off); choose standard OpenUI when a visual composition teaches it better: figures, a drawing, a how-to, code, reference facts, a set of options side by side.

Shape each section to its content and learner action. Reuse a consistent table or card layout when it makes comparisons easier; vary the composition when the learning purpose changes. Visual novelty and layout variety are not learning objectives.

How the root shapes Present mode (see Narration Files): a `Card([...])` or `Stack([...])` root with several children plays one child per beat (`part1`, `part2`, …), and its children written as named statements are what narration can point at, down to one bar, point, slice or cell of a chart or table, or one shape of a drawing, among them. Any other root (Tabs, Accordion, Carousel, a single child) plays as one beat with nothing to point at, and only its first tab or slide shows. So for a section the narrator should walk through, make the root a Card or Stack of named statements, one idea each, and keep what must be presented out of Tabs, Accordion and Carousel (they suit extra detail the reader opens in Read mode).

The `sections/steep-guide.oui` file in the example above is a standard OpenUI section.


## Visual references

- [Canonical visual contracts](../openui/components.md)
- [Tables and charts](../openui/charts.md)
- [Layouts](../openui/layouts.md)
- [SVG drawings](../openui/drawings.md)
- [Time, shares and utilization](../openui/time-usage.md)

## Presentation beats

`title`, then `part1`, `part2`, … one per item of the children list of a `Card([...])` or `Stack([...])` root with more than one, in order (name those items as statements to point at them); any other root plays in one beat, `all`

Read [narration](../core/narration.md) for effects and targets.
