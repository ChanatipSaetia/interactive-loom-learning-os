## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

ScatterChart(datasets: ScatterSeries[], xLabel?: string, yLabel?: string) — X/Y scatter plot; use for correlations, distributions, and clustering
ScatterSeries(name: string, points: Point[]) — Named dataset
Point(x: number, y: number, z?: number) — Data point with numeric coordinates

### ScatterChart: teaching purpose

- Introduce: Make quantitative patterns visible: amounts, trends, shares, associations or profiles, according to the selected chart.
- Explore: Interpret values, axes, units, series and meaningful comparisons; connect the pattern to the learning question.
- Evidence: Chart presence or selection alone is engagement; interpretation, prediction or a checked calculation can supply evidence.
- Limits: Use verified/supplied data or label illustrative values. Bars compare amounts; line/area charts need meaningful order; shares require a defensible whole; scatter association is not causation; radar criteria need comparable scales. Follow the exact chart contract and check label readability.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
