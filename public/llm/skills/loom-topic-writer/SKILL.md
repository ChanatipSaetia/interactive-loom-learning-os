---
name: loom-topic-writer
description: "Write, extend or fix Interactive Loom learning topics: OpenUI Lang topic folders (topic.oui plus sections/<name>.oui) with interactive sections such as flowcharts, quizzes, flashcards, trade-off sandboxes, tables, charts and SVG drawings. Use when asked to create a Loom topic or lesson, turn notes or docs into a Loom topic, add or change a Loom section, fix errors reported by Loom Viewer or Loom Studio, or act on places and comments copied from their Pick mode."
---

# Loom Topic Writer

Interactive Loom turns OpenUI Lang (`.oui`) files into interactive lessons. `references/loom-authoring-prompt.md` is the full specification: topic layout, output formats, every component and prop, standard OpenUI sections (tables, charts, SVG drawings and other layouts) and the authoring rules.

## Before writing

1. Read `references/loom-authoring-prompt.md` in full. Do not write a section from memory; every component is positional and the signatures there are the only valid ones.
2. If the request is vague, ask at most two short questions (who the learner is, roughly how many sections). Otherwise start.
3. Read any source material the user points at (notes, docs, code) and teach only what it supports. Use real, specific facts and figures.

## Plan how to show the concept

- Before writing, identify what the learner should be able to picture or explain. When a spatial relationship, mechanism, structure or abstract idea is easier to understand visually, include a labelled concept drawing with `Svg`; do not wait for the learner to ask for a picture.
- Choose the visual that teaches the idea: a schematic or before/after drawing for a mechanism, a Flowchart for a process with actors, a chart for quantities, or a ConceptMap for relationships. A useful drawing can be the main section of a short topic; do not add decorative pictures or force a diagram into every topic.
- Pair the drawing with a short explanation of what to notice and why it matters. Name important shapes with IDs and use narration to highlight them one at a time, connecting each visible part to the concept. Clearly label analogies and simplifications; never imply that a schematic is to scale.
- Design for a phone: a few large labelled parts, readable text, strong theme-aware contrast and no overlapping labels. Split a dense drawing into simpler views. Prefer static SVG with narration highlights; use motion only when it explains a change, avoiding blur, filters and decorative animation.
- Follow the reference's `// @openui` section format and `Svg` signature. Keep the drawing a named child of a Card or Stack so Present narration can target `"drawing.shapeId"`.

## Time and Usage Visuals

- Proactively visualize time and quantities when they are central to the explanation; do not wait for the learner to request a chart. Use Timeline for measured start times, duration, parallel work and waiting; a custom Svg can show a qualitative event timeline, LineChart for change over time, HorizontalBarChart for comparing amounts, PieChart or SingleStackedBarChart for a flat share of one whole, BreakdownTree for a hierarchy of quantities or conditional probabilities, and stacked bars for used versus remaining capacity. Request the timeline guide for measured timelines, the breakdown-tree guide for hierarchical shares, and the openui guide for charts and custom Svg. Use source-backed figures for factual claims; clearly label intentional teaching examples as illustrative data. In Present, keep the whole visual visible while several narration steps highlight its phases, points, bars or slices, then explain the takeaway.
- During planning, look for claims such as “before/after”, “takes longer”, “grows over time”, “used more”, “most of the total”, or “nearly full”. Choose the visual that lets the learner see that relationship. Do not leave the central relationship buried in bullets or a table. Use these visuals when they teach the idea; do not add a chart quota to every topic.

| Learner's question | Visual | What it encodes |
|---|---|---|
| What happens when, and what takes longest? | `Timeline` | Ordered events or intervals; scale interval widths to duration when known. |
| How does a measurement change over time? | `LineChart` | Times on the horizontal axis, measured values on the vertical axis. |
| Which is used more, or handles more? | `HorizontalBarChart` | Comparable counts or amounts over the same observation window. |
| What fraction belongs to each category? | `PieChart` or `SingleStackedBarChart` | Mutually exclusive parts of the same whole; percentages sum to 100%. |
| How much capacity is used or remains? | Stacked `HorizontalBarChart` | Used and remaining values summing to 100% for each resource. |

- Say what is measured, its units, observation window and denominator. Request share is different from CPU utilization: more requests do not by themselves prove higher resource cost. Each capacity row has its own denominator; do not sum CPU, memory and storage percentages.
- Use real source data for factual claims. A deliberately constructed worked example is allowed when it teaches the mechanism: label it “illustrative data” visibly and in narration, and keep its arithmetic consistent. When quantitative data is unavailable, use a qualitative or explicitly not-to-scale schematic, or ask for measurements if exact comparison is essential; never invent measured performance or adoption figures.
- Show a few large, readable labels with a consistent palette. Use supported components and theme-aware Svg colors. Charts are composed `openui` sections; measured timing uses the dedicated `Timeline` section. There is no Utilization section type.

### OpenUI chart and custom Svg presentation recipe

- Use `root = Card([header, chart, takeaway], "clear")` (or Stack), with all three children named. The main beats are `title` → `part1` (measurement and context) → `part2` (whole visual) → `part3` (conclusion). Earlier parts stay visible; the chart remains in view for the takeaway. Keep content needed for presentation out of Tabs and Carousel.
- Write several `NarrationStep("part2", …)` entries to explain the visual without replacing it. Move the highlight through a timeline's phases, a line's start/peak/recovery, relevant comparison bars, slices of a whole, or capacity rows. Explain what the pattern means instead of only reading labels. Autoplay finishes those narration steps before advancing; Next advances a main beat, not one data point at a time.
- Target named visuals precisely: `drawing.processing` for an Svg shape's ID, `chart.series[0].values[1]` for a bar or line point, and `chart.values[0]` for a pie slice. Indices are zero-based. Give every narrated Svg shape a unique ID. Use a final takeaway to connect the highlighted evidence to the lesson.
- The worked examples in the authoring reference’s Time and Usage Visuals section are starting points, not a required five-section sequence. Choose only the visual the topic needs, replace example data and narration together, and validate the section plus every narration target.


## Bullet Composition

- Use Bullets for a checklist or a real hierarchy of points. Keep each parent a short headline and put its supporting details in child Bullet calls. Do not invent nesting just to change the layout. For an explanation that needs a diagram, comparison, chart or mixed content, choose a suitable standard OpenUI composition instead of a wall of prose.
- Choose a meaningful icon for each parent or sub-item when it helps recognition. Icons are independent: a child does not inherit its parent's icon. Reuse the same icon for the same meaning across a topic, rather than assigning a different decorative icon to every row.
- The only supported icon names are `list`, `check`, `shield`, `clock`, `key`, `lightbulb`, `target`, `users`, `chart`, `code`. Think access → key, timing → clock, safety → shield, people → users, goal → target, data/trend → chart, implementation → code, insight → lightbulb, verification → check, grouping → list. These names stay in English even in translated lessons. Do not invent icon names, use emoji as the icon argument, or assume every Lucide icon is supported.
- The signature is `Bullet(text, children?, icon?)`. To set a leaf's icon, skip children with `null`: `Bullet("Prepare **access**", null, "key")`. Icons are optional; existing content falls back to a checklist for parents and a branching arrow for sub-items. The same selection appears in Read and Present, and can be changed in Studio's Icon dropdown.
- Emphasize a few important words with `**bold phrases**` inside any parent or sub-item string. Leave the rest normal; do not bold whole paragraphs. Only inline bold is supported here: links, HTML and other Markdown are not a way to format a Bullet. Keep any extra explanation short enough to scan.
- Let Present measure and paginate the rendered content. Several points can share a page; narration reveals and highlights them in order, leaving earlier points visible. Do not create one section per bullet to force one point per page or script a fixed page count. Large groups continue with ancestor context; single-page lists omit their bottom agenda.
- Narration IDs describe points, not pages: `title`, then `item1`, `item1.child1`, `item1.child1.child1`, `item1.child2`, … in depth-first order, then `item2`, …. Write a step for every point even when they share a page. Explain the point's reason or an example instead of reading its headline verbatim; update narration when the hierarchy changes.

Example section (`sections/first-day.oui`):

```
root = Bullets("A productive first day", [access, goal])
access = Bullet("Prepare **access** before day one", [accounts, permissions], "key")
accounts = Bullet("Check **accounts** before Monday", null, "clock")
permissions = Bullet("Verify repository **permissions**", null, "shield")
goal = Bullet("Agree on the **first goal**", [task], "target")
task = Bullet("Pair with a **teammate** for the first task", null, "users")
```

Matching narration (`sections/first-day.narrate.oui`):

```
root = Narration([
  NarrationStep("title", "A little preparation makes the first day productive."),
  NarrationStep("item1", "Start by removing access blockers before the newcomer arrives."),
  NarrationStep("item1.child1", "Testing an account early leaves time to fix sign-in problems.", [Highlight("accounts")]),
  NarrationStep("item1.child2", "Signing in is only half the check: the account must also be allowed to open the project."),
  NarrationStep("item2", "Once access works, give the newcomer one clear outcome to aim for."),
  NarrationStep("item2.child1", "Working with a teammate connects that goal to a real task and gives questions somewhere to go.")
])
```

## Layer Composition

- Use `PillarLayer` when the learner needs to understand a foundation supporting higher responsibilities: network protocols or a deployment stack, for example. Put layers in top-to-bottom order with the foundation last. Horizontal position means peers within one level; place components inside their actual layer rather than making every component another layer.
- For simple contained bands in Present, use rectangular `MatrixBlock`s with `rowSpan = 1`. Keep titles short and put explanations in `description`: Present shows names only, while Read retains descriptions and dependency exploration. Use multi-row spans and shapes only when those relationships matter; those use the matrix presentation.
- A layer can contain several separate outer boxes. Set the trailing `group` argument on each block to its container's name, such as `"Tools"` or `"Knowledge"`. Matching names within the same layer share one box; different names form peer boxes on the same row. Blocks without a group share the layer-title box. Group names are authored explicitly and are scoped to the layer; they are not extra layers or inferred from titles.
- Present uses a soft color tint and accent border on each outer box, with neutral white inner items in the light theme (neutral surfaces in dark themes). Set `color` on the group's first block to choose its outer accent, and use a consistent color for the group's blocks. Keep subitems visually neutral; do not add colored cards, HTML, CSS, emoji or icon arguments to force a different item appearance.
- Use `colOffset` and `colSpan` to fill the grid without gaps or overlaps. In grouped Present rows, each box's width is proportional to its members' total column spans; items stay contained within their box. For example, Agent can hold Plan & Execute and Policy & Approvals, alongside separate Database and Cloud Run boxes at the same level.
- `MatrixBlock(id, title, layer, colOffset?, colSpan?, rowSpan?, description?, color?, dependsOn?, shape?, offsets?, group?)` is positional. Skip optional values with `null` before `group`, as in the example. Set `dependsOn` to real block IDs for Read's dependency tracing; shared group membership does not create dependencies.
- Narrate from the foundation upward. Beat IDs keep their authored top-to-bottom layer identity: for three layers, playback starts with `layer3`, then `layer2`, then `layer1`. Each layer's first group uses its `layerN` beat; later groups use `layerN.group2`, `layerN.group3`, … in first-appearance order among that layer's blocks. Earlier groups and layers stay visible. Finish with `overview` to connect the whole stack. The stage adds `title` before these beats. Explain what each level enables and how peer groups differ; narration can highlight individual block IDs without adding a beat per item. Label illustrative architectures and simplifications so learners do not mistake one deployment choice for a mandatory architecture.

Example section (`sections/agent-foundation.oui`):

```
root = PillarLayer("Actions and knowledge build on a foundation", [capabilities, foundation], [tools, connectors, retrieval, search, compute, storage])
capabilities = Layer("capabilities", "Tools & Knowledge")
foundation = Layer("foundation", "Cloud Foundation")
tools = MatrixBlock("tools", "Tool Execution", capabilities, 0, 1, 1, "Runs permitted actions.", "teal", ["compute"], null, null, "Tools")
connectors = MatrixBlock("connectors", "APIs & Connectors", capabilities, 1, 1, 1, "Connects to external services.", "teal", ["compute"], null, null, "Tools")
retrieval = MatrixBlock("retrieval", "Knowledge Retrieval", capabilities, 2, 1, 1, "Finds relevant source material.", "green", ["storage"], null, null, "Knowledge")
search = MatrixBlock("search", "Document Search", capabilities, 3, 1, 1, "Searches indexed documents.", "green", ["storage"], null, null, "Knowledge")
compute = MatrixBlock("compute", "Compute", foundation, 0, 2, 1, "Hosts the services.", "blue")
storage = MatrixBlock("storage", "Storage", foundation, 2, 2, 1, "Persists documents and indexes.", "blue")
```

Matching narration (`sections/agent-foundation.narrate.oui`):

```
root = Narration([
  NarrationStep("title", "Separate the capabilities an agent uses from the foundation that runs them."),
  NarrationStep("layer2", "Compute hosts the services, while storage persists their documents and indexes."),
  NarrationStep("layer1", "Tools perform actions. Connectors give those actions access to external services.", [Highlight("tools"), Highlight("connectors")]),
  NarrationStep("layer1.group2", "Knowledge capabilities find source material through retrieval and search.", [Highlight("retrieval"), Highlight("search")]),
  NarrationStep("overview", "Both action and knowledge services rely on the cloud foundation below. These boxes represent responsibilities, not a required deployment architecture.")
])
```

## Measured Timeline

Use the dedicated `Timeline` section for elapsed start times, durations, overlapping work, waiting and joins. A Flowchart sequence view explains messages and their order; its vertical spacing is not measured time. Prefer Timeline when duration is the teaching point. Use an OpenUI Svg only when a custom qualitative timeline is needed.

- `Timeline(title, lanes, activities, groups?, unit?, description?, takeaway?, heading?, lead?)` uses one shared time unit (default ms), with zero at the left. Declare participant/resource metadata with `TimelineLane(id, title, color?)` and `TimelineActivity(id, title, lane, start, duration, description?, dependsOn?)`. All times must be finite and nonnegative. Zero duration is a milestone.
- Dependencies are explicit finish-to-start activity IDs. A dependent activity cannot start before any dependency finishes. Every task gets a separate row, sorted top-to-bottom by start time; equal starts keep their authored order and align horizontally. The lane names a participant/resource, shown beneath the task title. Parallel tasks have overlapping start/end intervals, even if they share an owner. Do not add durations of overlapping work to calculate total elapsed time. The displayed total is the latest activity end measured from zero, including idle gaps.
- Explain parallel activities together using `TimelineGroup(id, title, activities, description?)`. Groups are ordered presentation stages and must cover every activity; the same activity may appear in multiple groups when explanation needs it. Without groups, activities sharing a start time form one stage automatically.
- Present beats are `title`, `overview`, `group1`, `group2`, …, `summary`. Overview and summary show the whole diagram. Stage beats highlight their activities together; dense schedules enlarge the current task rows with a whole-schedule map and the same absolute time axis. Prefer meaningful groups of a few related activities for a 15-item schedule; arrows within the current stage and a list of external prerequisites show what it waits for. Several narration steps can explain one stage. Keep labels short and put longer explanations in descriptions or narration. Read mode lets learners select an activity for its timing, explanation and dependencies.
- Use source-backed timing for factual claims. Clearly label a worked example as illustrative. Durations are encoded spatially; presentation animation speed does not represent execution time.

Example section (sections/parallel-retrieval.oui):

```
root = Timeline("Parallel retrieval · 200 ms elapsed", [request, database, search, agent], [validate, records, documents, compose], [prepare, retrieve, join], "ms", "Illustrative timings for one request; tasks are ordered by start time on a shared scale.", "20 + max(80, 150) + 30 = 200 ms elapsed. Running everything sequentially would take 280 ms.")
request = TimelineLane("request", "Request", "blue")
database = TimelineLane("database", "Database", "teal")
search = TimelineLane("search", "Search", "mauve")
agent = TimelineLane("agent", "Agent", "peach")
validate = TimelineActivity("validate", "Validate", request, 0, 20, "Validate the request before starting both retrieval tasks.")
records = TimelineActivity("records", "Fetch records", database, 20, 80, "Finishes at 100 ms; composing still waits for Search.", ["validate"])
documents = TimelineActivity("documents", "Find documents", search, 20, 150, "Runs concurrently with the database task and finishes at 170 ms.", ["validate"])
compose = TimelineActivity("compose", "Compose answer", agent, 170, 30, "Waits for both retrieval tasks. The request completes at 200 ms.", ["records", "documents"])
prepare = TimelineGroup("prepare", "Prepare the request", [validate], "Validation completes before retrieval begins.")
retrieve = TimelineGroup("retrieve", "Retrieve in parallel", [records, documents], "Both tasks start at 20 ms. Search takes longer; their durations overlap.")
join = TimelineGroup("join", "Wait for both, then compose", [compose], "Records are ready at 100 ms, but composing cannot start until Search finishes at 170 ms.")
```

Matching narration (sections/parallel-retrieval.narrate.oui):

```
root = Narration([
  NarrationStep("title", "Parallel tasks reduce elapsed time by overlapping work. These timings are illustrative."),
  NarrationStep("overview", "Read time from left to right. Every task row uses the same millisecond scale; bar widths represent durations."),
  NarrationStep("group1", "Validation takes the first twenty milliseconds, then both retrieval tasks can begin.", [Highlight("validate")]),
  NarrationStep("group2", "Database and Search start together at twenty milliseconds. Their bars overlap, so their durations do not add to elapsed time.", [Highlight("records"), Highlight("documents")]),
  NarrationStep("group2", "The database finishes at one hundred milliseconds. Search continues until one hundred seventy milliseconds.", [Highlight("documents")]),
  NarrationStep("group3", "Both arrows lead to Compose. It waits for the later dependency, then takes thirty milliseconds to finish at two hundred.", [Highlight("compose")]),
  NarrationStep("summary", "Total elapsed time is twenty plus the longer parallel task of one hundred fifty, plus thirty: two hundred milliseconds, rather than two hundred eighty sequentially.")
])
```

## Breakdown Trees

Use `BreakdownTree` to divide a measurable whole into a hierarchy: meal cost → dishes → ingredients, calories → meals → foods, spending → categories → expenses, populations → subgroups, or conditional outcomes. Choose Taxonomy for classification without quantities, DecisionTree for recommendations, Timeline for execution duration and overlap, and BreakdownTree for parts of a whole. Time allocation can be a breakdown when the parts sum to a budget; overlapping execution durations do not form such a partition.

- `BreakdownTree(title, nodes, mode?, unit?, description?, takeaway?, heading?, lead?)` takes `BreakdownNode(id, title, value, parent?, description?, color?)` entries. Exactly one node omits parent; every other node names a parent ID. IDs must be unique, all nodes must connect to the root, and cycles are invalid.
- Default `quantity` mode uses one unit for all nodes (USD, grams, requests, minutes, …). Every non-leaf node's children must sum to its value. Children must be mutually exclusive and exhaustive; do not double count categories or mix units. Author an Other category explicitly if the source has a remainder. Cards show absolute quantities and share of the total; branches show share of their parent. Zero totals display an undefined share rather than dividing by zero.
- `probability` mode uses conditional fractions from 0 to 1, leaves unit empty, and sets root value to 1. Each complete sibling set sums to 1. Branches show conditional probability; cards show overall probability, computed by multiplying along the path. This is the conditional-probability chain rule; do not claim the stages are independent. Use quantity mode for actual observed counts and their derived shares.
- Use short names, meaningful inherited branch colors, source-backed figures and one clear takeaway. Label deliberately constructed teaching examples as illustrative data. Descriptions explain denominators and assumptions; do not copy long paragraphs into node titles.
- Present beats: `title`, `overview`, `split1`, `split2`, …, `summary`. Split beats visit non-leaf nodes in depth-first authored child order. Overview and summary show the complete tree; each split enlarges its parent and immediate children, with an ancestry breadcrumb and the whole's value retained. The overall denominator always stays the original root, even in a focused subtree. Multiple narration steps can explain one split. Highlight named nodes; narrate the difference between share of parent and share of the whole.
- In Read, learners can select a node by click or keyboard to inspect its ancestry, description, percentages and probability calculation. Changing the hierarchy changes split beats, so update the narration too.

Cooking-cost section:

```
root = BreakdownTree("Where does the meal budget go?", [meal, main, side, protein, vegetables, rice, other], "quantity", "USD", "Illustrative cost of one meal. All values use the same currency.", "Protein costs 8 USD: 66.7% of the main dish, but 40% of the whole meal.")
meal = BreakdownNode("meal", "Whole meal", 20, null, "The total budget for the main dish and side dish.", "blue")
main = BreakdownNode("main", "Main dish", 12, "meal", "The main dish accounts for 60% of the meal cost.", "teal")
side = BreakdownNode("side", "Side dish", 8, "meal", "The side dish accounts for 40% of the meal cost.", "peach")
protein = BreakdownNode("protein", "Protein", 8, "main", "8 of the main dish's 12 dollars, and 8 of the meal's 20 dollars.")
vegetables = BreakdownNode("vegetables", "Vegetables", 4, "main", "The rest of the main dish costs 4 dollars.")
rice = BreakdownNode("rice", "Rice", 3, "side", "Rice accounts for 15% of the whole meal cost.")
other = BreakdownNode("other", "Other ingredients", 5, "side", "The remaining side-dish ingredients account for 25% of the whole meal cost.")
```

Matching narration:

```
root = Narration([
  NarrationStep("title", "A meal budget can be divided into dishes, then ingredients. These costs are illustrative."),
  NarrationStep("overview", "Start with the whole twenty-dollar meal. Branch percentages refer to the parent; card percentages refer to the entire meal."),
  NarrationStep("split1", "Twelve dollars goes to the main dish and eight to the side: sixty and forty percent of the total.", [Highlight("main"), Highlight("side")]),
  NarrationStep("split2", "The main dish's twelve dollars divides into eight for protein and four for vegetables.", [Highlight("protein"), Highlight("vegetables")]),
  NarrationStep("split2", "Protein is two thirds of the main dish, but forty percent of the whole meal. The denominator changes the percentage.", [Highlight("protein")]),
  NarrationStep("split3", "The side's eight dollars divides into three for rice and five for other ingredients.", [Highlight("rice"), Highlight("other")]),
  NarrationStep("summary", "Always name the whole you are comparing with: eight dollars can be sixty-six point seven percent of a dish and forty percent of a meal.")
])
```

Conditional-probability section:

```
root = BreakdownTree("Request outcome probabilities", [requests, cached, uncached, cachedSuccess, cachedFailure, uncachedSuccess, uncachedFailure], "probability", null, "Illustrative conditional probabilities; cached and uncached requests form a complete partition.", "A cached failure has probability 60% × 1% = 0.6% of all requests.")
requests = BreakdownNode("requests", "All requests", 1)
cached = BreakdownNode("cached", "Cached", 0.6, "requests", "60% of requests use the cache.", "teal")
uncached = BreakdownNode("uncached", "Uncached", 0.4, "requests", "40% of requests do not use the cache.", "mauve")
cachedSuccess = BreakdownNode("cachedSuccess", "Success", 0.99, "cached", "99% conditional on cached; 59.4% of all requests.")
cachedFailure = BreakdownNode("cachedFailure", "Failure", 0.01, "cached", "1% conditional on cached; 0.6% of all requests.")
uncachedSuccess = BreakdownNode("uncachedSuccess", "Success", 0.95, "uncached", "95% conditional on uncached; 38% of all requests.")
uncachedFailure = BreakdownNode("uncachedFailure", "Failure", 0.05, "uncached", "5% conditional on uncached; 2% of all requests.")
```

Matching narration:

```
root = Narration([
  NarrationStep("title", "A probability tree separates conditional chances from overall outcomes. These figures are illustrative."),
  NarrationStep("overview", "Branch labels show conditional probabilities; cards show the probability of reaching each node from the root."),
  NarrationStep("split1", "Sixty percent of requests are cached, and forty percent are uncached.", [Highlight("cached"), Highlight("uncached")]),
  NarrationStep("split2", "Within cached requests, one percent fail. Multiplying sixty percent by one percent gives zero point six percent of all requests.", [Highlight("cachedFailure")]),
  NarrationStep("split3", "Within uncached requests, five percent fail. Forty percent times five percent is two percent overall.", [Highlight("uncachedFailure")]),
  NarrationStep("summary", "Path probabilities multiply conditional chances. A branch percentage alone does not describe its share of all requests.")
])
```

## Where to write

Always write a **topic folder**, one file per program, using the "Folder of .oui files" format from the reference (not the single `.loom.oui` file it defaults to for chats):

```
<topic-id>/
  topic.oui            root = Topic(...) with one SectionRef per section, in reading order
  sections/
    intro.oui          root = Intro(...)
    <name>.oui         one section per file, no // === marker lines
    <name>.narrate.oui the narrator's script for that section in Present mode, one or more steps per beat (see "Narration Files" in the reference)
```

- **Inside the Interactive Loom repository** (it has `public/content/` and `src/core/learning-engine/`): create the folder at `public/content/<topic-id>/`.
- **The user names a folder**: create `<topic-id>/` inside it, or write straight into it if it is already a topic folder (it has `topic.oui`).
- **Anywhere else**: create `<topic-id>/` in the current directory.
- **In a chat app without a project folder** (the Claude app, where files go to an outputs folder for the user to download): write one `<topic-id>.loom.oui` file there instead (the "Single .oui file" format in the reference, saved as a file rather than a code block) and hand it to the user; Loom Viewer opens it with Open file or Paste text.
- **Editing an existing topic**: change only the files involved and keep `topic.oui`'s `SectionRef` list in step with the section files. Renaming a section means renaming its file and its `SectionRef`.
- Otherwise write a single `<topic-id>.loom.oui` file only when the user asks for one file; if they give you an existing `.loom.oui` file to change, edit that file.

## Check before you finish

- Every `SectionRef("<name>")` has a `sections/<name>.oui` file and every section file is listed once.
- Each file has exactly one `root =` statement, written first; every other statement is reachable from `root`.
- Arguments are positional; pass `null` to skip an optional argument before a later one.
- IDs are unique within their section and every ID reference (`next`, `root`, `solution`, `continuesAs`, …) points at an existing ID.
- Flowchart steps follow EVENT → POLICY → COMMAND → system → EVENT, and every actor and system is used by a step.
- Every flowchart step whose events go to another actor or system sets `sendsTo` (the Step / BranchOption argument after `description`); the Sequence and System Architecture views draw only declared messages.
- System `kind` says what it is (aggregate, service, database or external); events that move a StateMachine into a new state set `enters`; `data` names what an event carries when it matters; `async` marks fire-and-forget steps.
- Each quiz question has exactly one correct choice and only tests what an earlier section teaches.
- Section types are mixed and each section is shaped to its own content, not to the reference's examples; standard OpenUI sections (tables, charts, how-tos, code, cards) use literal data and vary in layout.
- Where a picture teaches better than words or a flowchart (the parts of an object, a layout, a shape, a mechanism), the section draws it with `Svg` (see "Drawings" in the reference): single-quoted markup, one `<svg>` with a viewBox, Loom palette color names, labelled parts, and an `id` on every shape the narration points at.
- Every section has a narration file `sections/<name>.narrate.oui` next to it, not listed in `topic.oui`: at least one `NarrationStep` per beat (several on a dense beat, each with its own effect), each naming a beat ID of that section type (the table in "Narration Files"), captions in the topic's language that explain rather than read the screen, and every target naming a statement of that section file (in a standard OpenUI section, one of the root's children, or one bar, point, slice or cell of a chart or table, or one shape of a drawing by its id, among them). Changing a section's items (questions, cards, paragraphs, steps) changes its beats, so update its narration file too. Renaming a section renames its narration file too.

## Pointers and comments from Loom Studio and Loom Viewer

People point at parts of a topic with **Pick** in Loom Studio or Loom Viewer and paste what it copies. Each pointer is one line:

```
kafka/sections/quiz-basics.oui:14 #q2.choices[1].explanation
```

- `kafka` is the topic ID and `sections/quiz-basics.oui` the file inside the topic folder. Find the folder that holds `kafka/topic.oui` (in the Interactive Loom repository: `public/content/kafka/`).
- `:14` is only a hint. The anchor after `#` is authoritative: `q2` is the statement `q2 = …`, and the rest follows its props by name and list positions (0-based) into inline components, using the prop names from the signatures in the reference. `#root` means the whole file. If the line does not hold the statement, search the file for `q2 =`.
- `(unsaved)` means the person has unsaved edits in Studio, so the file on disk may not have that statement yet; if it is missing, ask them to save.
- `(in kafka.loom.oui)` means the topic is in that single file: look for it in the workspace. `(from pasted text)` means there is no file; ask the person for the topic text.

What to do depends on the first line:

- **`Comments on the Loom topic "<id>":`** then a list. An indented note under a pointer is a change request for that place: make it, keep everything else unchanged, and follow the checks below. Pointers without a note are context.
- **`Answer about the Loom topic "<id>" (do not change any files):`** then a list and a question. Answer the question from the files; do not edit anything.
- **Pointer lines on their own** are mentions inside the person's own message: read those places and do what the message asks.

## Validate

- **Inside the Interactive Loom repository**: run `npx vitest run tests/unit/content` (compiles and validates every topic under `public/content/`) and fix every failure.
- **Elsewhere**: tell the user to open the topic folder in Loom Viewer (https://chanatipsaetia.github.io/interactive-loom-learning-os/viewer.html) with **Open folder**, or in Loom Studio (https://chanatipsaetia.github.io/interactive-loom-learning-os/studio.html) to edit it with a live preview. Its **Copy errors for your AI chat** button gives a fix request; when the user pastes one, fix only what it points at and keep everything else unchanged.

Finish with one or two lines: the topic folder you wrote and how to open it (Loom Viewer's **Open folder**, or `npm run dev` in the repository).
