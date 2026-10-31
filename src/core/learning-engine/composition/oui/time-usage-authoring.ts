/** Shared visual selection rules and executable examples for Loom authoring agents. */
export const TIME_USAGE_PLANNING_RULE = 'Proactively visualize time and quantities when they are central to the explanation; do not wait for the learner to request a chart. Use Timeline for measured start times, duration, parallel work and waiting; a custom Svg can show a qualitative event timeline, LineChart for change over time, HorizontalBarChart for comparing amounts, PieChart or SingleStackedBarChart for shares of one whole, and stacked bars for used versus remaining capacity. Request the timeline guide for measured timelines, and the openui guide for charts and custom Svg. Use source-backed figures for factual claims; clearly label intentional teaching examples as illustrative data. In Present, keep the whole visual visible while several narration steps highlight its phases, points, bars or slices, then explain the takeaway.'

export const TIME_USAGE_AUTHORING_GUIDE = `## Time and Usage Visuals

- ${TIME_USAGE_PLANNING_RULE}
- During planning, look for claims such as “before/after”, “takes longer”, “grows over time”, “used more”, “most of the total”, or “nearly full”. Choose the visual that lets the learner see that relationship. Do not leave the central relationship buried in bullets or a table. Use these visuals when they teach the idea; do not add a chart quota to every topic.

| Learner's question | Visual | What it encodes |
|---|---|---|
| What happens when, and what takes longest? | \`Timeline\` | Ordered events or intervals; scale interval widths to duration when known. |
| How does a measurement change over time? | \`LineChart\` | Times on the horizontal axis, measured values on the vertical axis. |
| Which is used more, or handles more? | \`HorizontalBarChart\` | Comparable counts or amounts over the same observation window. |
| What fraction belongs to each category? | \`PieChart\` or \`SingleStackedBarChart\` | Mutually exclusive parts of the same whole; percentages sum to 100%. |
| How much capacity is used or remains? | Stacked \`HorizontalBarChart\` | Used and remaining values summing to 100% for each resource. |

- Say what is measured, its units, observation window and denominator. Request share is different from CPU utilization: more requests do not by themselves prove higher resource cost. Each capacity row has its own denominator; do not sum CPU, memory and storage percentages.
- Use real source data for factual claims. A deliberately constructed worked example is allowed when it teaches the mechanism: label it “illustrative data” visibly and in narration, and keep its arithmetic consistent. When quantitative data is unavailable, use a qualitative or explicitly not-to-scale schematic, or ask for measurements if exact comparison is essential; never invent measured performance or adoption figures.
- Show a few large, readable labels with a consistent palette. Use supported components and theme-aware Svg colors. Charts are composed \`openui\` sections; measured timing uses the dedicated \`Timeline\` section. There is no Utilization section type.

### OpenUI chart and custom Svg presentation recipe

- Use \`root = Card([header, chart, takeaway], "clear")\` (or Stack), with all three children named. The main beats are \`title\` → \`part1\` (measurement and context) → \`part2\` (whole visual) → \`part3\` (conclusion). Earlier parts stay visible; the chart remains in view for the takeaway. Keep content needed for presentation out of Tabs and Carousel.
- Write several \`NarrationStep("part2", …)\` entries to explain the visual without replacing it. Move the highlight through a timeline's phases, a line's start/peak/recovery, relevant comparison bars, slices of a whole, or capacity rows. Explain what the pattern means instead of only reading labels. Autoplay finishes those narration steps before advancing; Next advances a main beat, not one data point at a time.
- Target named visuals precisely: \`drawing.processing\` for an Svg shape's ID, \`chart.series[0].values[1]\` for a bar or line point, and \`chart.values[0]\` for a pie slice. Indices are zero-based. Give every narrated Svg shape a unique ID. Use a final takeaway to connect the highlighted evidence to the lesson.
- The worked examples in the authoring reference’s Time and Usage Visuals section are starting points, not a required five-section sequence. Choose only the visual the topic needs, replace example data and narration together, and validate the section plus every narration target.
`

export const TIME_USAGE_EXAMPLES = [
  {
    name: 'timeline',
    section: `// @openui "Timeline · Where does the time go?"
root = Card([header, drawing, takeaway], "clear")
header = CardHeader("Timeline · Where does the time go?", "Order and duration · illustrative request trace")
drawing = Svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280">
<text x="28" y="35" fill="text" font-size="24">One illustrative request · 200 ms total</text>
<g id="ingress"><rect x="40" y="100" width="92" height="66" rx="10" fill="sky"/><text x="86" y="200" text-anchor="middle" fill="text" font-size="20">Ingress</text><text x="86" y="227" text-anchor="middle" fill="subtext0" font-size="18">20 ms</text></g>
<g id="queue"><rect x="132" y="100" width="138" height="66" rx="10" fill="yellow"/><text x="201" y="125" text-anchor="middle" fill="base" font-size="20">Queue</text><text x="201" y="151" text-anchor="middle" fill="base" font-size="18">30 ms</text></g>
<g id="processing"><rect x="270" y="100" width="690" height="66" rx="10" fill="mauve"/><text x="615" y="139" text-anchor="middle" fill="base" font-size="25">Processing · 150 ms</text></g>
<path d="M40 80 H960" fill="none" stroke="overlay0" stroke-width="2"/>
<g fill="subtext0" font-size="20"><text x="40" y="68">0</text><text x="132" y="68">20</text><text x="270" y="68">50</text><text x="960" y="68" text-anchor="end">200 ms</text></g>
</svg>', "Widths represent elapsed time.")
takeaway = Callout("info", "What to notice", "Processing accounts for 150 of 200 ms: 75% of this request’s elapsed time.")
`,
    narration: `root = Narration([
  NarrationStep("title", "Timeline · Where does the time go? This sample uses illustrative data."),
  NarrationStep("part1", "Order and duration · illustrative request trace", [Highlight("header")]),
  NarrationStep("part2", "The request spends its first 20 milliseconds entering the service.", [Highlight("drawing.ingress")]),
  NarrationStep("part2", "It then waits in a queue for 30 milliseconds.", [Highlight("drawing.queue")]),
  NarrationStep("part2", "Processing takes 150 milliseconds, the longest phase. These intervals run sequentially in this simplified trace.", [Highlight("drawing.processing")]),
  NarrationStep("part3", "Processing accounts for 150 of 200 ms: 75% of this request’s elapsed time.", [Highlight("takeaway")])
])
`,
  },
  {
    name: 'trend',
    section: `// @openui "Trend · How does usage change?"
root = Card([header, chart, takeaway], "clear")
header = CardHeader("Trend · How does usage change?", "CPU utilization at four observation times · illustrative data")
chart = LineChart(["09:00", "09:05", "09:10", "09:15"], [Series("CPU utilization (%)", [20, 45, 80, 35])], "linear", "Observation time", "CPU (%)", 280)
takeaway = Callout("info", "What to notice", "CPU peaks at 80% at 09:10, then falls to 35%; a peak is different from sustained high usage.")
`,
    narration: `root = Narration([
  NarrationStep("title", "Trend · How does usage change? This sample uses illustrative data."),
  NarrationStep("part1", "CPU utilization at four observation times · illustrative data", [Highlight("header")]),
  NarrationStep("part2", "At nine o’clock, CPU utilization is 20 percent.", [Highlight("chart.series[0].values[0]")]),
  NarrationStep("part2", "At nine ten, utilization reaches the highest observed value: 80 percent.", [Highlight("chart.series[0].values[2]")]),
  NarrationStep("part2", "The final sample drops to 35 percent, so these samples show a spike rather than a sustained plateau.", [Highlight("chart.series[0].values[3]")]),
  NarrationStep("part3", "CPU peaks at 80% at 09:10, then falls to 35%; a peak is different from sustained high usage.", [Highlight("takeaway")])
])
`,
  },
  {
    name: 'comparison',
    section: `// @openui "Comparison · Which handles more?"
root = Card([header, chart, takeaway], "clear")
header = CardHeader("Comparison · Which handles more?", "Requests by operation in one observation window · illustrative data")
chart = HorizontalBarChart(["Search", "Database", "Other"], [Series("Requests", [600, 300, 100])], "grouped", "Request count", "Operation")
takeaway = Callout("info", "What to notice", "Search handles twice as many requests as Database in this sample; counts alone do not measure resource cost.")
`,
    narration: `root = Narration([
  NarrationStep("title", "Comparison · Which handles more? This sample uses illustrative data."),
  NarrationStep("part1", "Requests by operation in one observation window · illustrative data", [Highlight("header")]),
  NarrationStep("part2", "Search handles 600 requests, the largest count.", [Highlight("chart.labels[0]")]),
  NarrationStep("part2", "Database handles 300. Search therefore handles twice as many requests.", [Highlight("chart.series[0].values[1]")]),
  NarrationStep("part2", "The remaining category handles 100 requests. These are counts over the same window.", [Highlight("chart.labels[2]")]),
  NarrationStep("part3", "Search handles twice as many requests as Database in this sample; counts alone do not measure resource cost.", [Highlight("takeaway")])
])
`,
  },
  {
    name: 'share',
    section: `// @openui "Proportion · How is the whole divided?"
root = Card([header, chart, takeaway], "clear")
header = CardHeader("Proportion · How is the whole divided?", "Share of the same 1,000 requests · illustrative data")
chart = PieChart(["Search · 60%", "Database · 30%", "Other · 10%"], [60, 30, 10], "donut")
takeaway = Callout("info", "What to notice", "These shares add to 100%. They describe the request mix, not percentage of machine capacity.")
`,
    narration: `root = Narration([
  NarrationStep("title", "Proportion · How is the whole divided? This sample uses illustrative data."),
  NarrationStep("part1", "Share of the same 1,000 requests · illustrative data", [Highlight("header")]),
  NarrationStep("part2", "Search accounts for 60 percent of all requests.", [Highlight("chart.values[0]")]),
  NarrationStep("part2", "Database accounts for 30 percent, while the remaining requests account for 10 percent.", [Highlight("chart.values[1]")]),
  NarrationStep("part2", "Together the three slices make one whole: all one thousand requests.", [Highlight("chart")]),
  NarrationStep("part3", "These shares add to 100%. They describe the request mix, not percentage of machine capacity.", [Highlight("takeaway")])
])
`,
  },
  {
    name: 'utilization',
    section: `// @openui "Utilization · How much capacity remains?"
root = Card([header, chart, takeaway], "clear")
header = CardHeader("Utilization · How much capacity remains?", "Used versus remaining capacity · illustrative snapshot")
chart = HorizontalBarChart(["CPU", "Memory", "Storage"], [Series("Used (%)", [60, 80, 35]), Series("Remaining (%)", [40, 20, 65])], "stacked", "Percent of each resource’s capacity", "Resource")
takeaway = Callout("info", "What to notice", "Memory has the least remaining capacity: 20%. Each row has its own capacity denominator; do not add the rows together.")
`,
    narration: `root = Narration([
  NarrationStep("title", "Utilization · How much capacity remains? This sample uses illustrative data."),
  NarrationStep("part1", "Used versus remaining capacity · illustrative snapshot", [Highlight("header")]),
  NarrationStep("part2", "CPU is 60 percent used, leaving 40 percent available.", [Highlight("chart.series[0].values[0]")]),
  NarrationStep("part2", "Memory is 80 percent used, leaving only 20 percent available.", [Highlight("chart.series[0].values[1]")]),
  NarrationStep("part2", "Storage is 35 percent used, leaving 65 percent available. Each resource has its own full-capacity baseline.", [Highlight("chart.series[1].values[2]")]),
  NarrationStep("part3", "Memory has the least remaining capacity: 20%. Each row has its own capacity denominator; do not add the rows together.", [Highlight("takeaway")])
])
`,
  },
]

export function timeUsageExamplesGuide(): string {
  return TIME_USAGE_EXAMPLES.map(({ name, section, narration }) =>
    `### Worked example: ${name}\n\nSection (sections/${name}.oui):\n\n\`\`\`\n${section}\`\`\`\n\nNarration (sections/${name}.narrate.oui):\n\n\`\`\`\n${narration}\`\`\``
  ).join('\n\n')
}
