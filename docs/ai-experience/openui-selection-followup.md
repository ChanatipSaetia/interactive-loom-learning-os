# OpenUI selection follow-up to Issue 198

The user confirmed that the same Three.js/Spline full-lesson request now produced
too many Bullets. No original TopicPlan or client trace was supplied. This patch
uses authored positive/negative cases for that request; it does not claim to
measure autonomous model choices.

## Baseline and decisions

PR 200 was merged into master at `6ec6130eb1399715a41a27a9e38fc75625d26e02`.
Its tree matches the local working baseline. It carries representation review
through delivery but emphasizes Text selection. OpenUI discovery only listed
component families, without linking them to teaching tasks. A focused Card/Stack
request expanded the generic child union into 75 component contracts, making
visual composition disproportionately expensive to author. Full guidance also
encouraged layout variety without a learning purpose.

Workflow v5 now asks assistants to consider OpenUI alongside native candidates:
tables for matched factual attributes, cards for examples, labelled Svg for
spatial mechanisms, Steps for visual stages, and charts when data is supplied,
verified or explicitly illustrative. A table preserves a comparison; a diagram
preserves spatial relationships. Bullets remain appropriate for actual
instructions, prerequisites, checklists, key points and summaries. Text remains
appropriate for connected explanations and nuanced qualifications. Simplicity
means clarity for the learner, not merely the cheapest authoring syntax.

There is no section quota, type ranking, new endpoint, schema requirement or
server-side model. All 19 native sections and OpenUI remain first-class.

## Focused authoring

After selecting a composition, call the existing tool:

```json
{"detail":"focused","library":"openui","components":["Stack","Card","CardHeader","TextContent"]}
```

This returns the four exact signatures, compact OpenUI rules and beat guidance.
Generic layout children are alternatives: request each component actually used.
Specific model dependencies still expand automatically (Table → Col, BarChart →
Series, Steps → StepsItem, Tabs → TabItem). Legacy retrieval keeps its existing
closure. Canonical signatures and the actual renderer/validator are unchanged.
Full section guides remain available for examples and fallback.

This request dropped from about 5,429 to 1,606 estimated tokens; the selected
contract body is about 681 versus 4,489 for the legacy closure. These estimates
use characters/4, not provider billing. Exact measurements are emitted by the
offline harness in `artifacts/ai-openui-selection-regression.json`.

## Plan and diagnostics

An example section within the existing TopicPlan schema:

```json
{
  "id":"comparison",
  "title":"Compare authoring approaches",
  "objectiveRefs":["compare"],
  "representation":"openui",
  "library":"openui",
  "activity":"Look up matching authoring attributes across Three.js and Spline",
  "rationale":"A factual table aligns both tools across the same attributes without inventing performance measurements.",
  "presentation":{"target":"both","strategy":"composition: Table; compare matching attribute rows in Read and Present"}
}
```

The new `LIST_STRUCTURE_REVIEW` advisory examines section-local English cues for
comparison, spatial knowledge and relationships. It asks whether a list preserves
that structure and suggests a relevant native model or OpenUI table/cards/diagram.
Explicit list activities (including numbered instructions, prerequisites,
checklists and summaries) are exempt. It does not count Bullets or block delivery.
This conservative heuristic cannot assess semantic teaching quality; a warning
requires author review, and its absence does not certify quality. Structural
validity remains separate from readiness.

The comprehensive fixture adds a labelled camera-view diagram with highlights
targeting `figure.inside` and `figure.outside`. It teaches spatial visibility,
distinct from Flowchart's component participation and message ordering. The
existing Flowchart starts in `architecture` and changes to `sequence` during
narration, with no invented states or data. Setup remains numbered Bullets;
definitions, examples, option evaluation and assessment retain their different
purposes. Neither clicking nor viewing is counted as mastery.

## Verification

The regression suite checks positive OpenUI discovery and contract efficiency,
exact signatures, preserved required models and legacy behavior, list-heavy
negative plans, legitimate Bullets, a valid factual table, SVG target/narration
validation and the complementary lesson. The browser harness derives sections
from the fixture rather than assuming a fixed count, so the added diagram is
covered at mobile/tablet widths in Read and Present. CI uploads the regression
measurements with its existing screenshots and layout diagnostics.

The follow-up PR records actual full-suite, build, runtime and browser outcomes.
External-model representation fit and learner mastery are not measured. A live
client needs the merged/deployed build and refreshed instructions/contracts;
local changes alone cannot change its choices.

Local results before publication:

- TypeScript and generated-artifact consistency passed.
- Full unit/integration run: 209 files, 2,177 passed, 14 skipped (344.11 seconds).
- Subsequent expanded list-exemption regression: 13 passed.
- Offline harness: 19 passed, including OUI/narration and unchanged cost gates.
- Production Worker/local MCP build passed; Worker 638.12 kB uncompressed.
- Both local MCP packaging and Worker bundle guards passed.
- Chromium exited before assertions (sandbox operation denied); local workerd did
  not become ready. The PR's CI run supplies actual browser/runtime evidence.

The initial CI browser assertion exposed a harness assumption: Next finishes an
active entrance before advancing. The harness now observes the active progress
rail tick and advances with a bounded loop before asserting diagram visibility.
It retains the visibility assertions; the production player is unchanged.
