## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

Timeline(title: string, lanes: TimelineLane[], activities: TimelineActivity[], groups?: TimelineGroup[], unit?: string, description?: string, takeaway?: string, heading?: string, lead?: Lead) — Measured task timeline: one row per activity, sorted by start time, with duration-scaled bars, parallel work and finish-to-start dependencies. Present keeps the whole diagram visible while focusing authored groups.
  - title: Section title, shown in the topic outline and as the section header.
  - lanes: Participant or resource metadata for task labels and colors; task rows are ordered automatically by start time.
  - activities: Timed activities; bars use one shared scale across all lanes.
  - groups: Optional ordered presentation groups; cover every activity. Without groups, activities sharing a start time are explained together.
  - unit: Time unit for every start and duration; default "ms". Use a consistent unit.
  - description: Optional context, including whether timing is measured or illustrative.
  - takeaway: Optional conclusion shown on the final summary beat.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
TimelineLane(id: string, title: string, color?: "blue" | "teal" | "green" | "mauve" | "peach" | "sky" | "yellow" | "pink" | "lavender") — A named participant or resource used as a task’s secondary label and color. Each task gets its own row.
  - id: Lane ID, unique within the timeline.
  - title: Readable lane name.
  - color: Optional theme accent for the lane and its activities.
TimelineActivity(id: string, title: string, lane: string | TimelineLane, start: number, duration: number, description?: string, dependsOn?: string[]) — Activity positioned by elapsed start time and duration; zero duration represents a milestone.
  - id: Activity ID, unique within the timeline.
  - title: Short readable activity name.
  - lane: TimelineLane reference or ID.
  - start: Elapsed start time from zero, in the timeline unit.
  - duration: Duration in the same unit; zero is a milestone.
  - description: Optional explanation shown on selection in Read mode.
  - dependsOn: Optional activity IDs that must finish before this activity starts; draws dependency connectors.
TimelineGroup(id: string, title: string, activities: (string | TimelineActivity)[], description?: string) — Activities explained together on one presentation beat, including parallel work or a join.
  - id: Group ID, unique within the timeline.
  - title: Short stage name shown in Present.
  - activities: Activities to highlight together, as references or IDs; include parallel activities in one group.
  - description: Optional explanation of what this stage means.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### Timeline: teaching purpose

- Introduce: Explain when work happens, measured duration, overlap, dependencies and waiting, including scheduling and performance examples.
- Explore: Inspect authored start times, durations and groups to explain elapsed time and concurrency.
- Evidence: Ask the learner to interpret overlap, waiting or completion time; selecting an activity alone is engagement.
- Limits: Use verified values or clearly labelled illustrative timings with units. Geometry must follow those values. Sequence order alone does not establish duration or causation.

## Measured Timeline

Use the dedicated `Timeline` section for elapsed start times, durations, overlapping work, waiting and joins. A Flowchart sequence view explains messages and their order; its vertical spacing is not measured time. Prefer Timeline when duration is the teaching point. Use an OpenUI Svg only when a custom qualitative timeline is needed.

- `Timeline(title, lanes, activities, groups?, unit?, description?, takeaway?, heading?, lead?)` uses one shared time unit (default ms), with zero at the left. Declare participant/resource metadata with `TimelineLane(id, title, color?)` and `TimelineActivity(id, title, lane, start, duration, description?, dependsOn?)`. All times must be finite and nonnegative. Zero duration is a milestone.
- Dependencies are explicit finish-to-start activity IDs. A dependent activity cannot start before any dependency finishes. Every task gets a separate row, sorted top-to-bottom by start time; equal starts keep their authored order and align horizontally. The lane names a participant/resource, shown beneath the task title. Parallel tasks have overlapping start/end intervals, even if they share an owner. Do not add durations of overlapping work to calculate total elapsed time. The displayed total is the latest activity end measured from zero, including idle gaps.
- Explain parallel activities together using `TimelineGroup(id, title, activities, description?)`. Groups are ordered presentation stages and must cover every activity; the same activity may appear in multiple groups when explanation needs it. Without groups, activities sharing a start time form one stage automatically.
- Present beats are `title`, `overview`, `group1`, `group2`, …, `summary`. Overview and summary show the whole diagram. Stage beats highlight their activities together; dense schedules enlarge the current task rows with a whole-schedule map and the same absolute time axis. Prefer meaningful groups of a few related activities for a 15-item schedule; arrows within the current stage and a list of external prerequisites show what it waits for. Several narration steps can explain one stage. Keep labels short and put longer explanations in descriptions or narration. Read mode lets learners select an activity for its timing, explanation and dependencies.
- Use source-backed timing for factual claims. Clearly label a worked example as illustrative. Durations are encoded spatially; presentation animation speed does not represent execution time.

Example section (sections/parallel-retrieval.oui):

```
root = Page("Parallel retrieval · 200 ms elapsed", Timeline("Parallel retrieval · 200 ms elapsed", [request, database, search, agent], [validate, records, documents, compose], [prepare, retrieve, join], "ms", "Illustrative timings for one request; tasks are ordered by start time on a shared scale.", "20 + max(80, 150) + 30 = 200 ms elapsed. Running everything sequentially would take 280 ms."))
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

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### Timeline presentation beats
`title`, then `overview` (whole timeline), `group1`, `group2`, … (authored groups or activities sharing a start time), `summary` (whole timeline and takeaway)
