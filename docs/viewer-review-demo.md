# Permanent Viewer review demo

Use **Viewer Review · All 20 Section Types** as the common specimen for visual reviews, screenshots and future design changes. It covers every registered section type once, using an illustrative AI research assistant as the common subject. Timings, scores, budgets and experiences are examples rather than measured results or customer research.

Open `samples/viewer-review-demo.loom.oui` with **Open file** in Viewer. The editable topic lives in `public/content/viewer-review-demo/` and also appears in the learning app's generated catalog.

To make a single HTML with the current Viewer and embedded topic:

```sh
npm run demo:viewer
# Optional output path:
npm run demo:viewer -- /tmp/viewer-review-demo.html
```

The default output is `viewer-review-demo.html` in the system temporary directory. Download it and open it in a browser. The topic, JavaScript, styles and original gallery illustrations are embedded; optional web fonts use the theme's local fallback stack offline. The generated HTML is a build artifact; rebuild it after UI changes.

In **Read**, scroll through the numbered sections and try the controls. In **Present**, use **Overview** to jump to a section, then pause and step through its beats. On compact screens Read and Present are in **…**. Compare both Liquid Glass themes at phone and desktop widths.

| # | Section type | Review interaction |
|---|---|---|
| 01 | Intro | Roadmap navigation and overview text |
| 02 | Text | Paragraph width, emphasis and spacing |
| 03 | Bullets | Nested items and expansion |
| 04 | User journey | Centered step selector, goal, response and friction |
| 05 | Timeline | Parallel tasks, dependencies and shared time axis |
| 06 | Breakdown tree | Parent and whole percentages |
| 07 | Taxonomy browser | Category selection and detail |
| 08 | Concept map | Relationships, pan and zoom |
| 09 | Flowchart | Process walkthrough and alternate diagram views |
| 10 | Pillar layer | Dependency tracing between layers |
| 11 | Image gallery | Two embedded illustrations and lightbox |
| 12 | Flashcards | Flip cards and move between terms |
| 13 | Quiz | Wrong and correct answers, feedback and score |
| 14 | Scenario | Two choices with different outcomes |
| 15 | Decision tree | Branches, recommendations and restart |
| 16 | Tradeoff sandbox | Four decisions, their combined effect on two metrics, and the recommended approach |
| 17 | Formula sandbox | Sliders and recalculated review time |
| 18 | Reflection sequence | Arrange three actions in order |
| 19 | Reflection template | Fill three blanks with a distractor chip |
| 20 | OpenUI | Tabs, table and callout |

When changing examples, update the topic folder and the downloadable `.loom.oui` sample together. `tests/unit/viewer/viewer-review-demo.test.ts` checks that the two versions match, that every supported section type is represented, and that each compiles without diagnostics and supplies playable beats. Adding a section type makes this test require a new example.

Present fills the Viewer viewport behind the header and bottom playback bar. Use the header's up chevron or the playback bar's down chevron to hide either bar independently. The collapsed bottom bar keeps Previous, Play/Pause, Next and a restore button. A small top-edge button restores the header; hiding a bar does not resize the slide or pause playback. The bottom toggle also hides the caption. Arrow-key and swipe navigation continue to work with the bars hidden; Escape returns to Read.

The tradeoff demo has four decisions. Its Present conclusion is a single recap of the decision names, recommended options and combined metrics. Reasons and compromises appear in the earlier presentation beats and remain in the detailed Read conclusion.

In Read, the tradeoff **Try it** tab contains only the interactive metric dashboard and decision controls. Scenario context, comparisons and the detailed recommendation conclusion live in **Compare options**.

Formula simulation hides equations by default. In Read, click a computed metric to open its equation and details. In Present, click the metric to expand its equation beneath the value; click it again to collapse it. Input sliders and computed results remain visible.

Metric details close with the 44px close control, an outside tap or Escape. The drawer is a focus-managed dialog. Formula Present text scales from 18–24px for labels and equations and 24–32px for computed values.
