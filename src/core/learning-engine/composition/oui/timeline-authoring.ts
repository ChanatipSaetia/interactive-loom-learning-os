export const TIMELINE_EXAMPLE = `root = Timeline("Parallel retrieval · 200 ms elapsed", [request, database, search, agent], [validate, records, documents, compose], [prepare, retrieve, join], "ms", "Illustrative timings for one request; tasks are ordered by start time on a shared scale.", "20 + max(80, 150) + 30 = 200 ms elapsed. Running everything sequentially would take 280 ms.")
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
`
export const TIMELINE_NARRATION_EXAMPLE = `root = Narration([
  NarrationStep("title", "Parallel tasks reduce elapsed time by overlapping work. These timings are illustrative."),
  NarrationStep("overview", "Read time from left to right. Every task row uses the same millisecond scale; bar widths represent durations."),
  NarrationStep("group1", "Validation takes the first twenty milliseconds, then both retrieval tasks can begin.", [Highlight("validate")]),
  NarrationStep("group2", "Database and Search start together at twenty milliseconds. Their bars overlap, so their durations do not add to elapsed time.", [Highlight("records"), Highlight("documents")]),
  NarrationStep("group2", "The database finishes at one hundred milliseconds. Search continues until one hundred seventy milliseconds.", [Highlight("documents")]),
  NarrationStep("group3", "Both arrows lead to Compose. It waits for the later dependency, then takes thirty milliseconds to finish at two hundred.", [Highlight("compose")]),
  NarrationStep("summary", "Total elapsed time is twenty plus the longer parallel task of one hundred fifty, plus thirty: two hundred milliseconds, rather than two hundred eighty sequentially.")
])
`
export const TIMELINE_AUTHORING_GUIDE = `## Measured Timeline

Use the dedicated \`Timeline\` section for elapsed start times, durations, overlapping work, waiting and joins. A Flowchart sequence view explains messages and their order; its vertical spacing is not measured time. Prefer Timeline when duration is the teaching point. Use an OpenUI Svg only when a custom qualitative timeline is needed.

- \`Timeline(title, lanes, activities, groups?, unit?, description?, takeaway?, heading?, lead?)\` uses one shared time unit (default ms), with zero at the left. Declare participant/resource metadata with \`TimelineLane(id, title, color?)\` and \`TimelineActivity(id, title, lane, start, duration, description?, dependsOn?)\`. All times must be finite and nonnegative. Zero duration is a milestone.
- Dependencies are explicit finish-to-start activity IDs. A dependent activity cannot start before any dependency finishes. Every task gets a separate row, sorted top-to-bottom by start time; equal starts keep their authored order and align horizontally. The lane names a participant/resource, shown beneath the task title. Parallel tasks have overlapping start/end intervals, even if they share an owner. Do not add durations of overlapping work to calculate total elapsed time. The displayed total is the latest activity end measured from zero, including idle gaps.
- Explain parallel activities together using \`TimelineGroup(id, title, activities, description?)\`. Groups are ordered presentation stages and must cover every activity; the same activity may appear in multiple groups when explanation needs it. Without groups, activities sharing a start time form one stage automatically.
- Present beats are \`title\`, \`overview\`, \`group1\`, \`group2\`, …, \`summary\`. Overview and summary show the whole diagram. Stage beats highlight their activities together; dense schedules enlarge the current task rows with a whole-schedule map and the same absolute time axis. Prefer meaningful groups of a few related activities for a 15-item schedule; arrows within the current stage and a list of external prerequisites show what it waits for. Several narration steps can explain one stage. Keep labels short and put longer explanations in descriptions or narration. Read mode lets learners select an activity for its timing, explanation and dependencies.
- Use source-backed timing for factual claims. Clearly label a worked example as illustrative. Durations are encoded spatially; presentation animation speed does not represent execution time.

Example section (sections/parallel-retrieval.oui):

\`\`\`
${TIMELINE_EXAMPLE}\`\`\`

Matching narration (sections/parallel-retrieval.narrate.oui):

\`\`\`
${TIMELINE_NARRATION_EXAMPLE}\`\`\``
