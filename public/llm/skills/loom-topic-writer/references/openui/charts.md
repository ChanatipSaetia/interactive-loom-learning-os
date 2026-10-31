### Tables and Charts

Use a table or chart in a standard OpenUI section when the figures or the side-by-side comparison are what the learner should take away:

- **Table**: several items compared on the same attributes, or reference values the learner looks up (settings, limits, specs).
- **Chart**: the shape of real numbers: a comparison, a trend, a share of a whole or a correlation. Pick the chart type from the question it answers (see the list below).
- Not a table or chart: a trade-off the learner should explore by moving sliders (TradeoffSandbox), a formula (FormulaSandbox), categories or a hierarchy (TaxonomyBrowser), a few points with explanation (Bullets).

How to write them:

- Data is written as literal arrays, e.g. `Col("Tea", ["Sencha", "Matcha"])`. There is no `data.rows`, Query or `@` function call over fetched data.
- Every Col of a Table, and every Series of a chart, has one value per row or label, in the same order.
- Use source-backed figures for factual claims. Clearly label deliberate teaching examples as illustrative data; never invent measured figures to fill a chart. Put the unit in the Col header or the axis label, e.g. "Water (°C)".
- Value axes start at 0, so values only a few percent apart look the same height. When the lesson is the difference, chart the difference (e.g. "°C below boiling", "ms over the baseline") and keep the absolute values in a Table.
- Wrap a chart in a Card with a CardHeader for its title, and add a Callout for the takeaway. Put a chart and a table of the same data in Tabs only when the narrator does not need both: Present shows the first tab only.

Signatures (? marks an optional argument):

Table(columns: Col[]) — Compare several items across the same attributes (specs, settings, options side by side), or a reference the learner looks things up in. Column-oriented: a list of Col.
Col(label: string, data: any, type?: "string" | "number" | "action") — One column: its header and its values, in the same row order in every column. Use type "number" for numeric columns.
BarChart(labels: string[], series: Series[], variant?: "grouped" | "stacked", xLabel?: string, yLabel?: string, height?: number) — Compare one or more values across a few categories.
HorizontalBarChart(labels: string[], series: Series[], variant?: "grouped" | "stacked", xLabel?: string, yLabel?: string) — Like BarChart, for long category labels or a ranked list.
LineChart(labels: string[], series: Series[], variant?: "linear" | "natural" | "step", xLabel?: string, yLabel?: string, height?: number) — A value changing over time or along an ordered scale.
AreaChart(labels: string[], series: Series[], variant?: "linear" | "natural" | "step", xLabel?: string, yLabel?: string, height?: number) — Totals or volumes accumulating over time.
SingleStackedBarChart(labels: string[], values: number[]) — Parts of one whole shown as a single horizontal bar; use percentages summing to 100% for a share.
PieChart(labels: string[], values: number[], variant?: "pie" | "donut", appearance?: "circular" | "semiCircular") — Parts of one whole that add up to 100%; at most about six slices.
RadarChart(labels: string[], series: Series[]) — Two or three items scored on the same set of criteria.
ScatterChart(datasets: ScatterSeries[], xLabel?: string, yLabel?: string) — The relationship between two numeric variables.
Series(category: string, values: number[]) — One named series of numbers, one value per label.
ScatterSeries(name: string, points: Point[]) — One named set of points of a ScatterChart.
Point(x: number, y: number, z?: number) — One x/y point of a ScatterSeries.

Example section file, and its narration pointing at single bars and cells:

```
// @openui "Water Temperature" "How hot to brew each tea"
root = Card([header, chart, table, tip])
header = CardHeader("Water temperature by tea", "Starting points for a 2-minute steep")
chart = BarChart(["Gyokuro", "Sencha", "Matcha", "Oolong", "Black"], [Series("Water (°C)", [60, 75, 80, 90, 95])], "grouped", "Tea", "°C")
table = Table([Col("Tea", ["Gyokuro", "Sencha", "Matcha", "Oolong", "Black"]), Col("Water (°C)", [60, 75, 80, 90, 95], "number"), Col("Why", ["Shaded leaf, sweet and delicate", "Balanced, grassy", "Whisked powder, scorches easily", "Partly oxidised, needs more heat", "Fully oxidised, robust"])])
tip = Callout("info", "No thermometer?", "Let boiled water stand: about 80 °C after 5 minutes in an open cup.")
```

```
root = Narration([title, head, low, high, why, tip])
title = NarrationStep("title", "How hot should the water be? It depends on the leaf.")
head = NarrationStep("part1", "Five teas, each at its usual starting point.", [Highlight("header")])
low = NarrationStep("part2", "Gyokuro wants the coolest water of all.", [Highlight("chart.labels[0]")])
high = NarrationStep("part2", "Black tea takes it almost boiling.", [Callout("chart.series[0].values[4]", "Fully oxidised leaf has little left to turn bitter.")])
why = NarrationStep("part3", "The last column says why: gyokuro is shaded, so it is sweet and delicate.", [Spotlight(["table.columns[0].data[0]", "table.columns[2].data[0]"])])
tip = NarrationStep("part4", "No thermometer? Time does the job.", [Highlight("tip")])
```
