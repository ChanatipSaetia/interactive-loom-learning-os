# Section type: `timeline`

Timeline teaches measured duration, overlapping work, waiting and joins. Horizontal positions and bar widths encode elapsed time in one unit. Each task occupies its own row, sorted by start time from top to bottom. Equal starts keep authored order and align left edges. Participant/resource names appear beneath task names. Flowchart's Sequence view instead teaches messages and their order; its vertical spacing has no measured duration.

## Authoring

```
root = Timeline("Parallel work", [lane], [first, second], [], "ms", "Illustrative timing.", "The second activity waits for the first.")
lane = TimelineLane("worker", "Worker", "blue")
first = TimelineActivity("first", "Prepare", lane, 0, 20)
second = TimelineActivity("second", "Execute", lane, 20, 80, "Begins when preparation completes.", ["first"])
```

- `Timeline(title, lanes, activities, groups?, unit?, description?, takeaway?, heading?, lead?)`
- `TimelineLane(id, title, color?)`: participant/resource metadata for task labels and colors; it does not combine tasks into one visual row. Supported accents: blue, teal, green, mauve, peach, sky, yellow, pink, lavender.
- `TimelineActivity(id, title, lane, start, duration, description?, dependsOn?)`: elapsed start time and duration, both finite and nonnegative. Zero duration is a milestone. `lane` is a reference or lane ID. `dependsOn` lists activity IDs with finish-to-start semantics.
- `TimelineGroup(id, title, activities, description?)`: an explanation stage highlighting activity references or IDs together. Declare stages in explanation order. Explicit groups must cover all activities and may revisit activities. Without groups, shared start times form stages automatically.

Keep one consistent time unit (default `ms`). The axis starts at zero. Total elapsed time is the maximum activity end, including idle periods. It is not the sum of activity durations. A dependency must exist, cannot refer to itself or form a cycle, and must finish before the dependent activity starts. All lanes and activities require unique IDs within their list; groups require unique IDs too. Every task gets a separate row regardless of its participant. Overlaps are visible through aligned positions on the shared horizontal time axis.

Use source-backed timing for factual claims; mark constructed examples as illustrative data. No runtime animation claims to simulate physical execution speed.

## Read and Present

Read shows the complete shared scale, activities, times and dependency arrows. Select an activity by click, Enter or Space to inspect its duration, explanation and dependency links. Selection emits `TimelineActivitySelected`. Narrow Read layouts scroll horizontally to preserve readable labels.

Present opens on the whole diagram. Small schedules keep all activities visible on stage beats. Dense schedules (over ten activities or a tall layout) enlarge the current group’s task rows, retaining a whole-schedule context map. The horizontal axis always keeps the original zero and total elapsed time, so shorter tasks are never normalized into full-length bars. Overview and summary show every activity; external prerequisites for a detailed group are listed beneath it. Parallel activities should share a group, so highlighting them does not imply sequential execution. Incoming dependency arrows are emphasized with the current stage. The final summary returns attention to the whole picture and the authored takeaway.

Beats: `title`, `overview`, `group1`, `group2`, …, `summary`. Multiple narration steps may explain one group. Narration highlights target named activities, such as `Highlight("records")` and `Highlight("documents")` on the same `group2` step. Put narration in `sections/<name>.narrate.oui` as usual.

The Studio Timeline starter includes the four-task parallel-retrieval example, with 20 ms validation, overlapping 80 ms database and 150 ms search, and 30 ms composition after both finish: total 200 ms rather than 280 ms sequentially. The visual form edits lanes, activities, time units, descriptions, dependencies and ordered presentation groups. Removing activities also removes their dependency and group references.

## Delivery

Section data uses `type: timeline`, `lanes`, `activities`, `groups`, `unit`, `description` and `takeaway`. Activity dependencies use `depends_on` in domain data. `bundleToSections` passes this data as the `section` prop to the registered renderer and presenter. OUI printing preserves the whole model. The legacy OKF reader accepts a YAML data resource with the same shape. Schema/reference errors use the validation gateway diagnostics and the last-valid preview behavior.
