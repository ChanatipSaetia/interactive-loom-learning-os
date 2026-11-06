## Standard OpenUI Sections

OpenUI section rules: start with // @openui "Title", then root = Component(...) using library openui and exact positional signatures. Generic children are alternatives, not required dependencies: request every child component you actually use; specific model dependencies are included. Static visual explanations are valid. There is no backend: no Query/Mutation, actions, forms or submit buttons. Use supplied/verified chart data or label illustrative values; never invent benchmarks. For narrated compositions use Card/Stack with several named children (part1, part2, …); other roots use all. Every section also opens on title. Narration targets named root children or supported chart/table/Svg paths; validate source, beats and targets and preview mobile Read/Present.

OpenUI compositions are first-class teaching formats alongside native Loom sections. Choose them proactively when a visual layout teaches the idea best; Text is not the default for every explanation:

- Its first line is `// @openui "<Section title>" "<optional heading>"`.
- The rest is openui-lang written with the standard OpenUI component library (`@openuidev/react-ui`), not the Loom components above. The components to use are listed with their signatures under Tables and Charts, Layouts for Other Content and Drawings below.
- Component reference: https://openui.com/docs/api-reference/react-ui. Language specification: https://openui.com/docs/openui-lang.
- Content is static: no Query(), Mutation(), tools, actions, forms or buttons (there is no backend).
- List it in topic.oui with `SectionRef` like any other section. Choose a native Loom section when its interaction teaches the goal (a process, a quiz, a trade-off); choose standard OpenUI when a visual composition teaches it better: figures, a drawing, a how-to, code, reference facts, a set of options side by side.

Shape each section to its content and learner action. Reuse a consistent table or card layout when it makes comparisons easier; vary the composition when the learning purpose changes. Visual novelty and layout variety are not learning objectives.

How the root shapes Present mode (see Narration Files): a `Card([...])` or `Stack([...])` root with several children plays one child per beat (`part1`, `part2`, …), and its children written as named statements are what narration can point at, down to one bar, point, slice or cell of a chart or table, or one shape of a drawing, among them. Any other root (Tabs, Accordion, Carousel, a single child) plays as one beat with nothing to point at, and only its first tab or slide shows. So for a section the narrator should walk through, make the root a Card or Stack of named statements, one idea each, and keep what must be presented out of Tabs, Accordion and Carousel (they suit extra detail the reader opens in Read mode).

The `sections/steep-guide.oui` file in the example above is a standard OpenUI section.


## Visual references

- [Tables and charts](../openui/charts.md)
- [Layouts](../openui/layouts.md)
- [SVG drawings](../openui/drawings.md)
- [Time, shares and utilization](../openui/time-usage.md)

## Presentation beats

`title`, then `part1`, `part2`, … one per item of the children list of a `Card([...])` or `Stack([...])` root with more than one, in order (name those items as statements to point at them); any other root plays in one beat, `all`

Read [narration](../core/narration.md) for effects and targets.
