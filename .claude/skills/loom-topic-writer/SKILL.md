---
name: loom-topic-writer
description: "Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables, charts and SVG drawings. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, fix errors reported by Loom Viewer or Loom Studio, or act on places and comments copied from their Pick mode."
---

# Loom Topic Writer

Write, extend or repair Interactive Loom lessons as OpenUI Lang (.oui) content. Loom renders the UI; this skill authors topic, section and narration files.

## Reading order

Paths below are relative to this skill folder. Read the linked files, not only this entry point. Load only the references relevant to the task; do not read every section spec.

1. Read the user's source material. Establish the learner and goal; ask at most two short questions only when needed.
2. Follow the [shared authoring workflow](references/planning/workflow.md): identify the learner action, discover candidate formats, make and check a TopicPlan, then retrieve component-scoped contracts. Start at the [component-purpose index](references/planning/component-purposes.md), follow plausible candidates, and retrieve only selected component contracts. Prebuilt activities are conveniences within the same catalog. Read [mental models](references/planning/mental-models.md) for selection cues, flowchart views and chart choices, and [visual planning](references/planning/visuals.md) before planning a new lesson. Proactively illustrate time, quantities, structure or mechanisms when they teach the idea.
3. Before writing any OUI, read [syntax](references/core/syntax.md), [topic and shared components](references/core/components.md), [authoring rules](references/core/rules.md), [output location](references/workflow/output.md) and [file formats](references/core/formats.md). The workflow's folder default takes precedence over generic chat output examples. Use exact positional signatures; never invent arguments or write from memory.
4. Read the focused reference for each selected component below. It contains the selected components, field descriptions and presentation beats. For Present, also read [narration](references/core/narration.md). Write a narration file for every section and cover every beat. Include useful [learner reference links](references/core/learner-references.md) for deeper reading; keep the lesson self-contained.
5. Write the files, then follow [validation and delivery](references/workflow/validation.md). A complete [topic example](references/examples/topic.md) is available when needed; adapt to the learner rather than copying its lesson structure.

## Choose the mental model

Learning-first, representation-aware: objective → knowledge structure → learner action → candidate capabilities → simplest faithful representation/configuration. Compare knowledge fidelity, learner action, perspective coverage, cognitive clarity, assessment suitability and authoring feasibility. All components are peers; prebuilt activities are conveniences, not a preferred tier; no section ranking, visual quota or mandatory sequence. Bullets teach numbered linear procedures and checklists; a list is not a universal replacement for prose. Consider Tables for attributes, cards for examples and Svg for spatial mechanisms. Flashcards introduce definitions. Text can teach connected prose and nuance. Tables compare facts, cards compare examples, diagrams explain space and charts require supplied/verified or labelled illustrative data; never invent benchmark results. Record rationale and presentation strategy, resolve relevant readiness warnings, then retrieve focused contracts. TradeoffSandbox also teaches explained comparisons without a decision or scores. See planning references for views, evidence boundaries and safe retrieval fallback.

| Learning goal | Focused reference |
|---|---|
| Explain and orient | [TextContent](references/components/TextContent.md), [Text](references/components/Text.md), [Intro](references/components/Intro.md), [CodeBlock](references/components/CodeBlock.md), [Callout](references/components/Callout.md) |
| Compare and evaluate | [Table](references/components/Table.md), [TradeoffSandbox](references/components/TradeoffSandbox.md), [Card](references/components/Card.md), [Stack](references/components/Stack.md), [Tabs](references/components/Tabs.md) |
| Follow steps and processes | [Steps](references/components/Steps.md), [Bullets](references/components/Bullets.md), [Flowchart](references/components/Flowchart.md), [UserJourney](references/components/UserJourney.md) |
| Explore relationships and categories | [ConceptMap](references/components/ConceptMap.md), [TaxonomyBrowser](references/components/TaxonomyBrowser.md), [PillarLayer](references/components/PillarLayer.md), [Svg](references/components/Svg.md) |
| Interpret quantities and change | [BarChart](references/components/BarChart.md), [HorizontalBarChart](references/components/HorizontalBarChart.md), [LineChart](references/components/LineChart.md), [AreaChart](references/components/AreaChart.md), [ScatterChart](references/components/ScatterChart.md), [PieChart](references/components/PieChart.md), [RadarChart](references/components/RadarChart.md), [Timeline](references/components/Timeline.md), [BreakdownTree](references/components/BreakdownTree.md) |
| Explore choices and models | [DecisionTree](references/components/DecisionTree.md), [Scenario](references/components/Scenario.md), [FormulaSandbox](references/components/FormulaSandbox.md) |
| Compose a local exploration | [Slider](references/components/Slider.md), [Input](references/components/Input.md), [Select](references/components/Select.md), [SwitchGroup](references/components/SwitchGroup.md), [Form](references/components/Form.md), [Button](references/components/Button.md) |
| Inspect visual references | [Image](references/components/Image.md), [ImageGallery](references/components/ImageGallery.md), [LearningGallery](references/components/LearningGallery.md) |
| Recall, apply and explain | [Flashcards](references/components/Flashcards.md), [Quiz](references/components/Quiz.md), [ReflectionSequence](references/components/ReflectionSequence.md), [ReflectionTemplate](references/components/ReflectionTemplate.md) |

Flashcards teach definitions and meaning as well as recall. Tradeoff Sandbox presents options and compares their suitability as well as gains and costs. Select only what helps this topic; the table is not a mandatory sequence. Read [page composition and presentation](references/sections/openui.md) when combining components.

## Editing existing content

Read the current topic and affected section references first. Change only what the request needs. Keep SectionRef names, file names, IDs and narration in sync. For Studio/Viewer pointers or comments, read [Pick and comments](references/workflow/pick.md); respect requests to answer without editing.

Composition references are split into [layouts](references/openui/layouts.md), [tables and charts](references/openui/charts.md), [SVG drawings](references/openui/drawings.md), and [time, shares and utilization](references/openui/time-usage.md). Read only the families you use; these are part of the same catalog as prebuilt activities.
