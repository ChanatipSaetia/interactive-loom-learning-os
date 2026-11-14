---
name: loom-topic-writer
description: "Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables, charts and SVG drawings. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, fix errors reported by Loom Viewer or Loom Studio, or act on places and comments copied from their Pick mode."
---

# Loom Topic Writer

Write, extend or repair Interactive Loom lessons as OpenUI Lang (.oui) content. Loom renders the UI; this skill authors topic, section and narration files.

## Reading order

Paths below are relative to this skill folder. Read the linked files, not only this entry point. Load only the references relevant to the task; do not read every section spec.

1. Read the user's source material. Establish the learner and goal; ask at most two short questions only when needed.
2. Follow the [shared authoring workflow](references/planning/workflow.md): identify the learner action, discover candidate formats, make and check a TopicPlan, then retrieve component-scoped contracts. Choose components by learner task from the references below. Prebuilt activities are conveniences within the same catalog. Read [mental models](references/planning/mental-models.md) for selection cues, flowchart views and chart choices, and [visual planning](references/planning/visuals.md) before planning a new lesson. Proactively illustrate time, quantities, structure or mechanisms when they teach the idea.
3. Before writing any OUI, read [syntax](references/core/syntax.md), [topic and shared components](references/core/components.md), [authoring rules](references/core/rules.md), [output location](references/workflow/output.md) and [file formats](references/core/formats.md). The workflow's folder default takes precedence over generic chat output examples. Use exact positional signatures; never invent arguments or write from memory.
4. Read the reference for each selected section below. It contains the selected components, field descriptions and presentation beats. For Present, also read [narration](references/core/narration.md). Write a narration file for every section and cover every beat.
5. Write the files, then follow [validation and delivery](references/workflow/validation.md). A complete [topic example](references/examples/topic.md) is available when needed; adapt to the learner rather than copying its lesson structure.

## Choose the mental model

Learning-first, representation-aware: objective → knowledge structure → learner action → candidate capabilities → simplest faithful representation/configuration. Compare knowledge fidelity, learner action, perspective coverage, cognitive clarity, assessment suitability and authoring feasibility. All components are peers; prebuilt activities are conveniences, not a preferred tier; no section ranking, visual quota or mandatory sequence. Bullets teach numbered linear procedures and checklists; a list is not a universal replacement for prose. Consider Tables for attributes, cards for examples and Svg for spatial mechanisms. Flashcards introduce definitions. Text can teach connected prose and nuance. Tables compare facts, cards compare examples, diagrams explain space and charts require supplied/verified or labelled illustrative data; never invent benchmark results. Record rationale and presentation strategy, resolve relevant readiness warnings, then retrieve focused contracts. See planning references for views, evidence boundaries and safe retrieval fallback.

| Learning goal | Focused reference |
|---|---|
| Explain and orient | [TextContent](references/sections/text.md), [Text](references/openui/layouts.md), [Intro](references/sections/intro.md), [CodeBlock](references/openui/layouts.md), [Callout](references/openui/layouts.md) |
| Compare facts and examples | [Table](references/openui/charts.md), [Card](references/openui/layouts.md), [Stack](references/openui/layouts.md), [Tabs](references/openui/layouts.md) |
| Follow steps and processes | [Steps](references/openui/layouts.md), [Bullets](references/sections/bullets.md), [Flowchart](references/sections/flowchart.md), [UserJourney](references/sections/user-journey.md) |
| Explore relationships and categories | [ConceptMap](references/sections/concept-map.md), [TaxonomyBrowser](references/sections/taxonomy-browser.md), [PillarLayer](references/sections/pillar-layer.md), [Svg](references/openui/drawings.md) |
| Interpret quantities and change | [BarChart](references/openui/charts.md), [HorizontalBarChart](references/openui/charts.md), [LineChart](references/openui/charts.md), [AreaChart](references/openui/charts.md), [ScatterChart](references/openui/charts.md), [PieChart](references/openui/charts.md), [RadarChart](references/openui/charts.md), [Timeline](references/sections/timeline.md), [BreakdownTree](references/sections/breakdown-tree.md) |
| Explore choices and models | [TradeoffSandbox](references/sections/tradeoff-sandbox.md), [DecisionTree](references/sections/decision-tree.md), [Scenario](references/sections/scenario.md), [FormulaSandbox](references/sections/formula-sandbox.md) |
| Compose a local exploration | [Slider](references/openui/layouts.md), [Input](references/openui/layouts.md), [Select](references/openui/layouts.md), [SwitchGroup](references/openui/layouts.md), [Form](references/openui/layouts.md), [Button](references/openui/layouts.md) |
| Inspect visual references | [Image](references/openui/layouts.md), [ImageGallery](references/openui/layouts.md), [LearningGallery](references/sections/image-gallery.md) |
| Recall, apply and explain | [Flashcards](references/sections/flashcards.md), [Quiz](references/sections/quiz.md), [ReflectionSequence](references/sections/reflection-sequence.md), [ReflectionTemplate](references/sections/reflection-template.md) |

Flashcards teach definitions and meaning as well as recall. Tradeoff Sandbox presents options and compares their suitability as well as gains and costs. Select only what helps this topic; the table is not a mandatory sequence. Read [page composition and presentation](references/sections/openui.md) when combining components.

## Editing existing content

Read the current topic and affected section references first. Change only what the request needs. Keep SectionRef names, file names, IDs and narration in sync. For Studio/Viewer pointers or comments, read [Pick and comments](references/workflow/pick.md); respect requests to answer without editing.

Composition references are split into [layouts](references/openui/layouts.md), [tables and charts](references/openui/charts.md), [SVG drawings](references/openui/drawings.md), and [time, shares and utilization](references/openui/time-usage.md). Read only the families you use; these are part of the same catalog as prebuilt activities.
